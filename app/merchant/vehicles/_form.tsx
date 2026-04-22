"use client";

import { useActionState } from "react";
import type { Mobil } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/field";
import { initialState, type ActionState } from "@/lib/form-state";
import { formatISODate } from "../owners/_form.utils";
import { createVehicle, updateVehicle } from "./actions";

type Owner = { idPemilik: number; nama: string; tipePemilik: string };

export function VehicleForm({
  mode,
  owners,
  preselectedOwner,
  initial,
}: {
  mode: "create";
  owners: Owner[];
  preselectedOwner?: number;
  initial?: undefined;
} | {
  mode: "edit";
  owners?: undefined;
  preselectedOwner?: undefined;
  initial: Mobil & { pemilik: { nama: string } };
}) {
  const action = mode === "create" ? createVehicle : updateVehicle;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    initialState,
  );
  const errors = !state.ok ? state.errors : {};
  const err = (k: string) => errors[k] as string[] | undefined;

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && (
        <input type="hidden" name="idMobil" value={initial.idMobil} />
      )}

      <FormError state={state} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">Data Kendaraan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {mode === "create" ? (
            <Field label="Pemilik" name="idPemilik" required className="md:col-span-2" error={err("idPemilik")}>
              <Select
                id="idPemilik"
                name="idPemilik"
                required
                defaultValue={preselectedOwner ?? ""}
              >
                <option value="" disabled>Pilih pemilik</option>
                {owners.map((o) => (
                  <option key={o.idPemilik} value={o.idPemilik}>
                    {o.nama} ({o.tipePemilik})
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Pemilik" className="md:col-span-2" hint="Tidak dapat diubah.">
              <Input value={initial.pemilik.nama} disabled />
            </Field>
          )}

          <Field label="Merk" name="merk" required error={err("merk")}>
            <Input id="merk" name="merk" required defaultValue={initial?.merk ?? ""} />
          </Field>
          <Field label="Tipe" name="tipe" required error={err("tipe")}>
            <Input id="tipe" name="tipe" required defaultValue={initial?.tipe ?? ""} />
          </Field>
          <Field label="Tahun Pembuatan" name="tahunPembuatan" required error={err("tahunPembuatan")}>
            <Input id="tahunPembuatan" name="tahunPembuatan" type="number" min="1950" max="2100" required defaultValue={initial?.tahunPembuatan ?? ""} />
          </Field>
          <Field label="Tahun Kendaraan" name="tahunKendaraan" hint="STNK" error={err("tahunKendaraan")}>
            <Input id="tahunKendaraan" name="tahunKendaraan" type="number" min="1950" max="2100" defaultValue={initial?.tahunKendaraan ?? ""} />
          </Field>
          <Field label="No. Polisi" name="noPolisi" required error={err("noPolisi")}>
            <Input id="noPolisi" name="noPolisi" required defaultValue={initial?.noPolisi ?? ""} />
          </Field>
          <Field label="No. Rangka" name="noRangka" required error={err("noRangka")}>
            <Input id="noRangka" name="noRangka" required defaultValue={initial?.noRangka ?? ""} />
          </Field>
          <Field label="No. Mesin" name="noMesin" required error={err("noMesin")}>
            <Input id="noMesin" name="noMesin" required defaultValue={initial?.noMesin ?? ""} />
          </Field>
          <Field label="Warna" name="warna" error={err("warna")}>
            <Input id="warna" name="warna" defaultValue={initial?.warna ?? ""} />
          </Field>
          <Field label="Kapasitas" name="kapasitas" error={err("kapasitas")}>
            <Input id="kapasitas" name="kapasitas" type="number" min="1" defaultValue={initial?.kapasitas ?? ""} />
          </Field>
          <Field label="Masa Berlaku Pajak" name="masaBerlakuPajak" error={err("masaBerlakuPajak")}>
            <Input id="masaBerlakuPajak" name="masaBerlakuPajak" type="date" defaultValue={formatISODate(initial?.masaBerlakuPajak)} />
          </Field>
          <Field label="Harga Sewa Harian (Rp)" name="hargaSewaHarian" className={mode === "edit" ? "" : "md:col-span-2"} error={err("hargaSewaHarian")}>
            <Input id="hargaSewaHarian" name="hargaSewaHarian" type="number" min="0" step="1000" defaultValue={initial?.hargaSewaHarian ? String(initial.hargaSewaHarian) : ""} />
          </Field>

          {mode === "edit" && (
            <Field label="Status Operasional" name="statusMobil" required error={err("statusMobil")}>
              <Select id="statusMobil" name="statusMobil" required defaultValue={initial.statusMobil}>
                <option value="tersedia">Tersedia</option>
                <option value="disewa">Disewa</option>
                <option value="maintenance">Maintenance</option>
              </Select>
            </Field>
          )}
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
