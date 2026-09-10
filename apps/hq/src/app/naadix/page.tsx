import type { Metadata } from "next";
import { WorkspacePage } from "@/src/components/workspace/workspace-page";

export const metadata: Metadata = { title: "NaadiX Company", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function NaadixPage() { return <WorkspacePage route="/naadix" eyebrow="PRIVATE NODE / COMPANY" title="NaadiX" description="The founder’s private company cockpit: priorities, pipeline, projects, content, Labs, and decisions." table="company_items" select="id,title,item_type,status,notes,due_date,updated_at" descriptionField="notes" statusField="item_type" emptyTitle="The company cockpit is clear." emptyBody="Add only real priorities, opportunities, decisions, or work. No metrics are invented here." fields={[
  { name: "title", label: "Item", required: true }, { name: "item_type", label: "Section", type: "select", required: true, options: ["priority","pipeline","project","content","lab","decision"].map((value) => ({ label: value, value })) }, { name: "status", label: "Status", type: "select", required: true, options: ["active","planned","waiting","complete","archived"].map((value) => ({ label: value, value })) }, { name: "due_date", label: "Date", type: "date" }, { name: "notes", label: "Context", type: "textarea" },
]} />; }
