export type ProposalStatusCategory =
  | "active"
  | "pending"
  | "completed"
  | "rejected"
  | "unknown";

export type ClassifiedProposalStatus = {
  category: ProposalStatusCategory;
  label: string;
};

const labels: Record<ProposalStatusCategory, string> = {
  active: "Active",
  pending: "Pending",
  completed: "Completed",
  rejected: "Rejected",
  unknown: "Unknown",
};

const statusCategories: Record<string, ProposalStatusCategory> = {
  active: "active",
  ongoing: "active",
  "on-going": "active",
  pending: "pending",
  ended: "completed",
  completed: "completed",
  passed: "completed",
  executedpassed: "completed",
  rejected: "rejected",
  executedrejected: "rejected",
};

export function classifyProposalStatus(status: unknown): ClassifiedProposalStatus {
  if (typeof status !== "string" || !status.trim()) {
    return { category: "unknown", label: labels.unknown };
  }

  const category = statusCategories[status.trim().toLowerCase()] ?? "unknown";
  return { category, label: labels[category] };
}
