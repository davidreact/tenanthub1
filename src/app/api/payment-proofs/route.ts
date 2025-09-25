import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { paymentProofSchema } from "@/lib/fileValidation";
import { validateCSRFToken } from "@/lib/csrf";

// POST /api/payment-proofs - Upload new payment proof
export async function POST(request: NextRequest) {
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
    const { csrfToken, tenantPropertyId, ...proofData } = body;

    // Validate input data
    const validatedData = paymentProofSchema.parse(proofData);

    // Create Supabase client
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify tenant owns this property
    const { data: tenantProperty, error: propertyError } = await supabase
      .from("tenant_properties")
      .select("id, tenant_id")
      .eq("id", tenantPropertyId)
      .eq("tenant_id", user.id)
      .eq("status", "active")
      .single();

    if (propertyError || !tenantProperty) {
      return NextResponse.json(
        { error: "Invalid property access" },
        { status: 403 }
      );
    }

    // Insert payment proof
    const { data, error } = await supabase
      .from("payment_proofs")
      .insert({
        tenant_property_id: tenantPropertyId,
        month_year: validatedData.monthYear,
        amount: validatedData.amount,
        payment_date: validatedData.paymentDate,
        proof_url: proofData.proofUrl,
        status: "pending",
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save payment proof" },
        { status: 500 }
      );
    }

    // Create notification for admins
    const { data: adminUsers } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin");

    if (adminUsers && adminUsers.length > 0) {
      const notifications = adminUsers.map((admin) => ({
        user_id: admin.id,
        title: "New Payment Proof Submitted",
        message: `A tenant has uploaded a new payment proof for ${validatedData.monthYear} - $${validatedData.amount}`,
        type: "info",
        is_admin_log: false,
        related_entity_type: "payment",
        related_entity_id: data.id,
        metadata: {
          monthYear: validatedData.monthYear,
          amount: validatedData.amount,
          paymentDate: validatedData.paymentDate
        },
      }));

      await supabase.from("notifications").insert(notifications);
    }

    return NextResponse.json(data, { status: 201 });
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