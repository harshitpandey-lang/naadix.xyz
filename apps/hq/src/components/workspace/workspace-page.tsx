import type { WorkspaceField, WorkspaceRecord } from "./record-manager";
import { RecordManager } from "./record-manager";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { requireUser } from "@/src/lib/require-user";

export async function WorkspacePage({ route, eyebrow, title, description, table, select, fields, titleField, descriptionField, statusField, emptyTitle, emptyBody }: {
  route: string; eyebrow: string; title: string; description: string; table: string; select: string;
  fields: WorkspaceField[]; titleField?: string; descriptionField?: string; statusField?: string | null; emptyTitle: string; emptyBody: string;
}) {
  const { supabase, user } = await requireUser(route);
  const [{ data, error }, { data: profile }] = await Promise.all([
    supabase.from(table).select(select).order("updated_at", { ascending: false }),
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
  ]);
  const name = profile?.display_name || user.email?.split("@")[0] || "Founder";
  return <DashboardShell name={name} role="Founder, NaadiX"><main className="hq-content workspace-page"><header className="workspace-intro"><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></header><RecordManager table={table} userId={user.id} records={(data ?? []) as unknown as WorkspaceRecord[]} fields={fields} titleField={titleField} descriptionField={descriptionField} statusField={statusField} emptyTitle={emptyTitle} emptyBody={emptyBody} loadError={error?.message} /></main></DashboardShell>;
}
