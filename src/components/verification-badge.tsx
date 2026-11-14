import type { VerificationStatus } from "@/src/types";
import { verificationLabel } from "@/src/lib/format";
import { Icon } from "./ui/icon";

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <span className="verification-badge" data-level={status}><Icon name="shield" size={12} />{verificationLabel(status)}</span>;
}
export function ScoreBadge({ score }: { score: number | null }) {
  return score == null ? <span className="text-[10px] text-muted">Score pending</span> : <span className="text-xs text-accent"><span className="font-medium">{score}</span><span className="ml-1 text-[10px] text-muted">/ 100</span></span>;
}
