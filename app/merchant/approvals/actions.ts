"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { decide } from "@/lib/approvals";

const schema = z.object({
  type: z.enum(["pemilik", "driver", "mobil"]),
  id: z.coerce.number().int().positive(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(500).optional(),
});

export async function decideAction(formData: FormData) {
  const session = await auth();
  if (!session?.user.merchantId) throw new Error("Not signed in");

  const parsed = schema.parse({
    type: formData.get("type"),
    id: formData.get("id"),
    decision: formData.get("decision"),
    note: formData.get("note") || undefined,
  });

  await decide({
    type: parsed.type,
    id: parsed.id,
    merchantId: session.user.merchantId,
    actor: { id: session.user.id, role: session.user.role },
    decision: parsed.decision,
    note: parsed.note,
  });

  revalidatePath("/approvals");
  revalidatePath("/");
}
