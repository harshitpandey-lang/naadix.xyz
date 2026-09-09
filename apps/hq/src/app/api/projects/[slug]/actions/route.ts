import { createAdminClient } from "@/src/lib/supabase/admin";
import { verifyCEOSession } from "@/src/lib/ceo-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const hasSession = await verifyCEOSession();
    if (!hasSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    // Get project ID
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .single();

    if (projectError) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from("project_actions")
      .insert([
        {
          ...body,
          project_id: project.id,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Project action creation error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 },
    );
  }
}