"use client";

import { useState, useEffect, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Plus,
  User,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { createAdminLogNotification } from "@/lib/notifications";
import { useSearchParams, useRouter } from "next/navigation";

interface Message {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_id: string;
}

interface Conversation {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  messages: Message[];
}

export default function TenantMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const { t } = useLanguage();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  // Real-time updates for selected conversation messages
  useEffect(() => {
    if (!selectedConversation) return;
    const channel = supabase
      .channel(`conversation:${selectedConversation.id}`)
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
            let nextMessages = [...prev.messages];
            const normalized: Message = {
              id: newMsg.id,
              message: newMsg.message,
              is_admin: newMsg.is_admin,
              created_at: newMsg.created_at,
              sender_id: newMsg.sender_id,
            };
            if (idx !== -1) {
              nextMessages[idx] = normalized;
            } else if (!prev.messages.some((m) => m.id === newMsg.id)) {
              nextMessages.push(normalized);
            }
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
                      } as Message,
                    ],
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

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages?.length]);

  // Open conversation from notification deep-link (?conversationId=...)
  useEffect(() => {
    const targetId = searchParams.get("conversationId");
    if (!targetId || !conversations.length) return;
    const convo = conversations.find((c) => c.id === targetId);
    if (convo) {
      setSelectedConversation(convo);
      setIsDialogOpen(true);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  }, [conversations, searchParams]);

  const fetchConversations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant's property
      const { data: tenantProperty } = await supabase
        .from("tenant_properties")
        .select("property_id")
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .single();

      if (!tenantProperty) return;

      setPropertyId(tenantProperty.property_id);

      // Get conversations with messages
      const { data: convos } = await supabase
        .from("conversations")
        .select(
          `
          *,
          messages (*)
        `,
        )
        .eq("property_id", tenantProperty.property_id)
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false });

      setConversations(convos || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (
    subject: string,
    priority: string,
    initialMessage: string,
  ) => {
    if (!propertyId) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          property_id: propertyId,
          tenant_id: user.id,
          subject: subject,
          priority: priority,
          status: "open",
        })
        .select()
        .single();

      if (convError || !conversation) return;

      // Add initial message
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        message: initialMessage,
        is_admin: false,
      });

      // Optimistically update UI with the new conversation and initial message
      const optimisticInitial: Message = {
        id: `temp-${Date.now()}`,
        message: initialMessage,
        is_admin: false,
        created_at: new Date().toISOString(),
        sender_id: user.id,
      };
      setConversations((prev) => [{ ...conversation, messages: [optimisticInitial] }, ...prev]);
      setSelectedConversation({ ...conversation, messages: [optimisticInitial] });

      // Notify admins about new conversation
      try {
        await createAdminLogNotification({
          adminUserId: user.id,
          action: "New conversation started",
          entityType: "message",
          entityId: conversation.id,
          details: { subject, priority, preview: initialMessage.slice(0, 140) },
        });
      } catch (e) {
        console.warn("Failed to create admin log notification:", e);
      }

      // Ensure list stays in sync
      fetchConversations(); // Refresh the list
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const sendMessage = async (conversationId: string, message: string) => {
    setSending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Optimistic UI update
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: Message = {
        id: tempId,
        message,
        is_admin: false,
        created_at: new Date().toISOString(),
        sender_id: user.id,
      };
      setSelectedConversation((prev) =>
        prev && prev.id === conversationId
          ? { ...prev, messages: [...prev.messages, optimisticMsg] }
          : prev
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, messages: [...c.messages, optimisticMsg] } : c
        )
      );
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);

      // Persist to DB
      const { error: insertError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        message: message,
        is_admin: false,
      });
      if (insertError) throw insertError;

      // Generate admin log notification for the new tenant message
      try {
        await createAdminLogNotification({
          adminUserId: user.id,
          action: "New tenant message",
          entityType: "message",
          entityId: conversationId,
          details: { preview: message.slice(0, 140) },
        });
      } catch (e) {
        console.warn("Failed to create admin log notification:", e);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
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
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-8 w-8" />
                {t("messages.messages")}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t("messages.contactAdminProperty")}
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("messages.newConversation")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t("messages.startNewConversation")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("messages.newConversationDescription")}
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const subject = formData.get("subject") as string;
                    const priority = formData.get("priority") as string;
                    const message = formData.get("message") as string;

                    if (subject && priority && message) {
                      createConversation(subject, priority, message);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="subject">{t("common.subject")}</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder={t("messages.subjectPlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">{t("common.priority")}</Label>
                    <Select name="priority" required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("messages.selectPriority")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t("common.low")}</SelectItem>
                        <SelectItem value="medium">
                          {t("common.medium")}
                        </SelectItem>
                        <SelectItem value="high">{t("common.high")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message">{t("common.message")}</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder={t("messages.messagePlaceholder")}
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {t("messages.startNewConversation")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversations List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold">
              {t("messages.yourConversations")}
            </h2>

            {conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      setIsDialogOpen(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-sm truncate">
                            {conversation.subject}
                          </h3>
                          <div className="flex gap-1">
                            <Badge
                              className={getStatusColor(conversation.status)}
                              variant="secondary"
                            >
                              {conversation.status === "open" ? t("common.open") : conversation.status === "closed" ? t("common.closed") : conversation.status === "pending" ? t("common.pending") : conversation.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <Badge
                            className={getPriorityColor(conversation.priority)}
                            variant="outline"
                          >
                            {conversation.priority === "high" ? t("common.high") : conversation.priority === "medium" ? t("common.medium") : conversation.priority === "low" ? t("common.low") : conversation.priority}
                          </Badge>
                          <span>
                            {new Date(
                              conversation.created_at,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {conversation.messages.length} message
                          {conversation.messages.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">
                    {t("messages.noConversationsDescription")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Conversation Detail via Dialog (match admin layout) */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedConversation(null);
              // Clear query so subsequent notification clicks to the same URL re-open the dialog
              router.replace("/tenant/messages");
            }
          }}>
            <DialogContent className="w-[95vw] max-w-[1400px] h-[85vh] overflow-hidden">
              {selectedConversation && (
                <>
                  <DialogHeader>
                    <DialogTitle>{selectedConversation.subject}</DialogTitle>
                    <DialogDescription>
                      {t("messages.started")}{" "}
                      {new Date(selectedConversation.created_at).toLocaleDateString()}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col h-[calc(85vh-140px)] gap-4">
                    {/* Messages (admin layout: admin on right blue, tenant on left gray) */}
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 border rounded p-4">
                      {selectedConversation.messages
                        .sort(
                          (a, b) =>
                            new Date(a.created_at).getTime() -
                            new Date(b.created_at).getTime(),
                        )
                        .map((message) => (
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
                                  message.is_admin ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                {message.is_admin ? t("common.admin") : t("common.you")} •{" "}
                                {new Date(message.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Form */}
                    {selectedConversation.status === "open" && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (newMessage.trim()) {
                            sendMessage(selectedConversation.id, newMessage);
                            setNewMessage("");
                          }
                        }}
                        className="space-y-3"
                      >
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={t("messages.typeYourMessage")}
                          rows={3}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button type="submit" disabled={sending || !newMessage.trim()}>
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
