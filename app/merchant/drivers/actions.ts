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

const schema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi"),
  nik: z.string().trim().min(1, "NIK wajib diisi"),
  noSim: z.string().trim().min(1, "No. SIM wajib diisi"),
  jenisSim: z.enum(["A", "B1", "B2", "C"]),
  masaBerlakuSim: z
    .string()
    .min(1, "Masa berlaku SIM wajib diisi")
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

export async function createDriver(formData: FormData) {
  const session = await auth();
  if (!session?.user.merchantId) throw new Error("Not signed in");
  assertCan(session.user.role, "data:input");

  const input = schema.parse(Object.fromEntries(formData.entries()));
  const created = await db.driver.create({
    data: {
      merchantId: session.user.merchantId,
      ...input,
      status: "draft",
    },
  });

  revalidatePath("/drivers");
  redirect(`/drivers/${created.idDriver}`);
}
