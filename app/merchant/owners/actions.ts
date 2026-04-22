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

const requiredInt = z.coerce.number().int();

const vehicleSchema = z.object({
  merk: z.string().trim().min(1, "Merk wajib diisi"),
  tipe: z.string().trim().min(1, "Tipe wajib diisi"),
  tahunPembuatan: requiredInt,
  tahunKendaraan: optionalInt,
  noPolisi: z.string().trim().min(1, "No. polisi wajib diisi"),
  noRangka: z.string().trim().min(1, "No. rangka wajib diisi"),
  noMesin: z.string().trim().min(1, "No. mesin wajib diisi"),
  warna: optionalString,
  kapasitas: optionalInt,
  masaBerlakuPajak: optionalDate,
  hargaSewaHarian: optionalDecimal,
});

const ownerSchema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi"),
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
  // Fields are named vehicle[i][field]. Group them by i.
  const buckets = new Map<string, Record<string, string>>();
  for (const [key, value] of formData.entries()) {
    const m = key.match(/^vehicle\[(\d+)\]\[([a-zA-Z_]+)\]$/);
    if (!m) continue;
    const [, idx, field] = m;
    if (!buckets.has(idx)) buckets.set(idx, {});
    buckets.get(idx)![field] = String(value);
  }
  const items = [...buckets.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, obj]) => obj);
  // Drop rows that are completely empty.
  return items.filter((r) =>
    ["merk", "tipe", "noPolisi", "noRangka", "noMesin"].some(
      (k) => r[k] && r[k].trim().length > 0,
    ),
  );
}

export async function createOwnerWithVehicles(formData: FormData) {
  const session = await auth();
  if (!session?.user.merchantId) throw new Error("Not signed in");
  assertCan(session.user.role, "data:input");

  const ownerInput = ownerSchema.parse(Object.fromEntries(
    [...formData.entries()].filter(([k]) => !k.startsWith("vehicle[")),
  ));
  const vehicleInputs = collectVehicles(formData).map((row) =>
    vehicleSchema.parse(row),
  );

  const pemilik = await db.$transaction(async (tx) => {
    const created = await tx.pemilik.create({
      data: {
        merchantId: session.user.merchantId!,
        ...ownerInput,
        status: "draft",
      },
    });
    if (vehicleInputs.length > 0) {
      await tx.mobil.createMany({
        data: vehicleInputs.map((v) => ({
          merchantId: session.user.merchantId!,
          idPemilik: created.idPemilik,
          ...v,
          status: "draft",
        })),
      });
    }
    return created;
  });

  revalidatePath("/owners");
  revalidatePath("/vehicles");
  redirect(`/owners/${pemilik.idPemilik}`);
}

export async function addVehicleToOwner(formData: FormData) {
  const session = await auth();
  if (!session?.user.merchantId) throw new Error("Not signed in");
  assertCan(session.user.role, "data:input");

  const idPemilik = z.coerce.number().int().parse(formData.get("idPemilik"));
  const input = vehicleSchema.parse(
    Object.fromEntries(
      [...formData.entries()].filter(([k]) => k !== "idPemilik"),
    ),
  );

  // Cross-tenant guard.
  const owner = await db.pemilik.findUnique({ where: { idPemilik } });
  if (!owner || owner.merchantId !== session.user.merchantId) {
    throw new Error("Owner not found");
  }

  const created = await db.mobil.create({
    data: {
      merchantId: session.user.merchantId,
      idPemilik,
      ...input,
      status: "draft",
    },
  });

  revalidatePath(`/owners/${idPemilik}`);
  revalidatePath("/vehicles");
  redirect(`/vehicles/${created.idMobil}`);
}
