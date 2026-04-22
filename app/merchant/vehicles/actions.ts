"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import {
  ActionState,
  fail,
  prismaErrorToFieldErrors,
} from "@/lib/form-state";

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

const createSchema = z.object({
  idPemilik: z.coerce.number().int().positive(),
  merk: z.string().trim().min(1, "Wajib diisi"),
  tipe: z.string().trim().min(1, "Wajib diisi"),
  tahunPembuatan: z.coerce.number({ invalid_type_error: "Wajib diisi" }).int(),
  tahunKendaraan: optionalInt,
  noPolisi: z.string().trim().min(1, "Wajib diisi"),
  noRangka: z.string().trim().min(1, "Wajib diisi"),
  noMesin: z.string().trim().min(1, "Wajib diisi"),
  warna: optionalString,
  kapasitas: optionalInt,
  masaBerlakuPajak: optionalDate,
  hargaSewaHarian: optionalDecimal,
});

// Edit doesn't allow changing the owner.
const updateSchema = createSchema.omit({ idPemilik: true }).extend({
  statusMobil: z.enum(["tersedia", "disewa", "maintenance"]),
});

export async function createVehicle(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user.merchantId) throw new Error("Not signed in");
  assertCan(session.user.role, "data:input");

  const parse = createSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parse.success) return fail(parse.error.flatten().fieldErrors);

  const owner = await db.pemilik.findUnique({
    where: { idPemilik: parse.data.idPemilik },
  });
  if (!owner || owner.merchantId !== session.user.merchantId) {
    return fail({ idPemilik: ["Pemilik tidak ditemukan"] });
  }

  let createdId: number;
  try {
    const created = await db.mobil.create({
      data: {
        merchantId: session.user.merchantId,
        ...parse.data,
        status: "draft",
      },
    });
    createdId = created.idMobil;
  } catch (err) {
    const fieldErrs = prismaErrorToFieldErrors(err);
    if (fieldErrs) return fail(fieldErrs);
    throw err;
  }

  revalidatePath("/vehicles");
  revalidatePath(`/owners/${parse.data.idPemilik}`);
  redirect(`/vehicles/${createdId}`);
}

export async function updateVehicle(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user.merchantId) throw new Error("Not signed in");
  assertCan(session.user.role, "data:input");

  const idMobil = z.coerce.number().int().positive().parse(formData.get("idMobil"));

  const parse = updateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parse.success) return fail(parse.error.flatten().fieldErrors);

  const existing = await db.mobil.findUnique({ where: { idMobil } });
  if (!existing || existing.merchantId !== session.user.merchantId) {
    throw new Error("Vehicle not found");
  }

  try {
    await db.mobil.update({ where: { idMobil }, data: parse.data });
  } catch (err) {
    const fieldErrs = prismaErrorToFieldErrors(err);
    if (fieldErrs) return fail(fieldErrs);
    throw err;
  }

  revalidatePath(`/vehicles/${idMobil}`);
  revalidatePath("/vehicles");
  revalidatePath(`/owners/${existing.idPemilik}`);
  redirect(`/vehicles/${idMobil}`);
}
