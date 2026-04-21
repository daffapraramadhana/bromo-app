/* eslint-disable no-console */
import { db } from "../lib/db";
import { decide, submitForApproval, revert } from "../lib/approvals";

async function main() {
  const manager = await db.user.findUniqueOrThrow({
    where: { email: "manager@explorin.co.id" },
  });
  const admin = await db.user.findUniqueOrThrow({
    where: { email: "admin@explorin.co.id" },
  });
  const pending = await db.pemilik.findFirstOrThrow({
    where: { status: "pending_approval" },
  });
  console.log(`target: pemilik#${pending.idPemilik} "${pending.nama}" status=${pending.status}`);

  // 1. Invalid transition should throw
  console.log("\n[1] manager rejects pending pemilik");
  await decide({
    type: "pemilik",
    id: pending.idPemilik,
    merchantId: pending.merchantId,
    actor: { id: manager.id, role: manager.role },
    decision: "rejected",
    note: "Dokumen tidak lengkap",
  });
  let fresh = await db.pemilik.findUniqueOrThrow({
    where: { idPemilik: pending.idPemilik },
  });
  console.log(`   -> status now: ${fresh.status}`);

  // 2. Admin lacks data:approve — should throw
  console.log("\n[2] admin tries to approve (should fail)");
  try {
    await decide({
      type: "pemilik",
      id: pending.idPemilik,
      merchantId: pending.merchantId,
      actor: { id: admin.id, role: admin.role },
      decision: "approved",
    });
    console.log("   -> UNEXPECTED: no error");
  } catch (e) {
    console.log(`   -> OK threw: ${(e as Error).message}`);
  }

  // 3. Revert → submit → approve happy path
  console.log("\n[3] revert rejected -> draft");
  await revert({
    type: "pemilik",
    id: pending.idPemilik,
    merchantId: pending.merchantId,
    actor: { id: manager.id, role: manager.role },
  });
  fresh = await db.pemilik.findUniqueOrThrow({ where: { idPemilik: pending.idPemilik } });
  console.log(`   -> status: ${fresh.status}`);

  console.log("\n[4] admin submits draft -> pending");
  await submitForApproval({
    type: "pemilik",
    id: pending.idPemilik,
    merchantId: pending.merchantId,
    actor: { id: admin.id, role: admin.role },
  });
  fresh = await db.pemilik.findUniqueOrThrow({ where: { idPemilik: pending.idPemilik } });
  console.log(`   -> status: ${fresh.status}`);

  console.log("\n[5] manager approves pending -> approved");
  await decide({
    type: "pemilik",
    id: pending.idPemilik,
    merchantId: pending.merchantId,
    actor: { id: manager.id, role: manager.role },
    decision: "approved",
  });
  fresh = await db.pemilik.findUniqueOrThrow({ where: { idPemilik: pending.idPemilik } });
  console.log(`   -> status: ${fresh.status}`);

  // 6. Cross-tenant attempt should throw
  console.log("\n[6] cross-tenant attempt (should fail)");
  try {
    await decide({
      type: "pemilik",
      id: pending.idPemilik,
      merchantId: "not-a-real-merchant",
      actor: { id: manager.id, role: manager.role },
      decision: "rejected",
    });
    console.log("   -> UNEXPECTED: no error");
  } catch (e) {
    console.log(`   -> OK threw: ${(e as Error).message}`);
  }

  // 7. Audit trail
  const logs = await db.approvalLog.findMany({
    where: { approvableType: "pemilik", approvableId: String(pending.idPemilik) },
    orderBy: { createdAt: "asc" },
    include: { actor: { select: { email: true } } },
  });
  console.log(`\n[7] audit trail (${logs.length} entries):`);
  for (const l of logs) {
    console.log(`   ${l.actor.email.padEnd(28)}  ${l.action.padEnd(10)}  ${l.fromStatus ?? "-"} -> ${l.toStatus}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
