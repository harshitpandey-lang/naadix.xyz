import { NextResponse } from "next/server";
import { getEventsForRange, getScheduledGoalsForRange, createCalendarEvent } from "@/src/lib/calendar";
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

    const body = await request.json();
    const { start, end, title } = body;

    // Check if this is a fetch request (has start/end) or create request (has title)
    if (start && end && !title) {
      // Fetch events for range
      const events = await getEventsForRange(start, end);
      const goals = await getScheduledGoalsForRange(start, end);
      return NextResponse.json({ events, goals });
    }

    // Create new event
    if (!title || !body.start_at || !body.end_at) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const startDate = new Date(body.start_at);
    const endDate = new Date(body.end_at);

    if (!body.all_day && endDate <= startDate) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const event = await createCalendarEvent({
      title: title.trim(),
      description: body.description ? body.description.trim() : null,
      start_at: body.start_at,
      end_at: body.end_at,
      all_day: body.all_day || false,
      location: body.location ? body.location.trim() : null,
      category: body.category,
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
