"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { createOwnerWithVehicles } from "../actions";

export function OwnerForm() {
  const [vehicleCount, setVehicleCount] = useState(1);
  const vehicleRows = Array.from({ length: vehicleCount }, (_, i) => i);

  return (
    <form action={createOwnerWithVehicles} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Data Pemilik</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nama" name="nama" required>
            <Input id="nama" name="nama" required />
          </Field>
          <Field label="Tipe Pemilik" name="tipePemilik" required>
            <Select id="tipePemilik" name="tipePemilik" required defaultValue="individu">
              <option value="individu">Individu</option>
              <option value="perusahaan">Perusahaan</option>
            </Select>
          </Field>
          <Field label="NIK" name="nik" hint="Untuk individu">
            <Input id="nik" name="nik" />
          </Field>
          <Field label="NPWP" name="npwp">
            <Input id="npwp" name="npwp" />
          </Field>
          <Field label="Nama Perusahaan" name="namaPerusahaan" hint="Jika tipe perusahaan" className="md:col-span-2">
            <Input id="namaPerusahaan" name="namaPerusahaan" />
          </Field>
          <Field label="No. HP" name="noHp">
            <Input id="noHp" name="noHp" />
          </Field>
          <Field label="Email" name="email">
            <Input id="email" name="email" type="email" />
          </Field>
          <Field label="Alamat" name="alamat" className="md:col-span-2">
            <Textarea id="alamat" name="alamat" rows={2} />
          </Field>
          <Field label="Kota" name="kota"><Input id="kota" name="kota" /></Field>
          <Field label="Provinsi" name="provinsi"><Input id="provinsi" name="provinsi" /></Field>
          <Field label="Kode Pos" name="kodePos"><Input id="kodePos" name="kodePos" /></Field>
          <Field label="Tanggal Bergabung" name="tanggalBergabung">
            <Input id="tanggalBergabung" name="tanggalBergabung" type="date" />
          </Field>
          <Field label="No. Rekening" name="nomorRekening"><Input id="nomorRekening" name="nomorRekening" /></Field>
          <Field label="Nama Bank" name="namaBank"><Input id="namaBank" name="namaBank" /></Field>
          <Field label="Nama Pemilik Rekening" name="namaPemilikRekening" className="md:col-span-2">
            <Input id="namaPemilikRekening" name="namaPemilikRekening" />
          </Field>
          <Field label="Catatan" name="catatan" className="md:col-span-2">
            <Textarea id="catatan" name="catatan" rows={2} />
          </Field>
        </CardContent>
      </Card>

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
            <Button
              type="button"
              size="sm"
              onClick={() => setVehicleCount((n) => n + 1)}
            >
              + Tambah kendaraan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {vehicleRows.map((i) => (
            <div
              key={i}
              className="rounded-md border p-4 grid gap-3 md:grid-cols-3"
            >
              <div className="md:col-span-3 text-xs font-medium text-muted-foreground">
                Kendaraan #{i + 1}
              </div>
              <Field label="Merk" required>
                <Input name={`vehicle[${i}][merk]`} />
              </Field>
              <Field label="Tipe" required>
                <Input name={`vehicle[${i}][tipe]`} />
              </Field>
              <Field label="Tahun Pembuatan" required>
                <Input
                  name={`vehicle[${i}][tahunPembuatan]`}
                  type="number"
                  min="1950"
                  max="2100"
                />
              </Field>
              <Field label="No. Polisi" required>
                <Input name={`vehicle[${i}][noPolisi]`} />
              </Field>
              <Field label="No. Rangka" required>
                <Input name={`vehicle[${i}][noRangka]`} />
              </Field>
              <Field label="No. Mesin" required>
                <Input name={`vehicle[${i}][noMesin]`} />
              </Field>
              <Field label="Warna">
                <Input name={`vehicle[${i}][warna]`} />
              </Field>
              <Field label="Kapasitas">
                <Input name={`vehicle[${i}][kapasitas]`} type="number" min="1" />
              </Field>
              <Field label="Masa Berlaku Pajak">
                <Input name={`vehicle[${i}][masaBerlakuPajak]`} type="date" />
              </Field>
              <Field label="Harga Sewa Harian (Rp)" className="md:col-span-3">
                <Input
                  name={`vehicle[${i}][hargaSewaHarian]`}
                  type="number"
                  min="0"
                  step="1000"
                />
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

      <div className="flex justify-end gap-2">
        <Button type="submit">Simpan sebagai Draft</Button>
      </div>
    </form>
  );
}
