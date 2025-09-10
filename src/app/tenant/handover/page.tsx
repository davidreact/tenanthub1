"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../supabase/client";
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
  Calendar,
  Key,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface KeyHandover {
  id: string;
  handover_type: string;
  scheduled_date: string;
  status: string;
  notes: string;
  created_at: string;
}

export default function TenantHandover() {
  const [handovers, setHandovers] = useState<KeyHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantPropertyId, setTenantPropertyId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant's property
      const { data: tenantProperty } = await supabase
        .from("tenant_properties")
        .select("id")
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .single();

      if (!tenantProperty) return;

      setTenantPropertyId(tenantProperty.id);

      // Get key handovers
      const { data: handoverData } = await supabase
        .from("key_handovers")
        .select("*")
        .eq("tenant_property_id", tenantProperty.id)
        .order("scheduled_date", { ascending: false });

      setHandovers(handoverData || []);
    } catch (error) {
      console.error("Error fetching handovers:", error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleHandover = async (
    type: string,
    date: string,
    time: string,
    notes: string,
  ) => {
    if (!tenantPropertyId) return;

    try {
      const scheduledDateTime = new Date(`${date}T${time}`).toISOString();

      await supabase.from("key_handovers").insert({
        tenant_property_id: tenantPropertyId,
        handover_type: type,
        scheduled_date: scheduledDateTime,
        status: "scheduled",
        notes: notes,
      });

      fetchHandovers(); // Refresh the list
      setIsDialogOpen(false);

      toast({
        title: "Handover Scheduled",
        description:
          "Your handover appointment has been scheduled successfully.",
      });
    } catch (error) {
      console.error("Error scheduling handover:", error);
      toast({
        title: "Error",
        description: "Failed to schedule handover. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "move_in":
        return "bg-green-100 text-green-800";
      case "move_out":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading handover schedule...</p>
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
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Key className="h-8 w-8" />
                Key Handover Scheduling
              </h1>
              <p className="text-gray-600 mt-2">
                Schedule and manage key exchanges for move-in and move-out
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Handover
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Key Handover</DialogTitle>
                  <DialogDescription>
                    Schedule a key handover appointment with the property
                    administrator
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const type = formData.get("type") as string;
                    const date = formData.get("date") as string;
                    const time = formData.get("time") as string;
                    const notes = formData.get("notes") as string;

                    if (type && date && time) {
                      scheduleHandover(type, date, time, notes);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="type">Handover Type</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select handover type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="move_in">Move In</SelectItem>
                        <SelectItem value="move_out">Move Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Preferred Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Preferred Time</Label>
                    <Input id="time" name="time" type="time" required />
                  </div>
                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Any special requirements or notes for the handover"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Schedule Handover
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Handover Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Key Handover Information</CardTitle>
            <CardDescription>
              Important information about key handover procedures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-800 mb-2">
                  Move-In Handover
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Receive property keys and access cards</li>
                  <li>• Complete property inspection</li>
                  <li>• Sign inventory checklist</li>
                  <li>• Get emergency contact information</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-orange-800 mb-2">
                  Move-Out Handover
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Return all keys and access cards</li>
                  <li>• Final property inspection</li>
                  <li>• Settle any outstanding payments</li>
                  <li>• Receive deposit refund information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Handovers */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Handover Schedule</h2>

          {handovers.length > 0 ? (
            <div className="grid gap-4">
              {handovers.map((handover) => {
                const { date, time } = formatDateTime(handover.scheduled_date);
                return (
                  <Card key={handover.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge
                              className={getTypeColor(handover.handover_type)}
                            >
                              {handover.handover_type.replace("_", " ")}
                            </Badge>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(handover.status)}
                              <Badge
                                className={getStatusColor(handover.status)}
                              >
                                {handover.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{time}</span>
                            </div>
                          </div>

                          {handover.notes && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-700">
                                {handover.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Requested:{" "}
                            {new Date(handover.created_at).toLocaleDateString()}
                          </p>
                          {handover.status === "scheduled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              Modify Request
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Handovers Scheduled
                </h3>
                <p className="text-gray-600">
                  Schedule your first key handover appointment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              If you need to reschedule or have questions about the handover
              process, please contact the property administrator.
            </p>
            <Link href="/tenant/messages">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Contact Administrator
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
