import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { propertySchema } from "@/lib/validations";
import { validateCSRFToken } from "@/lib/csrf";

// POST /api/properties - Create new property
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

    // Remove CSRF token from validation data
    const { csrfToken, ...propertyData } = body;

    // Validate input data
    const validatedData = propertySchema.parse(propertyData);

    // Create Supabase client
    const supabase = await createClient();

    // Insert property
    const { data, error } = await supabase
      .from("properties")
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: `Failed to create property: ${error.message || error.details || 'Unknown error'}` },
        { status: 500 }
      );
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

// PUT /api/properties - Update existing property
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
    const { id, csrfToken, ...propertyData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }

    // Validate input data
    const validatedData = propertySchema.parse(propertyData);

    // Create Supabase client
    const supabase = await createClient();

    // Update property
    const { data, error } = await supabase
      .from("properties")
      .update(validatedData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: `Failed to update property: ${error.message || error.details || 'Unknown error'}` },
        { status: 500 }
      );
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