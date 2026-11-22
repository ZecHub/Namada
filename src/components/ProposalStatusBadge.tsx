import { classifyProposalStatus } from "../lib/proposal-status";

export default function ProposalStatusBadge({
  status,
}: {
  status: unknown;
}) {
  const { category, label } = classifyProposalStatus(status);
  const title = typeof status === "string" && status.trim() ? status : label;

  return (
    <span className={`proposal-status ${category}`} title={title}>
      {label}
    </span>
  );
}
