import { CanonicalProjectStatus, PROJECT_STATUS_OPTIONS } from "@/src/lib/projects/types";

interface StatusMeta {
  label: string;
  chipClass: string;
  dotClass: string;
}

const STATUS_META: Record<CanonicalProjectStatus, StatusMeta> = {
  IDEA: {
    label: "Idea",
    chipClass: "bg-[#2a2d34] text-[#b9c0d1]",
    dotClass: "bg-[#b9c0d1]",
  },
  PLANNED: {
    label: "Planned",
    chipClass: "bg-[#302f28] text-[#b9ad83]",
    dotClass: "bg-[#b9ad83]",
  },
  ACTIVE: {
    label: "Active",
    chipClass: "bg-[#263b32] text-[#8fbda1]",
    dotClass: "bg-[#8fbda1]",
  },
  ON_HOLD: {
    label: "On Hold",
    chipClass: "bg-[#352b2b] text-[#b99797]",
    dotClass: "bg-[#b99797]",
  },
  BLOCKED: {
    label: "Blocked",
    chipClass: "bg-[#3b2328] text-[#d0868d]",
    dotClass: "bg-[#d0868d]",
  },
  COMPLETED: {
    label: "Completed",
    chipClass: "bg-[#29352f] text-[#9caf9f]",
    dotClass: "bg-[#9caf9f]",
  },
  ARCHIVED: {
    label: "Archived",
    chipClass: "bg-[#202a2d] text-[#91a6b2]",
    dotClass: "bg-[#91a6b2]",
  },
  PAUSED: {
    label: "Paused",
    chipClass: "bg-[#352b2b] text-[#b99797]",
    dotClass: "bg-[#b99797]",
  },
};

function isCanonicalStatus(value: string): value is CanonicalProjectStatus {
  return Object.hasOwn(STATUS_META, value);
}

export function normalizeProjectStatus(value?: string | null): CanonicalProjectStatus | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "ON HOLD") {
    return "ON_HOLD";
  }

  if (normalized === "PAUSED") {
    return "ON_HOLD";
  }

  if (isCanonicalStatus(normalized)) {
    return normalized;
  }

  return null;
}

export function getStatusLabel(value?: string | null): string {
  const normalized = normalizeProjectStatus(value);
  if (!normalized) {
    return value && value.trim().length > 0 ? value : "Unspecified";
  }

  return STATUS_META[normalized].label;
}

export function getStatusChipClass(value?: string | null): string {
  const normalized = normalizeProjectStatus(value);
  if (!normalized) {
    return "bg-[#202a2d] text-[#91a6b2]";
  }

  return STATUS_META[normalized].chipClass;
}

export function getStatusDotClass(value?: string | null): string {
  const normalized = normalizeProjectStatus(value);
  if (!normalized) {
    return "bg-[#91a6b2]";
  }

  return STATUS_META[normalized].dotClass;
}

export { PROJECT_STATUS_OPTIONS };
