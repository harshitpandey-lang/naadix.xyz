import { NextResponse } from "next/server";
import { setGoalCompleted } from "@/src/lib/goals";
import { isSupabaseConfigured } from "@/src/lib/supabase/config";
import { createClient } from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Not configured" }, { status: 401 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, completed } = await request.json();

    if (!id || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await setGoalCompleted(id, completed);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toggle complete error:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}
