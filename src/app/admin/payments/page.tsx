"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, CreditCard, Check, X, Eye } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
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
      setIsDialogOpen(false);

      toast({
        title: "Payment Updated",
        description: `Payment has been ${status} successfully.`,
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive",
      });
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

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case "approved":
        return t("common.approved");
      case "rejected":
        return t("common.rejected");
      case "pending":
        return t("common.pending");
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
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
            href="/dashboard"
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.backToDashboard")}
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-8 w-8" />
              {t("payments.paymentManagement")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("payments.reviewApprove")}
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
                    {getStatusTranslation(payment.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t("common.amount")}:</span>
                    <p className="font-medium">${payment.amount}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      {t("common.paymentDate")}:
                    </span>
                    <p className="font-medium">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      {t("common.submitted")}:
                    </span>
                    <p className="font-medium">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      {t("common.property")}:
                    </span>
                    <p className="font-medium">
                      {payment.tenant_properties.properties.name}
                    </p>
                  </div>
                </div>

                {payment.admin_notes && (
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 text-sm">
                      {t("common.adminNotes")}:
                    </span>
                    <p className="text-gray-700 mt-1">{payment.admin_notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t("common.view")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{t("common.viewProof")}</DialogTitle>
                        <DialogDescription>
                          {t("payments.reviewApprove")}
                        </DialogDescription>
                      </DialogHeader>
                      {selectedPayment && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-500">
                                {t("common.tenant")}:
                              </span>
                              <p className="font-medium">
                                {selectedPayment.tenant_properties.users
                                  .full_name ||
                                  selectedPayment.tenant_properties.users.name}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                {t("common.amount")}:
                              </span>
                              <p className="font-medium">
                                ${selectedPayment.amount}
                              </p>
                            </div>
                          </div>

                          <div className="bg-gray-100 p-4 rounded">
                            <p className="text-sm text-gray-600 mb-2">
                              {t("common.paymentProof")}:
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
                                  {t("common.adminNotes")}:
                                </label>
                                <Textarea
                                  name="notes"
                                  placeholder={t("common.addNotes")}
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
                                  {t("common.approve")}
                                </Button>
                                <Button
                                  type="submit"
                                  name="action"
                                  value="rejected"
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  {t("common.reject")}
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
                        {t("common.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          updatePaymentStatus(payment.id, "rejected")
                        }
                      >
                        <X className="h-4 w-4 mr-2" />
                        {t("common.reject")}
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
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t("payments.pendingPayments")}
              </h3>
              <p className="text-muted-foreground">
                {t("payments.uploadProofView")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
