import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { validateCSRFToken } from "@/lib/csrf";

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
    const { tenantPropertyId, status, csrfToken } = body;

    if (!tenantPropertyId || !status) {
      return NextResponse.json(
        { error: "Tenant property ID and status are required" },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Update tenant property status
    const { data, error } = await supabase
      .from("tenant_properties")
      .update({ status })
      .eq("id", tenantPropertyId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update tenant property status" },
        { status: 500 }
      );
    }

    // If terminating lease, update property status to available
    if (status === "terminated") {
      const { error: propertyError } = await supabase
        .from("properties")
        .update({ status: "available" })
        .eq("id", data.property_id);

      if (propertyError) {
        console.error("Property update error:", propertyError);
        // Don't fail the whole operation for this
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}