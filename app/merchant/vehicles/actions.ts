"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : undefined));

const optionalDecimal = z
  .string()
  .optional()
  .transform((v) =>
    v && v.trim().length > 0 ? new Prisma.Decimal(v) : undefined,
  );

const optionalInt = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? Number(v) : undefined));

const schema = z.object({
  idPemilik: z.coerce.number().int().positive(),
  merk: z.string().trim().min(1),
  tipe: z.string().trim().min(1),
  tahunPembuatan: z.coerce.number().int(),
  tahunKendaraan: optionalInt,
  noPolisi: z.string().trim().min(1),
  noRangka: z.string().trim().min(1),
  noMesin: z.string().trim().min(1),
  warna: optionalString,
  kapasitas: optionalInt,
  masaBerlakuPajak: optionalDate,
  hargaSewaHarian: optionalDecimal,
});

export async function createVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user.merchantId) throw new Error("Not signed in");
  assertCan(session.user.role, "data:input");

  const input = schema.parse(Object.fromEntries(formData.entries()));

  // Cross-tenant guard.
  const owner = await db.pemilik.findUnique({
    where: { idPemilik: input.idPemilik },
  });
  if (!owner || owner.merchantId !== session.user.merchantId) {
    throw new Error("Owner not found");
  }

  const created = await db.mobil.create({
    data: {
      merchantId: session.user.merchantId,
      ...input,
      status: "draft",
    },
  });

  revalidatePath("/vehicles");
  revalidatePath(`/owners/${input.idPemilik}`);
  redirect(`/vehicles/${created.idMobil}`);
}
