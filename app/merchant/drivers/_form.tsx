"use client";

import { useActionState } from "react";
import type { Driver } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/field";
import { initialState, type ActionState } from "@/lib/form-state";
import { formatISODate } from "../owners/_form.utils";
import { createDriver, updateDriver } from "./actions";

type Mode = "create" | "edit";

export function DriverForm({
  mode,
  initial,
}: {
  mode: Mode;
  initial?: Driver;
}) {
  const action = mode === "create" ? createDriver : updateDriver;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    initialState,
  );
  const errors = !state.ok ? state.errors : {};
  const err = (k: string) => errors[k] as string[] | undefined;

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && initial && (
        <input type="hidden" name="idDriver" value={initial.idDriver} />
      )}

      <FormError state={state} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Data Pribadi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nama" name="nama" required error={err("nama")}>
            <Input id="nama" name="nama" required defaultValue={initial?.nama} />
          </Field>
          <Field label="NIK" name="nik" required error={err("nik")}>
            <Input id="nik" name="nik" required defaultValue={initial?.nik} />
          </Field>
          <Field label="Tempat Lahir" name="tempatLahir" error={err("tempatLahir")}>
            <Input id="tempatLahir" name="tempatLahir" defaultValue={initial?.tempatLahir ?? ""} />
          </Field>
          <Field label="Tanggal Lahir" name="tanggalLahir" error={err("tanggalLahir")}>
            <Input id="tanggalLahir" name="tanggalLahir" type="date" defaultValue={formatISODate(initial?.tanggalLahir)} />
          </Field>
          <Field label="Alamat" name="alamat" className="md:col-span-2" error={err("alamat")}>
            <Textarea id="alamat" name="alamat" rows={2} defaultValue={initial?.alamat ?? ""} />
          </Field>
          <Field label="No. HP" name="noHp" error={err("noHp")}>
            <Input id="noHp" name="noHp" defaultValue={initial?.noHp ?? ""} />
          </Field>
          <Field label="Email" name="email" error={err("email")}>
            <Input id="email" name="email" type="email" defaultValue={initial?.email ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">SIM & Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="No. SIM" name="noSim" required error={err("noSim")}>
            <Input id="noSim" name="noSim" required defaultValue={initial?.noSim} />
          </Field>
          <Field label="Jenis SIM" name="jenisSim" required error={err("jenisSim")}>
            <Select id="jenisSim" name="jenisSim" required defaultValue={initial?.jenisSim ?? "B1"}>
              <option value="A">A</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C">C</option>
            </Select>
          </Field>
          <Field label="Masa Berlaku SIM" name="masaBerlakuSim" required error={err("masaBerlakuSim")}>
            <Input id="masaBerlakuSim" name="masaBerlakuSim" type="date" required defaultValue={formatISODate(initial?.masaBerlakuSim)} />
          </Field>
          <Field label="Tipe Driver" name="tipeDriver" required error={err("tipeDriver")}>
            <Select id="tipeDriver" name="tipeDriver" required defaultValue={initial?.tipeDriver ?? "internal"}>
              <option value="internal">Internal</option>
              <option value="freelance">Freelance</option>
            </Select>
          </Field>
          <Field label="Status Operasional" name="statusDriver" required error={err("statusDriver")}>
            <Select id="statusDriver" name="statusDriver" required defaultValue={initial?.statusDriver ?? "tersedia"}>
              <option value="tersedia">Tersedia</option>
              <option value="bertugas">Bertugas</option>
              <option value="cuti">Cuti</option>
              <option value="nonaktif">Nonaktif</option>
            </Select>
          </Field>
          <Field label="Tanggal Bergabung" name="tanggalBergabung" error={err("tanggalBergabung")}>
            <Input id="tanggalBergabung" name="tanggalBergabung" type="date" defaultValue={formatISODate(initial?.tanggalBergabung)} />
          </Field>
          <Field label="Tarif Harian (Rp)" name="tarifHarian" error={err("tarifHarian")}>
            <Input id="tarifHarian" name="tarifHarian" type="number" min="0" step="1000" defaultValue={initial?.tarifHarian ? String(initial.tarifHarian) : ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Kontak Darurat & Catatan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nama Kontak Darurat" name="namaKontakDarurat" error={err("namaKontakDarurat")}>
            <Input id="namaKontakDarurat" name="namaKontakDarurat" defaultValue={initial?.namaKontakDarurat ?? ""} />
          </Field>
          <Field label="No. HP Darurat" name="noHpDarurat" error={err("noHpDarurat")}>
            <Input id="noHpDarurat" name="noHpDarurat" defaultValue={initial?.noHpDarurat ?? ""} />
          </Field>
          <Field label="Catatan" name="catatan" className="md:col-span-2" error={err("catatan")}>
            <Textarea id="catatan" name="catatan" rows={2} defaultValue={initial?.catatan ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Menyimpan…"
            : mode === "create"
              ? "Simpan sebagai Draft"
              : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
