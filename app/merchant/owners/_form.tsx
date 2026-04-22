"use client";

import { useActionState, useState } from "react";
import type { Pemilik } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/field";
import { initialState, type ActionState } from "@/lib/form-state";
import { createOwner, updateOwner } from "./actions";
import { formatISODate } from "./_form.utils";

type Mode = "create" | "edit";

export function OwnerForm({
  mode,
  initial,
}: {
  mode: Mode;
  initial?: Pemilik;
}) {
  const action = mode === "create" ? createOwner : updateOwner;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    initialState,
  );
  const [vehicleCount, setVehicleCount] = useState(mode === "create" ? 1 : 0);
  const errors = !state.ok ? state.errors : {};
  const err = (k: string) => errors[k] as string[] | undefined;

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && initial && (
        <input type="hidden" name="idPemilik" value={initial.idPemilik} />
      )}

      <FormError state={state} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Data Pemilik</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nama" name="nama" required error={err("nama")}>
            <Input id="nama" name="nama" required defaultValue={initial?.nama} />
          </Field>
          <Field label="Tipe Pemilik" name="tipePemilik" required error={err("tipePemilik")}>
            <Select id="tipePemilik" name="tipePemilik" required defaultValue={initial?.tipePemilik ?? "individu"}>
              <option value="individu">Individu</option>
              <option value="perusahaan">Perusahaan</option>
            </Select>
          </Field>
          <Field label="NIK" name="nik" hint="Untuk individu" error={err("nik")}>
            <Input id="nik" name="nik" defaultValue={initial?.nik ?? ""} />
          </Field>
          <Field label="NPWP" name="npwp" error={err("npwp")}>
            <Input id="npwp" name="npwp" defaultValue={initial?.npwp ?? ""} />
          </Field>
          <Field label="Nama Perusahaan" name="namaPerusahaan" hint="Jika tipe perusahaan" className="md:col-span-2" error={err("namaPerusahaan")}>
            <Input id="namaPerusahaan" name="namaPerusahaan" defaultValue={initial?.namaPerusahaan ?? ""} />
          </Field>
          <Field label="No. HP" name="noHp" error={err("noHp")}>
            <Input id="noHp" name="noHp" defaultValue={initial?.noHp ?? ""} />
          </Field>
          <Field label="Email" name="email" error={err("email")}>
            <Input id="email" name="email" type="email" defaultValue={initial?.email ?? ""} />
          </Field>
          <Field label="Alamat" name="alamat" className="md:col-span-2" error={err("alamat")}>
            <Textarea id="alamat" name="alamat" rows={2} defaultValue={initial?.alamat ?? ""} />
          </Field>
          <Field label="Kota" name="kota" error={err("kota")}><Input id="kota" name="kota" defaultValue={initial?.kota ?? ""} /></Field>
          <Field label="Provinsi" name="provinsi" error={err("provinsi")}><Input id="provinsi" name="provinsi" defaultValue={initial?.provinsi ?? ""} /></Field>
          <Field label="Kode Pos" name="kodePos" error={err("kodePos")}><Input id="kodePos" name="kodePos" defaultValue={initial?.kodePos ?? ""} /></Field>
          <Field label="Tanggal Bergabung" name="tanggalBergabung" error={err("tanggalBergabung")}>
            <Input id="tanggalBergabung" name="tanggalBergabung" type="date" defaultValue={formatISODate(initial?.tanggalBergabung)} />
          </Field>
          <Field label="No. Rekening" name="nomorRekening" error={err("nomorRekening")}>
            <Input id="nomorRekening" name="nomorRekening" defaultValue={initial?.nomorRekening ?? ""} />
          </Field>
          <Field label="Nama Bank" name="namaBank" error={err("namaBank")}>
            <Input id="namaBank" name="namaBank" defaultValue={initial?.namaBank ?? ""} />
          </Field>
          <Field label="Nama Pemilik Rekening" name="namaPemilikRekening" className="md:col-span-2" error={err("namaPemilikRekening")}>
            <Input id="namaPemilikRekening" name="namaPemilikRekening" defaultValue={initial?.namaPemilikRekening ?? ""} />
          </Field>
          <Field label="Catatan" name="catatan" className="md:col-span-2" error={err("catatan")}>
            <Textarea id="catatan" name="catatan" rows={2} defaultValue={initial?.catatan ?? ""} />
          </Field>
        </CardContent>
      </Card>

      {mode === "create" && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base text-foreground">
              Kendaraan Pemilik ({vehicleCount})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVehicleCount((n) => Math.max(0, n - 1))}
                disabled={vehicleCount === 0}
              >
                − Hapus baris
              </Button>
              <Button type="button" size="sm" onClick={() => setVehicleCount((n) => n + 1)}>
                + Tambah kendaraan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: vehicleCount }, (_, i) => (
              <div key={i} className="rounded-md border p-4 grid gap-3 md:grid-cols-3">
                <div className="md:col-span-3 text-xs font-medium text-muted-foreground">
                  Kendaraan #{i + 1}
                </div>
                <Field label="Merk" required error={err(`vehicle[${i}][merk]`)}>
                  <Input name={`vehicle[${i}][merk]`} />
                </Field>
                <Field label="Tipe" required error={err(`vehicle[${i}][tipe]`)}>
                  <Input name={`vehicle[${i}][tipe]`} />
                </Field>
                <Field label="Tahun Pembuatan" required error={err(`vehicle[${i}][tahunPembuatan]`)}>
                  <Input name={`vehicle[${i}][tahunPembuatan]`} type="number" min="1950" max="2100" />
                </Field>
                <Field label="No. Polisi" required error={err(`vehicle[${i}][noPolisi]`)}>
                  <Input name={`vehicle[${i}][noPolisi]`} />
                </Field>
                <Field label="No. Rangka" required error={err(`vehicle[${i}][noRangka]`)}>
                  <Input name={`vehicle[${i}][noRangka]`} />
                </Field>
                <Field label="No. Mesin" required error={err(`vehicle[${i}][noMesin]`)}>
                  <Input name={`vehicle[${i}][noMesin]`} />
                </Field>
                <Field label="Warna" error={err(`vehicle[${i}][warna]`)}>
                  <Input name={`vehicle[${i}][warna]`} />
                </Field>
                <Field label="Kapasitas" error={err(`vehicle[${i}][kapasitas]`)}>
                  <Input name={`vehicle[${i}][kapasitas]`} type="number" min="1" />
                </Field>
                <Field label="Masa Berlaku Pajak" error={err(`vehicle[${i}][masaBerlakuPajak]`)}>
                  <Input name={`vehicle[${i}][masaBerlakuPajak]`} type="date" />
                </Field>
                <Field label="Harga Sewa Harian (Rp)" className="md:col-span-3" error={err(`vehicle[${i}][hargaSewaHarian]`)}>
                  <Input name={`vehicle[${i}][hargaSewaHarian]`} type="number" min="0" step="1000" />
                </Field>
              </div>
            ))}
            {vehicleCount === 0 && (
              <p className="text-sm text-muted-foreground">
                Tidak ada kendaraan ditambahkan. Anda dapat menambahkannya nanti
                dari halaman detail pemilik.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
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
