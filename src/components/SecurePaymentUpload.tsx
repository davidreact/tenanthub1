"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { securePaymentProofSchema, type SecurePaymentProofInput } from "@/lib/fileValidation";
import { useCSRF } from "@/hooks/useCSRF";
import { createClient } from "../../supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { FileUploadRestrictions } from "@/components/FileUploadRestrictions";

interface SecurePaymentUploadProps {
  tenantPropertyId: string;
  monthlyRent: number;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * @description Handles secure upload of payment proof files with CSRF protection and Zod validation.
 */
export function SecurePaymentUpload({
  tenantPropertyId,
  monthlyRent,
  onSuccess,
  onCancel,
}: SecurePaymentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { csrfToken, loading: csrfLoading, error: csrfError } = useCSRF();
  const { toast } = useToast();
  const { t } = useLanguage();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SecurePaymentProofInput>({
    resolver: zodResolver(securePaymentProofSchema),
    defaultValues: {
      amount: monthlyRent,
    },
  });

  const onSubmit = async (data: SecurePaymentProofInput) => {
    if (!csrfToken) {
      toast({
        title: t("common.error"),
        description: "Security token missing. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = data.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, data.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error('Failed to upload file');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      // Include CSRF token in the request
      const requestData = {
        tenantPropertyId,
        monthYear: data.monthYear,
        amount: data.amount,
        paymentDate: data.paymentDate,
        proofUrl: publicUrl,
        csrfToken,
      };

      const response = await fetch("/api/payment-proofs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload payment proof");
      }

      toast({
        title: t("common.success"),
        description: t("payments.uploadProofDialogDescription"),
      });

      onSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
        <Label htmlFor="monthYear">{t("common.monthYear")}</Label>
        <Input
          id="monthYear"
          type="month"
          {...register("monthYear")}
          className={errors.monthYear ? "border-red-500" : ""}
        />
        {errors.monthYear && (
          <p className="text-red-500 text-sm mt-1">{errors.monthYear.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="amount">{t("common.amountPaid")}</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          {...register("amount", { valueAsNumber: true })}
          className={errors.amount ? "border-red-500" : ""}
        />
        {errors.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="paymentDate">{t("common.paymentDate")}</Label>
        <Input
          id="paymentDate"
          type="date"
          {...register("paymentDate")}
          className={errors.paymentDate ? "border-red-500" : ""}
        />
        {errors.paymentDate && (
          <p className="text-red-500 text-sm mt-1">{errors.paymentDate.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="file">{t("common.paymentProof")}</Label>
        <Input
          id="file"
          type="file"
          accept="image/*,.pdf"
          {...register("file")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setValue("file", file);
            }
          }}
          className={errors.file ? "border-red-500" : ""}
        />
        {errors.file && (
          <p className="text-red-500 text-sm mt-1">{errors.file.message}</p>
        )}
      </div>

      <FileUploadRestrictions className="mt-4" />

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isUploading} className="flex-1">
          {isUploading ? t("common.uploading") : t("common.uploadProof")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}