import { ApprovalStatus, Role } from "@prisma/client";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { submitAction, decideAction, revertAction } from "@/lib/approval-actions";

export function ApprovalActions({
  type,
  id,
  status,
  role,
}: {
  type: "pemilik" | "driver" | "mobil";
  id: number;
  status: ApprovalStatus;
  role: Role;
}) {
  const canInput = can(role, "data:input");
  const canApprove = can(role, "data:approve");

  return (
    <div className="flex flex-wrap gap-2">
      {canInput && status === "draft" && (
        <form action={submitAction}>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="id" value={id} />
          <Button type="submit" size="sm">Ajukan ke Manager</Button>
        </form>
      )}
      {canApprove && status === "pending_approval" && (
        <>
          <form action={decideAction}>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="decision" value="rejected" />
            <Button type="submit" size="sm" variant="outline">Tolak</Button>
          </form>
          <form action={decideAction}>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="decision" value="approved" />
            <Button type="submit" size="sm">Setujui</Button>
          </form>
        </>
      )}
      {canApprove && (status === "approved" || status === "rejected") && (
        <form action={revertAction}>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="id" value={id} />
          <Button type="submit" size="sm" variant="outline">
            Kembalikan ke draft
          </Button>
        </form>
      )}
    </div>
  );
}
