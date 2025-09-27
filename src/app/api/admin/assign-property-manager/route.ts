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
    const { propertyId, propertyManagerId, csrfToken } = body;

    if (!propertyId || !propertyManagerId) {
      return NextResponse.json(
        { error: "Missing required fields: propertyId and propertyManagerId" },
        { status: 400 }
      );
    }

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

    // Verify property manager exists and has correct role
    const { data: pmData, error: pmError } = await supabase
      .from("users")
      .select("role, full_name")
      .eq("id", propertyManagerId)
      .single();

    if (pmError || !pmData || pmData.role !== "property_manager") {
      return NextResponse.json(
        { error: "Invalid property manager. User must have property_manager role." },
        { status: 400 }
      );
    }

    // Assign property to property manager
    const { data, error } = await supabase
      .from("properties")
      .update({
        managed_by: propertyManagerId,
        updated_at: new Date().toISOString()
      })
      .eq("id", propertyId)
      .select(`
        id,
        address,
        managed_by,
        users!managed_by (
          full_name,
          email
        )
      `)
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to assign property to property manager" },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: 'property_assigned_to_manager',
      target_type: 'property',
      target_id: propertyId,
      details: {
        property_manager_id: propertyManagerId,
        property_manager_name: pmData.full_name
      }
    });

    return NextResponse.json({
      success: true,
      data,
      message: `Property assigned to ${pmData.full_name}`
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}