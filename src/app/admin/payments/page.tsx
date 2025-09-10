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
import { ArrowLeft, CreditCard, Check, X, Eye } from "lucide-react";
import Link from "next/link";

interface PaymentProof {
  id: string;
  amount: number;
  month_year: string;
  payment_date: string;
  proof_url: string;
  status: string;
  admin_notes: string;
  created_at: string;
  tenant_properties: {
    properties: {
      name: string;
      address: string;
    };
    users: {
      full_name: string;
      name: string;
      email: string;
    };
  };
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentProof | null>(
    null,
  );
  const supabase = createClient();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data } = await supabase
        .from("payment_proofs")
        .select(
          `
          *,
          tenant_properties (
            properties (name, address),
            users (full_name, name, email)
          )
        `,
        )
        .order("created_at", { ascending: false });

      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (
    paymentId: string,
    status: string,
    notes?: string,
  ) => {
    try {
      await supabase
        .from("payment_proofs")
        .update({
          status,
          admin_notes: notes || null,
          verified_by:
            status === "approved"
              ? (await supabase.auth.getUser()).data.user?.id
              : null,
        })
        .eq("id", paymentId);

      fetchPayments(); // Refresh the list
      setSelectedPayment(null);
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
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
              <CreditCard className="h-8 w-8" />
              Payment Management
            </h1>
            <p className="text-gray-600 mt-2">
              Review and approve tenant payment submissions
            </p>
          </div>
        </div>

        {/* Payments List */}
        <div className="space-y-6">
          {payments.map((payment) => (
            <Card
              key={payment.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {payment.tenant_properties.users.full_name ||
                        payment.tenant_properties.users.name}
                    </CardTitle>
                    <CardDescription>
                      {payment.tenant_properties.properties.name} -{" "}
                      {payment.month_year}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <p className="font-medium">${payment.amount}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Payment Date:</span>
                    <p className="font-medium">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Submitted:</span>
                    <p className="font-medium">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Property:</span>
                    <p className="font-medium">
                      {payment.tenant_properties.properties.name}
                    </p>
                  </div>
                </div>

                {payment.admin_notes && (
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 text-sm">Admin Notes:</span>
                    <p className="text-gray-700 mt-1">{payment.admin_notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Review Payment Proof</DialogTitle>
                        <DialogDescription>
                          Review and approve or reject this payment submission
                        </DialogDescription>
                      </DialogHeader>
                      {selectedPayment && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-500">Tenant:</span>
                              <p className="font-medium">
                                {selectedPayment.tenant_properties.users
                                  .full_name ||
                                  selectedPayment.tenant_properties.users.name}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <p className="font-medium">
                                ${selectedPayment.amount}
                              </p>
                            </div>
                          </div>

                          <div className="bg-gray-100 p-4 rounded">
                            <p className="text-sm text-gray-600 mb-2">
                              Payment Proof:
                            </p>
                            <img
                              src={selectedPayment.proof_url}
                              alt="Payment proof"
                              className="max-w-full h-auto rounded border"
                            />
                          </div>

                          {selectedPayment.status === "pending" && (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const action = formData.get("action") as string;
                                const notes = formData.get("notes") as string;

                                updatePaymentStatus(
                                  selectedPayment.id,
                                  action,
                                  notes,
                                );
                              }}
                              className="space-y-4"
                            >
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Admin Notes (optional):
                                </label>
                                <Textarea
                                  name="notes"
                                  placeholder="Add any notes about this payment..."
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  type="submit"
                                  name="action"
                                  value="approved"
                                  className="flex-1"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  type="submit"
                                  name="action"
                                  value="rejected"
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {payment.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          updatePaymentStatus(payment.id, "approved")
                        }
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          updatePaymentStatus(payment.id, "rejected")
                        }
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {payments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Payment Submissions
              </h3>
              <p className="text-gray-600">
                No payment proofs have been submitted yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
