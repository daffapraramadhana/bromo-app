import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { createVehicle } from "../actions";

export default async function NewVehiclePage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) {
  const session = await auth();
  const merchantId = session!.user.merchantId!;
  const { owner: preselected } = await searchParams;

  const owners = await db.pemilik.findMany({
    where: { merchantId },
    orderBy: { nama: "asc" },
    select: { idPemilik: true, nama: true, tipePemilik: true },
  });

  if (owners.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Kendaraan Baru</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Belum ada pemilik terdaftar. Buat pemilik terlebih dahulu agar dapat
            menambahkan kendaraan.
            <div className="mt-3">
              <Link href="/owners/new">
                <Button size="sm">+ Buat Pemilik</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/vehicles" className="text-xs text-muted-foreground hover:underline">
          ← Kembali ke daftar kendaraan
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Kendaraan Baru</h1>
      </div>
      <form action={createVehicle} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-foreground">Data Kendaraan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Pemilik" name="idPemilik" required className="md:col-span-2">
              <Select
                id="idPemilik"
                name="idPemilik"
                required
                defaultValue={preselected ?? ""}
              >
                <option value="" disabled>Pilih pemilik</option>
                {owners.map((o) => (
                  <option key={o.idPemilik} value={o.idPemilik}>
                    {o.nama} ({o.tipePemilik})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Merk" name="merk" required><Input id="merk" name="merk" required /></Field>
            <Field label="Tipe" name="tipe" required><Input id="tipe" name="tipe" required /></Field>
            <Field label="Tahun Pembuatan" name="tahunPembuatan" required>
              <Input id="tahunPembuatan" name="tahunPembuatan" type="number" min="1950" max="2100" required />
            </Field>
            <Field label="Tahun Kendaraan" name="tahunKendaraan" hint="STNK">
              <Input id="tahunKendaraan" name="tahunKendaraan" type="number" min="1950" max="2100" />
            </Field>
            <Field label="No. Polisi" name="noPolisi" required>
              <Input id="noPolisi" name="noPolisi" required />
            </Field>
            <Field label="No. Rangka" name="noRangka" required>
              <Input id="noRangka" name="noRangka" required />
            </Field>
            <Field label="No. Mesin" name="noMesin" required>
              <Input id="noMesin" name="noMesin" required />
            </Field>
            <Field label="Warna" name="warna"><Input id="warna" name="warna" /></Field>
            <Field label="Kapasitas" name="kapasitas">
              <Input id="kapasitas" name="kapasitas" type="number" min="1" />
            </Field>
            <Field label="Masa Berlaku Pajak" name="masaBerlakuPajak">
              <Input id="masaBerlakuPajak" name="masaBerlakuPajak" type="date" />
            </Field>
            <Field label="Harga Sewa Harian (Rp)" name="hargaSewaHarian" className="md:col-span-2">
              <Input id="hargaSewaHarian" name="hargaSewaHarian" type="number" min="0" step="1000" />
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
