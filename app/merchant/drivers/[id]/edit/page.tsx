import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DriverForm } from "../../_form";

export default async function EditDriverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const merchantId = session!.user.merchantId!;
  const { id } = await params;
  const idDriver = Number(id);
  if (!Number.isFinite(idDriver)) notFound();

  const driver = await db.driver.findFirst({ where: { idDriver, merchantId } });
  if (!driver) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/drivers/${idDriver}`} className="text-xs text-muted-foreground hover:underline">
          ← Kembali ke detail
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Edit Driver</h1>
      </div>
      <DriverForm mode="edit" initial={driver} />
    </div>
  );
}
