import { createAdminClient } from "@/src/lib/supabase/admin";
import { verifyCEOSession } from "@/src/lib/ceo-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const hasSession = await verifyCEOSession();
    if (!hasSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const supabase = createAdminClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .single();

    if (projectError) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const { data: items } = await supabase
      .from("project_items")
      .select("*")
      .eq("project_id", project.id)
      .order("position", { ascending: true });

    const { data: actions } = await supabase
      .from("project_actions")
      .select("*")
      .eq("project_id", project.id)
      .order("position", { ascending: true });

    return NextResponse.json({
      ...project,
      items: items || [],
      actions: actions || [],
    });
  } catch (error) {
    console.error("Project detail error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 },
    );
  }
}

export async function PUT(
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
      .from("projects")
      .update(body)
      .eq("id", project.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Project update error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const hasSession = await verifyCEOSession();
    if (!hasSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const supabase = createAdminClient();

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

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project delete error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 },
    );
  }
}