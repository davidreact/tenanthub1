"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, MessageSquare, Send, Plus, User, Shield } from "lucide-react";
import Link from "next/link";

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
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant's property
      const { data: tenantProperty } = await supabase
        .from('tenant_properties')
        .select('property_id')
        .eq('tenant_id', user.id)
        .eq('status', 'active')
        .single();

      if (!tenantProperty) return;

      setPropertyId(tenantProperty.property_id);

      // Get conversations with messages
      const { data: convos } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*)
        `)
        .eq('property_id', tenantProperty.property_id)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false });

      setConversations(convos || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (subject: string, priority: string, initialMessage: string) => {
    if (!propertyId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          property_id: propertyId,
          tenant_id: user.id,
          subject: subject,
          priority: priority,
          status: 'open'
        })
        .select()
        .single();

      if (convError || !conversation) return;

      // Add initial message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          message: initialMessage,
          is_admin: false
        });

      fetchConversations(); // Refresh the list
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const sendMessage = async (conversationId: string, message: string) => {
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message: message,
          is_admin: false
        });

      fetchConversations(); // Refresh to get new message
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-8 w-8" />
                Messages
              </h1>
              <p className="text-gray-600 mt-2">
                Communicate with your property administrator
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                  <DialogDescription>
                    Create a new conversation with the property administrator
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const subject = formData.get('subject') as string;
                  const priority = formData.get('priority') as string;
                  const message = formData.get('message') as string;
                  
                  if (subject && priority && message) {
                    createConversation(subject, priority, message);
                  }
                }} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Describe your issue or question in detail"
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Start Conversation
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversations List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold">Your Conversations</h2>
            
            {conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <Card 
                    key={conversation.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-sm truncate">{conversation.subject}</h3>
                          <div className="flex gap-1">
                            <Badge className={getStatusColor(conversation.status)} variant="secondary">
                              {conversation.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <Badge className={getPriorityColor(conversation.priority)} variant="outline">
                            {conversation.priority}
                          </Badge>
                          <span>{new Date(conversation.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
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
                  <p className="text-gray-600 text-sm">No conversations yet</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Conversation Detail */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedConversation.subject}</CardTitle>
                      <CardDescription>
                        Started {new Date(selectedConversation.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(selectedConversation.priority)}>
                        {selectedConversation.priority}
                      </Badge>
                      <Badge className={getStatusColor(selectedConversation.status)}>
                        {selectedConversation.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto space-y-4">
                  {selectedConversation.messages
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.is_admin ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[70%] rounded-lg p-3 ${
                        message.is_admin 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'bg-blue-600 text-white'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {message.is_admin ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          <span className="text-xs opacity-75">
                            {message.is_admin ? 'Admin' : 'You'}
                          </span>
                          <span className="text-xs opacity-75">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>

                {/* Send Message */}
                {selectedConversation.status === 'open' && (
                  <div className="p-4 border-t">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const message = formData.get('message') as string;
                      
                      if (message.trim()) {
                        sendMessage(selectedConversation.id, message);
                        (e.target as HTMLFormElement).reset();
                      }
                    }} className="flex gap-2">
                      <Input
                        name="message"
                        placeholder="Type your message..."
                        className="flex-1"
                        required
                      />
                      <Button type="submit" disabled={sending}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Conversation</h3>
                  <p className="text-gray-600">Choose a conversation from the list to view messages</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}