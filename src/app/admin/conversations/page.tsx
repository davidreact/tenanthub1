"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "../../../../supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, MessageSquare, Send, User } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { createTenantNotification } from "@/lib/notifications";
import { useCSRF } from "@/hooks/useCSRF";

interface Message {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_id: string;
  users: {
    full_name: string;
    name: string;
  };
}

interface Conversation {
  id: string;
  tenant_id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  users: {
    full_name: string;
    name: string;
    email: string;
  };
  properties: {
    name: string;
    address: string;
  };
  messages: Message[];
}

export default function AdminConversationsContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { csrfToken, loading: csrfLoading, error: csrfError } = useCSRF();

  const scope = pathname.startsWith('/pm-dashboard') ? 'pm' : 'admin';

  useEffect(() => {
    fetchConversations();
  }, [scope]);

  // Open specific conversation from deep link (?conversationId=...)
  useEffect(() => {
    const targetId = searchParams.get("conversationId");
    if (!targetId || !conversations.length) return;
    const convo = conversations.find((c) => c.id === targetId);
    if (convo) {
      setSelectedConversation(convo);
      setIsDialogOpen(true);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  }, [conversations, searchParams, setIsDialogOpen]);

  // Realtime updates for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;
    const channel = supabase
      .channel(`admin-convo:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMsg: any = payload.new;
          setSelectedConversation((prev) => {
            if (!prev) return prev;
            const idx = (prev.messages as any[]).findIndex(
              (m: any) =>
                typeof m.id === "string" &&
                (m.id as string).startsWith("temp-") &&
                m.message === newMsg.message &&
                m.sender_id === newMsg.sender_id
            );
            const normalized: Message = {
              id: newMsg.id,
              message: newMsg.message,
              is_admin: newMsg.is_admin,
              created_at: newMsg.created_at,
              sender_id: newMsg.sender_id,
              users: prev.users, // keep tenant user context for display
            };
            let nextMessages = [...prev.messages];
            if (idx !== -1) nextMessages[idx] = normalized;
            else if (!prev.messages.some((m) => m.id === newMsg.id)) nextMessages.push(normalized);
            return { ...prev, messages: nextMessages };
          });
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConversation.id
                ? {
                    ...c,
                    messages: [
                      ...c.messages,
                      {
                        id: newMsg.id,
                        message: newMsg.message,
                        is_admin: newMsg.is_admin,
                        created_at: newMsg.created_at,
                        sender_id: newMsg.sender_id,
                        users: c.users,
                      } as Message,
                    ],
                    updated_at: new Date().toISOString(),
                  }
                : c
            )
          );
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id, supabase]);

  // Auto-scroll on message changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages?.length]);

  const fetchConversations = async () => {
    try {
      const scope = window.location.pathname.startsWith('/pm-dashboard') ? 'pm' : 'admin';
      let query = supabase
        .from("conversations")
        .select(
          `
          *,
          users (full_name, name, email),
          properties (name, address),
          messages (
            *,
            users (full_name, name)
          )
        `,
        )
        .order("updated_at", { ascending: false });

      if (scope === 'pm') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: pmProperties } = await supabase
            .from("properties")
            .select("id")
            .eq("managed_by", user.id);
          const propertyIds = pmProperties?.map(p => p.id) || [];
          if (propertyIds.length > 0) {
            query = query.in("tenant_id",
              (await supabase.from("tenant_properties").select("tenant_id").in("property_id", propertyIds)).data?.map(tp => tp.tenant_id) || []
            );
          }
        }
      }

      const { data } = await query;

      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, message: string, csrfToken: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Optimistic UI
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: Message = {
        id: tempId,
        message,
        is_admin: true,
        created_at: new Date().toISOString(),
        sender_id: user.id,
        users: { full_name: "Admin", name: "Admin" },
      };
      setSelectedConversation((prev) =>
        prev && prev.id === conversationId
          ? { ...prev, messages: [...prev.messages, optimisticMsg] }
          : prev
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, optimisticMsg], updated_at: new Date().toISOString() }
            : c
        )
      );

      // Send via API with CSRF protection
      const response = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message,
          csrfToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      // Notify tenant about new admin message
      const convo = selectedConversation || conversations.find((c) => c.id === conversationId);
      const tenantId = (convo as any)?.tenant_id;
      if (tenantId) {
        try {
          await createTenantNotification({
            tenantId,
            title: "New message from admin",
            message: message.length > 140 ? message.slice(0, 140) + "…" : message,
            type: "info",
            entityType: "message",
            entityId: conversationId,
          });
        } catch (e) {
          console.warn("Failed to create tenant notification:", e);
        }
      }

      setNewMessage("");
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateConversationStatus = async (
    conversationId: string,
    status: string,
  ) => {
    try {
      await supabase
        .from("conversations")
        .update({ status })
        .eq("id", conversationId);

      fetchConversations(); // Refresh conversations

      toast({
        title: "Conversation Updated",
        description: `Conversation has been ${status}.`,
      });
    } catch (error) {
      console.error("Error updating conversation status:", error);
      toast({
        title: "Error",
        description: "Failed to update conversation status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={pathname.startsWith('/pm-dashboard') ? "/pm-dashboard" : "/admin"}
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              {t("messages.conversations")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("messages.manageTenantCommunications")}
            </p>
          </div>
        </div>

        {/* Conversations List */}
        <div className="space-y-6">
          {conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {conversation.subject}
                    </CardTitle>
                    <CardDescription>
                      From:{" "}
                      {conversation.users.full_name || conversation.users.name}{" "}
                      ({conversation.users.email})
                      {conversation.properties && (
                        <span> • Property: {conversation.properties.name}</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(conversation.priority)}>
                      {conversation.priority} priority
                    </Badge>
                    <Badge className={getStatusColor(conversation.status)}>
                      {conversation.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>Messages: {conversation.messages?.length || 0}</p>
                  <p>
                    Last updated:{" "}
                    {new Date(conversation.updated_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Dialog
                    open={isDialogOpen && selectedConversation?.id === conversation.id}
                    onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (!open) {
                        setSelectedConversation(null);
                        // Clear query so subsequent notification clicks to the same URL re-open the dialog
                        router.replace("/admin/conversations");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedConversation(conversation);
                          setIsDialogOpen(true);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View Messages
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-[1400px] h-[85vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle>{conversation.subject}</DialogTitle>
                        <DialogDescription>
                          Conversation with{" "}
                          {conversation.users.full_name ||
                            conversation.users.name}
                        </DialogDescription>
                      </DialogHeader>
                      {selectedConversation && (
                        <div className="flex flex-col h-[calc(85vh-140px)] gap-4">
                          {/* Messages */}
                          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 border rounded p-4">
                            {selectedConversation.messages?.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.is_admin ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    message.is_admin
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-200 text-gray-900"
                                  }`}
                                >
                                  <p className="text-sm">{message.message}</p>
                                  <p
                                    className={`text-xs mt-1 ${
                                      message.is_admin
                                        ? "text-blue-100"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {message.is_admin
                                      ? "Admin"
                                      : message.users?.full_name ||
                                        message.users?.name ||
                                        "Tenant"}{" "}
                                    •
                                    {new Date(
                                      message.created_at,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>

                          {/* Reply Form */}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!csrfToken) {
                                toast({
                                  title: t("common.error"),
                                  description: "Security token missing. Please refresh and try again.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              if (newMessage.trim()) {
                                sendMessage(
                                  selectedConversation.id,
                                  newMessage,
                                  csrfToken,
                                );
                              }
                            }}
                            className="space-y-4"
                          >
                            <Textarea
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your reply..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                type="submit"
                                disabled={!newMessage.trim()}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send Reply
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {conversation.status === "open" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateConversationStatus(conversation.id, "closed")
                      }
                    >
                      Close
                    </Button>
                  )}

                  {conversation.status === "closed" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateConversationStatus(conversation.id, "open")
                      }
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {conversations.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Conversations
              </h3>
              <p className="text-muted-foreground">
                No tenant conversations have been started yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
