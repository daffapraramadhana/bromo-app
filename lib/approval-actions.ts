"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApprovableType } from "@prisma/client";
import { auth } from "@/auth";
import { submitForApproval, decide, revert } from "@/lib/approvals";

const subjectSchema = z.object({
  type: z.enum(["pemilik", "driver", "mobil"]),
  id: z.coerce.number().int().positive(),
});

async function currentActor() {
  const session = await auth();
  if (!session?.user.merchantId) throw new Error("Not signed in");
  return {
    merchantId: session.user.merchantId,
    actor: { id: session.user.id, role: session.user.role },
  };
}

export async function submitAction(formData: FormData) {
  const { type, id } = subjectSchema.parse({
    type: formData.get("type"),
    id: formData.get("id"),
  });
  const { merchantId, actor } = await currentActor();
  await submitForApproval({ type: type as ApprovableType, id, merchantId, actor });
  revalidatePath(`/${type === "pemilik" ? "owners" : type === "mobil" ? "vehicles" : "drivers"}/${id}`);
  revalidatePath("/approvals");
  revalidatePath("/");
}

export async function decideAction(formData: FormData) {
  const { type, id } = subjectSchema.parse({
    type: formData.get("type"),
    id: formData.get("id"),
  });
  const decision = z.enum(["approved", "rejected"]).parse(formData.get("decision"));
  const note = z.string().max(500).optional().parse(formData.get("note") || undefined);
  const { merchantId, actor } = await currentActor();
  await decide({
    type: type as ApprovableType,
    id,
    merchantId,
    actor,
    decision,
    note,
  });
  revalidatePath(`/${type === "pemilik" ? "owners" : type === "mobil" ? "vehicles" : "drivers"}/${id}`);
  revalidatePath("/approvals");
  revalidatePath("/");
}

export async function revertAction(formData: FormData) {
  const { type, id } = subjectSchema.parse({
    type: formData.get("type"),
    id: formData.get("id"),
  });
  const { merchantId, actor } = await currentActor();
  await revert({ type: type as ApprovableType, id, merchantId, actor });
  revalidatePath(`/${type === "pemilik" ? "owners" : type === "mobil" ? "vehicles" : "drivers"}/${id}`);
  revalidatePath("/approvals");
}
