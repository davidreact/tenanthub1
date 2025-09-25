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
    const { id, csrfToken, ...itemData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Inventory item ID is required" },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Update inventory item
    const { data, error } = await supabase
      .from("inventory_items")
      .update(itemData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update inventory item" },
        { status: 500 }
      );
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