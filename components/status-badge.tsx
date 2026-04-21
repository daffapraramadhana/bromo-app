import { ApprovalStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const LABEL: Record<ApprovalStatus, { text: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  draft: { text: "Draft", variant: "secondary" },
  pending_approval: { text: "Menunggu approval", variant: "warning" },
  approved: { text: "Disetujui", variant: "success" },
  rejected: { text: "Ditolak", variant: "destructive" },
};

export function StatusBadge({ status }: { status: ApprovalStatus }) {
  const { text, variant } = LABEL[status];
  return <Badge variant={variant}>{text}</Badge>;
}
