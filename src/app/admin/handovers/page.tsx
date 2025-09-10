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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Calendar, Check, X, Clock } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

interface KeyHandover {
  id: string;
  handover_type: string;
  scheduled_date: string;
  status: string;
  notes: string;
  created_at: string;
  completed_by: string;
  tenant_properties: {
    users: {
      full_name: string;
      name: string;
      email: string;
    };
    properties: {
      name: string;
      address: string;
    };
  };
}

export default function AdminHandovers() {
  const [handovers, setHandovers] = useState<KeyHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHandover, setSelectedHandover] = useState<KeyHandover | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    try {
      const { data } = await supabase
        .from("key_handovers")
        .select(
          `
          *,
          tenant_properties (
            users (full_name, name, email),
            properties (name, address)
          )
        `,
        )
        .order("scheduled_date", { ascending: true });

      setHandovers(data || []);
    } catch (error) {
      console.error("Error fetching handovers:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateHandoverStatus = async (
    handoverId: string,
    status: string,
    notes?: string,
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase
        .from("key_handovers")
        .update({
          status,
          notes: notes || null,
          completed_by: status === "completed" ? user?.id : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", handoverId);

      fetchHandovers(); // Refresh the list
      setSelectedHandover(null);
      setIsDialogOpen(false);

      toast({
        title: "Handover Updated",
        description: `Handover has been ${status} successfully.`,
      });
    } catch (error) {
      console.error("Error updating handover status:", error);
      toast({
        title: "Error",
        description: "Failed to update handover status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
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

  const isOverdue = (scheduledDate: string, status: string) => {
    return status !== "completed" && new Date(scheduledDate) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading handovers...</p>
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Key Handovers
            </h1>
            <p className="text-gray-600 mt-2">
              Manage key handover appointments and schedules
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Handovers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{handovers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  handovers.filter(
                    (h) => h.status === "pending" || h.status === "scheduled",
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {handovers.filter((h) => h.status === "completed").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {
                  handovers.filter((h) => isOverdue(h.scheduled_date, h.status))
                    .length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Handovers List */}
        <div className="space-y-6">
          {handovers.map((handover) => (
            <Card
              key={handover.id}
              className={`hover:shadow-lg transition-shadow ${
                isOverdue(handover.scheduled_date, handover.status)
                  ? "border-red-200 bg-red-50"
                  : ""
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {handover.tenant_properties.users.full_name ||
                        handover.tenant_properties.users.name}
                      {isOverdue(handover.scheduled_date, handover.status) && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {handover.tenant_properties.properties.name} •{" "}
                      {handover.tenant_properties.properties.address}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getTypeColor(handover.handover_type)}>
                      {handover.handover_type.replace("_", " ")}
                    </Badge>
                    <Badge className={getStatusColor(handover.status)}>
                      {handover.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Scheduled Date:</span>
                    <p className="font-medium">
                      {new Date(handover.scheduled_date).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tenant Email:</span>
                    <p className="font-medium">
                      {handover.tenant_properties.users.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Requested:</span>
                    <p className="font-medium">
                      {new Date(handover.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {handover.notes && (
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 text-sm">Notes:</span>
                    <p className="text-gray-700 mt-1">{handover.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedHandover(handover);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Manage Key Handover</DialogTitle>
                        <DialogDescription>
                          Update the status and add notes for this handover
                          appointment
                        </DialogDescription>
                      </DialogHeader>
                      {selectedHandover && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-500">Tenant:</span>
                              <p className="font-medium">
                                {selectedHandover.tenant_properties.users
                                  .full_name ||
                                  selectedHandover.tenant_properties.users.name}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Type:</span>
                              <p className="font-medium capitalize">
                                {selectedHandover.handover_type.replace(
                                  "_",
                                  " ",
                                )}
                              </p>
                            </div>
                          </div>

                          <div>
                            <span className="text-gray-500">Scheduled:</span>
                            <p className="font-medium">
                              {new Date(
                                selectedHandover.scheduled_date,
                              ).toLocaleString()}
                            </p>
                          </div>

                          {selectedHandover.status !== "completed" && (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const action = formData.get("action") as string;
                                const notes = formData.get("notes") as string;

                                updateHandoverStatus(
                                  selectedHandover.id,
                                  action,
                                  notes,
                                );
                              }}
                              className="space-y-4"
                            >
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Notes (optional):
                                </label>
                                <Textarea
                                  name="notes"
                                  placeholder="Add any notes about this handover..."
                                  defaultValue={selectedHandover.notes}
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  type="submit"
                                  name="action"
                                  value="completed"
                                  className="flex-1"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark Completed
                                </Button>
                                <Button
                                  type="submit"
                                  name="action"
                                  value="cancelled"
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {handover.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          updateHandoverStatus(handover.id, "scheduled")
                        }
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          updateHandoverStatus(handover.id, "cancelled")
                        }
                      >
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </>
                  )}

                  {handover.status === "scheduled" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateHandoverStatus(handover.id, "completed")
                      }
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {handovers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Key Handovers
              </h3>
              <p className="text-gray-600">
                No key handover appointments have been scheduled yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
