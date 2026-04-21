import {
  ApprovableType,
  ApprovalAction,
  ApprovalStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";

// Allowed transitions. Anything not listed here is rejected.
const TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
  draft: ["pending_approval"],
  pending_approval: ["approved", "rejected", "draft"],
  approved: ["draft"], // "revert" path if a record becomes invalid
  rejected: ["draft"],
};

export function canTransition(
  from: ApprovalStatus,
  to: ApprovalStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

type SubmitArgs = {
  type: ApprovableType;
  id: number | string;
  merchantId: string;
  actor: { id: string; role: Role };
  note?: string;
};

type DecideArgs = SubmitArgs & { decision: "approved" | "rejected" };

function delegateFor(type: ApprovableType, tx: Prisma.TransactionClient) {
  switch (type) {
    case "pemilik":
      return {
        find: (id: number) => tx.pemilik.findUnique({ where: { idPemilik: id } }),
        update: (id: number, data: { status: ApprovalStatus }) =>
          tx.pemilik.update({ where: { idPemilik: id }, data }),
      };
    case "driver":
      return {
        find: (id: number) => tx.driver.findUnique({ where: { idDriver: id } }),
        update: (id: number, data: { status: ApprovalStatus }) =>
          tx.driver.update({ where: { idDriver: id }, data }),
      };
    case "mobil":
      return {
        find: (id: number) => tx.mobil.findUnique({ where: { idMobil: id } }),
        update: (id: number, data: { status: ApprovalStatus }) =>
          tx.mobil.update({ where: { idMobil: id }, data }),
      };
    case "merchant":
      return {
        find: (id: string) => tx.merchant.findUnique({ where: { id } }),
        update: (id: string, data: { status: ApprovalStatus }) =>
          tx.merchant.update({ where: { id }, data }),
      };
  }
}

async function transition(
  args: SubmitArgs & { to: ApprovalStatus; action: ApprovalAction },
) {
  const { type, id, merchantId, actor, note, to, action } = args;

  return db.$transaction(async (tx) => {
    const delegate = delegateFor(type, tx);
    const numericId = typeof id === "string" && type !== "merchant" ? Number(id) : id;
    // @ts-expect-error polymorphic id
    const record = await delegate.find(numericId);
    if (!record) throw new Error(`${type} ${id} not found`);
    // @ts-expect-error polymorphic record shape
    if (type !== "merchant" && record.merchantId !== merchantId) {
      throw new Error("Cross-tenant access denied");
    }
    const from = record.status as ApprovalStatus;
    if (!canTransition(from, to)) {
      throw new Error(`Invalid transition: ${from} → ${to}`);
    }

    // @ts-expect-error polymorphic id
    await delegate.update(numericId, { status: to });

    await tx.approvalLog.create({
      data: {
        merchantId,
        approvableType: type,
        approvableId: String(id),
        action,
        fromStatus: from,
        toStatus: to,
        actorId: actor.id,
        note,
      },
    });
  });
}

export async function submitForApproval(args: SubmitArgs) {
  assertCan(args.actor.role, "data:input");
  return transition({
    ...args,
    to: "pending_approval",
    action: "submitted",
  });
}

export async function decide(args: DecideArgs) {
  assertCan(args.actor.role, "data:approve");
  return transition({
    ...args,
    to: args.decision,
    action: args.decision === "approved" ? "approved" : "rejected",
  });
}

export async function revert(args: SubmitArgs) {
  assertCan(args.actor.role, "data:approve");
  return transition({
    ...args,
    to: "draft",
    action: "reverted",
  });
}
