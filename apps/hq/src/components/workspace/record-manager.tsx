"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2 } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

export type WorkspaceField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "url" | "select" | "tags" | "checkbox";
  required?: boolean;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
};

export type WorkspaceRecord = { id: string; [key: string]: unknown };

export function RecordManager({
  table,
  userId,
  records,
  fields,
  titleField = "title",
  descriptionField,
  statusField = "status",
  emptyTitle,
  emptyBody,
  loadError,
}: {
  table: string;
  userId: string;
  records: WorkspaceRecord[];
  fields: WorkspaceField[];
  titleField?: string;
  descriptionField?: string;
  statusField?: string | null;
  emptyTitle: string;
  emptyBody: string;
  loadError?: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const statusOptions = useMemo(
    () => fields.find((field) => field.name === statusField)?.options ?? [],
    [fields, statusField],
  );
  const statuses = useMemo(
    () => statusField ? [...new Set([
      ...statusOptions.map((option) => option.value),
      ...records.map((record) => String(record[statusField] ?? "")).filter(Boolean),
    ])] : [],
    [records, statusField, statusOptions],
  );
  const shown = records.filter((record) => {
    const haystack = Object.values(record).join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === "all" || String(record[statusField ?? ""]) === status);
  });

  async function createRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    setPending(true);
    setMessage("");
    const form = new FormData(target);
    const payload: Record<string, unknown> = { user_id: userId };
    fields.forEach((field) => {
      const raw = String(form.get(field.name) ?? "").trim();
      if (field.type === "checkbox") {
        payload[field.name] = form.has(field.name);
      } else if (raw) {
        payload[field.name] = field.type === "number"
          ? Number(raw)
          : field.type === "tags"
            ? raw.split(",").map((value) => value.trim()).filter(Boolean)
            : raw;
      }
    });
    if (table === "projects") {
      payload.slug = `${String(payload.name ?? "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 6)}`;
      payload.progress ??= 0;
    }
    const { error } = await createClient().from(table).insert(payload);
    setPending(false);
    if (error) return setMessage(error.message);
    target.reset();
    setCreating(false);
    setMessage("Saved.");
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this private record? This cannot be undone.")) return;
    setPending(true);
    const { error } = await createClient().from(table).delete().eq("id", id);
    setPending(false);
    if (error) return setMessage(error.message);
    router.refresh();
  }

  async function updateStatus(id: string, value: string) {
    if (!statusField) return;
    setPending(true);
    setMessage("");
    const { error } = await createClient().from(table).update({ [statusField]: value }).eq("id", id);
    setPending(false);
    if (error) return setMessage(error.message);
    setMessage("Updated.");
    router.refresh();
  }

  return (
    <div className="workspace-manager">
      <div className="workspace-toolbar">
        <label className="workspace-search"><Search size={15} /><span className="sr-only">Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" /></label>
        {statuses.length > 0 && <select aria-label={`Filter by ${statusField}`} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All</option>{statuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select>}
        <button className="hq-action" type="button" onClick={() => setCreating(!creating)}><Plus size={15} /> New</button>
      </div>
      {creating && <form className="workspace-form hq-panel" onSubmit={createRecord}>
        {fields.map((field) => <label key={field.name} className={field.type === "textarea" ? "wide" : field.type === "checkbox" ? "checkbox-field wide" : ""}><span>{field.label}</span>{field.type === "textarea" ? <textarea name={field.name} required={field.required} placeholder={field.placeholder} rows={4} /> : field.type === "select" ? <select name={field.name} required={field.required}><option value="">Choose</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "checkbox" ? <input name={field.name} type="checkbox" /> : <input name={field.name} type={field.type === "tags" ? "text" : field.type ?? "text"} required={field.required} min={field.min} max={field.max} placeholder={field.placeholder} />}</label>)}
        <div className="wide form-row"><button className="hq-action" disabled={pending}>{pending ? "Saving…" : "Save record"}</button><button type="button" className="hq-quiet" onClick={() => setCreating(false)}>Cancel</button></div>
      </form>}
      {loadError && <p className="workspace-error" role="alert"><strong>Data unavailable.</strong> {loadError}</p>}
      {message && <p className="workspace-message" role="status">{message}</p>}
      {shown.length ? <div className="record-grid">{shown.map((record) => <article className="hq-panel record-card" key={record.id}>
        <div className="record-top"><div>{statusField && record[statusField] != null && (statusOptions.length ? <select className="record-status-control" aria-label={`Change ${String(record[titleField] ?? "record")} ${statusField}`} value={String(record[statusField])} disabled={pending} onChange={(event) => updateStatus(record.id, event.target.value)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <span className="record-status">{String(record[statusField]).replaceAll("_", " ")}</span>)}<h2>{String(record[titleField] ?? "Untitled")}</h2></div><button type="button" onClick={() => remove(record.id)} disabled={pending} aria-label={`Delete ${String(record[titleField] ?? "record")}`}><Trash2 size={15} /></button></div>
        {descriptionField && record[descriptionField] != null && <p>{String(record[descriptionField])}</p>}
        {typeof record.current_level === "number" && typeof record.target_level === "number" && <div className="skill-levels" aria-label={`Current level ${record.current_level} of 5; target ${record.target_level} of 5`}><span>{[1, 2, 3, 4, 5].map((level) => <i key={level} data-on={level <= Number(record.current_level) ? "true" : undefined} />)}</span><b aria-hidden="true">→</b><span>{[1, 2, 3, 4, 5].map((level) => <i key={level} data-target={level <= Number(record.target_level) ? "true" : undefined} />)}</span></div>}
        <dl>{fields.filter((field) => ![titleField, descriptionField].includes(field.name) && record[field.name] !== null && record[field.name] !== undefined && String(record[field.name]) !== "").slice(0, 5).map((field) => <div key={field.name}><dt>{field.label}</dt><dd>{Array.isArray(record[field.name]) ? (record[field.name] as unknown[]).join(", ") : typeof record[field.name] === "boolean" ? (record[field.name] ? "Yes" : "No") : String(record[field.name])}</dd></div>)}</dl>
      </article>)}</div> : !loadError && <div className="hq-panel empty-state"><span className="signal-dot" aria-hidden="true" /><h2>{emptyTitle}</h2><p>{emptyBody}</p><button className="hq-action" type="button" onClick={() => setCreating(true)}><Plus size={15} /> Create the first one</button></div>}
    </div>
  );
}
