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

const vehicleSchema = z.object({
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

const ownerSchema = z.object({
  nama: z.string().trim().min(1, "Wajib diisi"),
  tipePemilik: z.enum(["individu", "perusahaan"]),
  nik: optionalString,
  npwp: optionalString,
  namaPerusahaan: optionalString,
  noHp: optionalString,
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .pipe(z.string().email("Email tidak valid").optional()),
  alamat: optionalString,
  kota: optionalString,
  provinsi: optionalString,
  kodePos: optionalString,
  nomorRekening: optionalString,
  namaBank: optionalString,
  namaPemilikRekening: optionalString,
  tanggalBergabung: optionalDate,
  catatan: optionalString,
});

function collectVehicles(formData: FormData) {
  const buckets = new Map<string, Record<string, string>>();
  for (const [key, value] of formData.entries()) {
    const m = key.match(/^vehicle\[(\d+)\]\[([a-zA-Z_]+)\]$/);
    if (!m) continue;
    const [, idx, field] = m;
    if (!buckets.has(idx)) buckets.set(idx, {});
    buckets.get(idx)![field] = String(value);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([idx, obj]) => ({ idx: Number(idx), obj }))
    .filter(({ obj }) =>
      ["merk", "tipe", "noPolisi", "noRangka", "noMesin"].some(
        (k) => obj[k] && obj[k].trim().length > 0,
      ),
    );
}

function ownerFormEntries(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].filter(([k]) => !k.startsWith("vehicle[")),
  );
}

export async function createOwner(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user.merchantId) throw new Error("Not signed in");
  assertCan(session.user.role, "data:input");

  const ownerParse = ownerSchema.safeParse(ownerFormEntries(formData));
  if (!ownerParse.success) {
    return fail(ownerParse.error.flatten().fieldErrors);
  }

  const errors: Record<string, string[]> = {};
  const validVehicles: z.infer<typeof vehicleSchema>[] = [];
  for (const { idx, obj } of collectVehicles(formData)) {
    const r = vehicleSchema.safeParse(obj);
    if (!r.success) {
      for (const [field, msgs] of Object.entries(r.error.flatten().fieldErrors)) {
        if (msgs) errors[`vehicle[${idx}][${field}]`] = msgs;
      }
    } else {
      validVehicles.push(r.data);
    }
  }
  if (Object.keys(errors).length > 0) return fail(errors);

  let createdId: number;
  try {
    const created = await db.$transaction(async (tx) => {
      const p = await tx.pemilik.create({
        data: {
          merchantId: session.user.merchantId!,
          ...ownerParse.data,
          status: "draft",
        },
      });
      if (validVehicles.length > 0) {
        await tx.mobil.createMany({
          data: validVehicles.map((v) => ({
            merchantId: session.user.merchantId!,
            idPemilik: p.idPemilik,
            ...v,
            status: "draft",
          })),
        });
      }
      return p;
    });
    createdId = created.idPemilik;
  } catch (err) {
    const fieldErrs = prismaErrorToFieldErrors(err);
    if (fieldErrs) return fail(fieldErrs);
    throw err;
  }

  revalidatePath("/owners");
  revalidatePath("/vehicles");
  redirect(`/owners/${createdId}`);
}

export async function updateOwner(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user.merchantId) throw new Error("Not signed in");
  assertCan(session.user.role, "data:input");

  const idPemilik = z.coerce.number().int().positive().parse(formData.get("idPemilik"));

  const ownerParse = ownerSchema.safeParse(ownerFormEntries(formData));
  if (!ownerParse.success) {
    return fail(ownerParse.error.flatten().fieldErrors);
  }

  const owner = await db.pemilik.findUnique({ where: { idPemilik } });
  if (!owner || owner.merchantId !== session.user.merchantId) {
    throw new Error("Owner not found");
  }

  try {
    await db.pemilik.update({
      where: { idPemilik },
      data: ownerParse.data,
    });
  } catch (err) {
    const fieldErrs = prismaErrorToFieldErrors(err);
    if (fieldErrs) return fail(fieldErrs);
    throw err;
  }

  revalidatePath(`/owners/${idPemilik}`);
  revalidatePath("/owners");
  redirect(`/owners/${idPemilik}`);
}
