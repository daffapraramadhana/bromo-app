import { ApprovalLog, User } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

type LogWithActor = ApprovalLog & { actor: Pick<User, "name" | "email"> };

const ACTION_LABEL: Record<string, string> = {
  submitted: "mengajukan",
  approved: "menyetujui",
  rejected: "menolak",
  reverted: "mengembalikan ke draft",
};

export function Timeline({ logs }: { logs: LogWithActor[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada aktivitas approval.
      </p>
    );
  }
  return (
    <ol className="relative border-l pl-4 space-y-4">
      {logs.map((log) => (
        <li key={log.id} className="space-y-1">
          <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-primary" />
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{log.actor.name ?? log.actor.email}</span>
            <span className="text-muted-foreground">
              {ACTION_LABEL[log.action] ?? log.action}
            </span>
            <StatusBadge status={log.toStatus} />
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(log.createdAt)}
            {log.fromStatus && <> · {log.fromStatus} → {log.toStatus}</>}
          </div>
          {log.note && (
            <div className="text-xs italic text-muted-foreground">
              “{log.note}”
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
