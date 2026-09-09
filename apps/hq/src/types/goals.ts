export type GoalType = "task" | "duration" | "quantity";
export type Goal = { id: string; title: string; description: string | null; goal_type: GoalType; target_value: number | null; unit: string | null; due_date: string; scheduled_start: string | null; scheduled_end: string | null; completed: boolean; completed_at: string | null; created_at: string };
export type GoalInput = Omit<Goal, "id" | "completed" | "completed_at" | "created_at">;
