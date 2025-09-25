import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { paymentUpdateSchema } from "@/lib/fileValidation";
import { validateCSRFToken } from "@/lib/csrf";

// PUT /api/admin/payment-status - Update payment status
export async function PUT(request: NextRequest) {
  try {
    // Validate CSRF token
    const isValidCSRF = await validateCSRFToken(request);
    if (!isValidCSRF) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentId, csrfToken, ...updateData } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Validate input data
    const validatedData = paymentUpdateSchema.parse(updateData);

    // Create Supabase client
    const supabase = await createClient();

    // Get current user and verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (roleError || !userData || userData.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Update payment status
    const { data, error } = await supabase
      .from("payment_proofs")
      .update({
        status: validatedData.status,
        admin_notes: validatedData.adminNotes || null,
        verified_by: validatedData.status === "approved" ? user.id : null,
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update payment status" },
        { status: 500 }
      );
    }

    // Create notification for tenant
    const { data: paymentData } = await supabase
      .from("payment_proofs")
      .select(`
        *,
        tenant_properties (
          tenant_id,
          users (full_name, name, email)
        )
      `)
      .eq("id", paymentId)
      .single();

    if (paymentData?.tenant_properties?.tenant_id) {
      const tenantId = paymentData.tenant_properties.tenant_id;
      const tenantName = paymentData.tenant_properties.users?.full_name ||
                        paymentData.tenant_properties.users?.name ||
                        "Tenant";

      await supabase.from("notifications").insert({
        user_id: tenantId,
        title: `Payment ${validatedData.status}`,
        message: `Your payment proof for ${paymentData.month_year} has been ${validatedData.status}`,
        type: validatedData.status === "approved" ? "success" : "warning",
        is_admin_log: false,
        related_entity_type: "payment",
        related_entity_id: paymentId,
        metadata: {
          status: validatedData.status,
          monthYear: paymentData.month_year,
          adminNotes: validatedData.adminNotes
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);

    if (error && typeof error === 'object' && 'name' in error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}