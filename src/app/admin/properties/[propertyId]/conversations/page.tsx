"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../../../supabase/client";
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
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface Property {
  id: string;
  name: string;
  address: string;
}

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
  messages: Message[];
}

export default function PropertyConversations() {
  const [property, setProperty] = useState<Property | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const supabase = createClient();

  useEffect(() => {
    if (propertyId) {
      fetchData();
    }
  }, [propertyId]);

  const fetchData = async () => {
    try {
      // Fetch property details
      const { data: propertyData } = await supabase
        .from("properties")
        .select("id, name, address")
        .eq("id", propertyId)
        .single();

      // Fetch conversations for this property
      const { data: conversationsData } = await supabase
        .from("conversations")
        .select(
          `
          *,
          users (full_name, name, email),
          messages (
            *,
            users (full_name, name)
          )
        `,
        )
        .eq("property_id", propertyId)
        .order("updated_at", { ascending: false });

      setProperty(propertyData);
      setConversations(conversationsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, message: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        message,
        sender_id: user?.id,
        is_admin: true,
      });

      // Update conversation updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      setNewMessage("");
      fetchData(); // Refresh conversations

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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

      fetchData(); // Refresh conversations

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Property Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested property could not be found.
          </p>
          <Link href="/admin/properties">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/properties"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              Conversations for {property.name}
            </h1>
            <p className="text-gray-600 mt-2">{property.address}</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {conversations.filter((c) => c.status === "open").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {conversations.reduce(
                  (sum, c) => sum + (c.messages?.length || 0),
                  0,
                )}
              </div>
            </CardContent>
          </Card>
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
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle>{conversation.subject}</DialogTitle>
                        <DialogDescription>
                          Conversation with{" "}
                          {conversation.users.full_name ||
                            conversation.users.name}
                        </DialogDescription>
                      </DialogHeader>
                      {selectedConversation && (
                        <div className="space-y-4">
                          {/* Messages */}
                          <div className="max-h-96 overflow-y-auto space-y-3 border rounded p-4">
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
                          </div>

                          {/* Reply Form */}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (newMessage.trim()) {
                                sendMessage(
                                  selectedConversation.id,
                                  newMessage,
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Conversations
              </h3>
              <p className="text-gray-600">
                No conversations have been started for this property yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
