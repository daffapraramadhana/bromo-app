import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { createDriver } from "../actions";

export default function NewDriverPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/drivers"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Kembali ke daftar driver
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Driver Baru</h1>
        <p className="text-sm text-muted-foreground">
          Data disimpan sebagai draft dan perlu diajukan ke Manager.
        </p>
      </div>

      <form action={createDriver} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-foreground">Data Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Nama" name="nama" required>
              <Input id="nama" name="nama" required />
            </Field>
            <Field label="NIK" name="nik" required>
              <Input id="nik" name="nik" required />
            </Field>
            <Field label="Tempat Lahir" name="tempatLahir">
              <Input id="tempatLahir" name="tempatLahir" />
            </Field>
            <Field label="Tanggal Lahir" name="tanggalLahir">
              <Input id="tanggalLahir" name="tanggalLahir" type="date" />
            </Field>
            <Field label="Alamat" name="alamat" className="md:col-span-2">
              <Textarea id="alamat" name="alamat" rows={2} />
            </Field>
            <Field label="No. HP" name="noHp"><Input id="noHp" name="noHp" /></Field>
            <Field label="Email" name="email"><Input id="email" name="email" type="email" /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-foreground">SIM & Status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="No. SIM" name="noSim" required>
              <Input id="noSim" name="noSim" required />
            </Field>
            <Field label="Jenis SIM" name="jenisSim" required>
              <Select id="jenisSim" name="jenisSim" required defaultValue="B1">
                <option value="A">A</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C">C</option>
              </Select>
            </Field>
            <Field label="Masa Berlaku SIM" name="masaBerlakuSim" required>
              <Input id="masaBerlakuSim" name="masaBerlakuSim" type="date" required />
            </Field>
            <Field label="Tipe Driver" name="tipeDriver" required>
              <Select id="tipeDriver" name="tipeDriver" required defaultValue="internal">
                <option value="internal">Internal</option>
                <option value="freelance">Freelance</option>
              </Select>
            </Field>
            <Field label="Status Operasional" name="statusDriver" required>
              <Select id="statusDriver" name="statusDriver" required defaultValue="tersedia">
                <option value="tersedia">Tersedia</option>
                <option value="bertugas">Bertugas</option>
                <option value="cuti">Cuti</option>
                <option value="nonaktif">Nonaktif</option>
              </Select>
            </Field>
            <Field label="Tanggal Bergabung" name="tanggalBergabung">
              <Input id="tanggalBergabung" name="tanggalBergabung" type="date" />
            </Field>
            <Field label="Tarif Harian (Rp)" name="tarifHarian">
              <Input id="tarifHarian" name="tarifHarian" type="number" min="0" step="1000" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-foreground">Kontak Darurat & Catatan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Nama Kontak Darurat" name="namaKontakDarurat">
              <Input id="namaKontakDarurat" name="namaKontakDarurat" />
            </Field>
            <Field label="No. HP Darurat" name="noHpDarurat">
              <Input id="noHpDarurat" name="noHpDarurat" />
            </Field>
            <Field label="Catatan" name="catatan" className="md:col-span-2">
              <Textarea id="catatan" name="catatan" rows={2} />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Simpan sebagai Draft</Button>
        </div>
      </form>
    </div>
  );
}
