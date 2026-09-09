import { verifyCEOSession } from "@/src/lib/ceo-auth";
import { createAdminClient } from "@/src/lib/supabase/admin";
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
    const supabase = createAdminClient();

    // Get source project
    const { data: sourceProject, error: sourceError } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .single();

    if (sourceError || !sourceProject) {
      return NextResponse.json(
        { error: "Source project not found" },
        { status: 404 },
      );
    }

    // Generate new slug
    const baseName = sourceProject.name + " (Copy)";
    const newSlug = baseName
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Create duplicate project
    const { data: duplicatedProject, error: createError } = await supabase
      .from("projects")
      .insert([
        {
          ...sourceProject,
          id: undefined, // Let DB generate new ID
          slug: newSlug,
          name: baseName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 500 },
      );
    }

    // Copy project items (blocks)
    const { data: items } = await supabase
      .from("project_items")
      .select("*")
      .eq("project_id", sourceProject.id);

    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: Record<string, unknown>) => ({
        ...item,
        id: undefined, // Let DB generate new ID
        project_id: duplicatedProject.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await supabase.from("project_items").insert(itemsToInsert);
    }

    return NextResponse.json(duplicatedProject, { status: 201 });
  } catch (error) {
    console.error("Project duplication error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 },
    );
  }
}
