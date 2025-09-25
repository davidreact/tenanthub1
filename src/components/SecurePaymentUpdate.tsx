"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentUpdateSchema, type PaymentUpdateInput } from "@/lib/fileValidation";
import { useCSRF } from "@/hooks/useCSRF";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface SecurePaymentUpdateProps {
  paymentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SecurePaymentUpdate({
  paymentId,
  onSuccess,
  onCancel,
}: SecurePaymentUpdateProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { csrfToken, loading: csrfLoading, error: csrfError } = useCSRF();
  const { toast } = useToast();
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PaymentUpdateInput>({
    resolver: zodResolver(paymentUpdateSchema),
  });

  const onSubmit = async (data: PaymentUpdateInput) => {
    if (!csrfToken) {
      toast({
        title: t("common.error"),
        description: "Security token missing. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const requestData = {
        paymentId,
        status: data.status,
        adminNotes: data.adminNotes,
        csrfToken,
      };

      const response = await fetch("/api/admin/payment-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update payment status");
      }

      toast({
        title: t("common.success"),
        description: `Payment has been ${data.status} successfully.`,
      });

      onSuccess();
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Update failed",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (csrfLoading) {
    return <div>Loading security tokens...</div>;
  }

  if (csrfError) {
    return (
      <div className="text-red-500">
        Security error: {csrfError}. Please refresh the page.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* CSRF Token - Hidden field */}
      <input type="hidden" value={csrfToken} />

      <div>
        <Label htmlFor="adminNotes">{t("common.adminNotes")}:</Label>
        <Textarea
          id="adminNotes"
          {...register("adminNotes")}
          placeholder={t("common.addNotes")}
          className={errors.adminNotes ? "border-red-500" : ""}
        />
        {errors.adminNotes && (
          <p className="text-red-500 text-sm mt-1">{errors.adminNotes.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          onClick={() => setValue("status", "approved")}
          disabled={isUpdating}
          className="flex-1"
        >
          {t("common.approve")}
        </Button>
        <Button
          type="submit"
          onClick={() => setValue("status", "rejected")}
          disabled={isUpdating}
          variant="destructive"
          className="flex-1"
        >
          {t("common.reject")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}