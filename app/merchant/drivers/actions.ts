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

const schema = z.object({
  nama: z.string().trim().min(1, "Wajib diisi"),
  nik: z.string().trim().min(1, "Wajib diisi"),
  noSim: z.string().trim().min(1, "Wajib diisi"),
  jenisSim: z.enum(["A", "B1", "B2", "C"]),
  masaBerlakuSim: z
    .string()
    .min(1, "Wajib diisi")
    .transform((v) => new Date(v)),
  tempatLahir: optionalString,
  tanggalLahir: optionalDate,
  alamat: optionalString,
  noHp: optionalString,
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .pipe(z.string().email("Email tidak valid").optional()),
  tipeDriver: z.enum(["internal", "freelance"]),
  statusDriver: z.enum(["tersedia", "bertugas", "cuti", "nonaktif"]),
  tanggalBergabung: optionalDate,
  tarifHarian: optionalDecimal,
  namaKontakDarurat: optionalString,
  noHpDarurat: optionalString,
  catatan: optionalString,
});

export async function createDriver(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user.merchantId) throw new Error("Not signed in");
  assertCan(session.user.role, "data:input");

  const parse = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parse.success) return fail(parse.error.flatten().fieldErrors);

  let createdId: number;
  try {
    const created = await db.driver.create({
      data: {
        merchantId: session.user.merchantId,
        ...parse.data,
        status: "draft",
      },
    });
    createdId = created.idDriver;
  } catch (err) {
    const fieldErrs = prismaErrorToFieldErrors(err);
    if (fieldErrs) return fail(fieldErrs);
    throw err;
  }

  revalidatePath("/drivers");
  redirect(`/drivers/${createdId}`);
}

export async function updateDriver(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user.merchantId) throw new Error("Not signed in");
  assertCan(session.user.role, "data:input");

  const idDriver = z.coerce.number().int().positive().parse(formData.get("idDriver"));

  const parse = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parse.success) return fail(parse.error.flatten().fieldErrors);

  const existing = await db.driver.findUnique({ where: { idDriver } });
  if (!existing || existing.merchantId !== session.user.merchantId) {
    throw new Error("Driver not found");
  }

  try {
    await db.driver.update({ where: { idDriver }, data: parse.data });
  } catch (err) {
    const fieldErrs = prismaErrorToFieldErrors(err);
    if (fieldErrs) return fail(fieldErrs);
    throw err;
  }

  revalidatePath(`/drivers/${idDriver}`);
  revalidatePath("/drivers");
  redirect(`/drivers/${idDriver}`);
}
