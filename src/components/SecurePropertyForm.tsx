"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertySchema, type PropertyInput } from "@/lib/validations";
import { useCSRF } from "@/hooks/useCSRF";
import { createClient } from "../../supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { useToast } from "@/components/ui/use-toast";

interface SecurePropertyFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<PropertyInput & { id?: string }>;
  isEditing?: boolean;
}

export function SecurePropertyForm({
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
}: SecurePropertyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: initialData || {
      status: "available",
    },
  });

  const onSubmit = async (data: PropertyInput) => {
    if (!csrfToken) {
      toast({
        title: t("common.error"),
        description: "Security token missing. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user for property ownership
      const { data: { user } } = await supabase.auth.getUser();

      // Include CSRF token and ownership tracking
      const requestData = {
        ...data,
        csrfToken,
        // Include property ID for editing
        ...(isEditing && initialData?.id ? { id: initialData.id } : {}),
        // Track who created the property (only for new properties)
        ...(isEditing ? {} : { created_by: user?.id }),
      };

      const response = await fetch("/api/properties", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save property");
      }

      toast({
        title: isEditing ? t("common.propertyUpdated") : t("common.propertyCreated"),
        description: isEditing
          ? t("common.propertyUpdatedDescription")
          : t("common.propertyCreatedDescription"),
      });

      onSuccess();
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">{t("common.propertyName")}</Label>
          <Input
            id="name"
            {...register("name")}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="property_type">{t("common.propertyType")}</Label>
          <Select
            value={watch("property_type")}
            onValueChange={(value) => setValue("property_type", value)}
          >
            <SelectTrigger className={errors.property_type ? "border-red-500" : ""}>
              <SelectValue placeholder={t("common.propertyType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">{t("common.apartment")}</SelectItem>
              <SelectItem value="house">{t("common.house")}</SelectItem>
              <SelectItem value="condo">{t("common.condo")}</SelectItem>
              <SelectItem value="studio">{t("common.studio")}</SelectItem>
            </SelectContent>
          </Select>
          {errors.property_type && (
            <p className="text-red-500 text-sm mt-1">{errors.property_type.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="address">{t("common.address")}</Label>
        <Textarea
          id="address"
          {...register("address")}
          className={errors.address ? "border-red-500" : ""}
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">{t("common.description")}</Label>
        <Textarea
          id="description"
          {...register("description")}
          rows={3}
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="bedrooms">{t("common.bedrooms")}</Label>
          <Input
            id="bedrooms"
            type="number"
            {...register("bedrooms", { valueAsNumber: true })}
            className={errors.bedrooms ? "border-red-500" : ""}
          />
          {errors.bedrooms && (
            <p className="text-red-500 text-sm mt-1">{errors.bedrooms.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="bathrooms">{t("common.bathrooms")}</Label>
          <Input
            id="bathrooms"
            type="number"
            step="0.5"
            {...register("bathrooms", { valueAsNumber: true })}
            className={errors.bathrooms ? "border-red-500" : ""}
          />
          {errors.bathrooms && (
            <p className="text-red-500 text-sm mt-1">{errors.bathrooms.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="square_meters">{t("common.squareMeters")}</Label>
          <Input
            id="square_meters"
            type="number"
            {...register("square_meters", { valueAsNumber: true })}
            className={errors.square_meters ? "border-red-500" : ""}
          />
          {errors.square_meters && (
            <p className="text-red-500 text-sm mt-1">{errors.square_meters.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="monthly_rent">{t("common.monthlyRent")} ($)</Label>
          <Input
            id="monthly_rent"
            type="number"
            step="0.01"
            {...register("monthly_rent", { valueAsNumber: true })}
            className={errors.monthly_rent ? "border-red-500" : ""}
          />
          {errors.monthly_rent && (
            <p className="text-red-500 text-sm mt-1">{errors.monthly_rent.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="deposit_amount">{t("common.depositAmount")} ($)</Label>
          <Input
            id="deposit_amount"
            type="number"
            step="0.01"
            {...register("deposit_amount", { valueAsNumber: true })}
            className={errors.deposit_amount ? "border-red-500" : ""}
          />
          {errors.deposit_amount && (
            <p className="text-red-500 text-sm mt-1">{errors.deposit_amount.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="status">{t("common.status")}</Label>
        <Select
          value={watch("status")}
          onValueChange={(value: "available" | "occupied" | "maintenance") =>
            setValue("status", value)
          }
        >
          <SelectTrigger className={errors.status ? "border-red-500" : ""}>
            <SelectValue placeholder={t("common.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">{t("common.available")}</SelectItem>
            <SelectItem value="occupied">{t("common.occupied")}</SelectItem>
            <SelectItem value="maintenance">{t("common.maintenance")}</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : isEditing ? t("common.saveChanges") : t("common.createProperty")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}