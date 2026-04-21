import { addDays, subDays, subYears } from "date-fns";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding…");

  // Clean (dev only)
  await db.approvalLog.deleteMany();
  await db.mobil.deleteMany();
  await db.driver.deleteMany();
  await db.pemilik.deleteMany();
  await db.user.deleteMany();
  await db.merchant.deleteMany();

  const password = await bcrypt.hash("password123", 10);

  // SuperAdmin (MKW) — no merchantId.
  const superAdmin = await db.user.create({
    data: {
      email: "superadmin@explorin.co.id",
      name: "MKW SuperAdmin",
      passwordHash: password,
      role: "SUPER_ADMIN",
    },
  });

  const merchant = await db.merchant.create({
    data: {
      name: "Jeep Bromo Wijaya",
      slug: "jeep-bromo-wijaya",
      status: "approved",
    },
  });

  const [manager, admin] = await Promise.all([
    db.user.create({
      data: {
        email: "manager@explorin.co.id",
        name: "Budi Manager",
        passwordHash: password,
        role: "MANAGER",
        merchantId: merchant.id,
      },
    }),
    db.user.create({
      data: {
        email: "admin@explorin.co.id",
        name: "Siti Admin",
        passwordHash: password,
        role: "ADMIN",
        merchantId: merchant.id,
      },
    }),
  ]);

  // Pemilik
  const pakJoko = await db.pemilik.create({
    data: {
      merchantId: merchant.id,
      nama: "Pak Joko Santoso",
      tipePemilik: "individu",
      nik: "3502012501800001",
      noHp: "081234567890",
      email: "joko@example.com",
      kota: "Probolinggo",
      provinsi: "Jawa Timur",
      tanggalBergabung: subYears(new Date(), 2),
      status: "approved",
    },
  });

  const cvTrans = await db.pemilik.create({
    data: {
      merchantId: merchant.id,
      nama: "CV Trans Bromo",
      tipePemilik: "perusahaan",
      npwp: "01.234.567.8-901.000",
      namaPerusahaan: "CV Trans Bromo",
      noHp: "081298765432",
      kota: "Malang",
      provinsi: "Jawa Timur",
      tanggalBergabung: subYears(new Date(), 1),
      status: "pending_approval",
    },
  });

  // Driver
  await db.driver.createMany({
    data: [
      {
        merchantId: merchant.id,
        nama: "Agus Pratama",
        nik: "3502011205900001",
        noSim: "B1234567",
        jenisSim: "B1",
        masaBerlakuSim: addDays(new Date(), 180),
        tipeDriver: "internal",
        statusDriver: "tersedia",
        tarifHarian: 250000,
        status: "approved",
      },
      {
        merchantId: merchant.id,
        nama: "Dwi Cahyo",
        nik: "3502011511880002",
        noSim: "B7654321",
        jenisSim: "B1",
        masaBerlakuSim: addDays(new Date(), 20), // expiring soon
        tipeDriver: "freelance",
        statusDriver: "bertugas",
        tarifHarian: 200000,
        status: "approved",
      },
      {
        merchantId: merchant.id,
        nama: "Eko Prasetyo",
        nik: "3502010101950003",
        noSim: "B1122334",
        jenisSim: "B2",
        masaBerlakuSim: addDays(new Date(), 400),
        tipeDriver: "internal",
        statusDriver: "tersedia",
        tarifHarian: 275000,
        status: "pending_approval",
      },
    ],
  });

  // Mobil
  await db.mobil.create({
    data: {
      merchantId: merchant.id,
      idPemilik: pakJoko.idPemilik,
      merk: "Toyota",
      tipe: "Hardtop FJ40",
      tahunPembuatan: 1982,
      noPolisi: "N 1234 AB",
      noRangka: "FJ40-123456",
      noMesin: "2F-789012",
      warna: "Hijau Army",
      kapasitas: 6,
      masaBerlakuPajak: addDays(new Date(), 15), // expiring soon
      hargaSewaHarian: 850000,
      statusMobil: "tersedia",
      status: "approved",
    },
  });

  await db.mobil.create({
    data: {
      merchantId: merchant.id,
      idPemilik: pakJoko.idPemilik,
      merk: "Toyota",
      tipe: "Hardtop BJ40",
      tahunPembuatan: 1985,
      noPolisi: "N 5678 CD",
      noRangka: "BJ40-654321",
      noMesin: "3B-210987",
      warna: "Merah",
      kapasitas: 6,
      masaBerlakuPajak: addDays(new Date(), 200),
      hargaSewaHarian: 900000,
      statusMobil: "disewa",
      status: "approved",
    },
  });

  await db.mobil.create({
    data: {
      merchantId: merchant.id,
      idPemilik: cvTrans.idPemilik,
      merk: "Mitsubishi",
      tipe: "Jeep Willys",
      tahunPembuatan: 1978,
      noPolisi: "N 9012 EF",
      noRangka: "JW-112233",
      noMesin: "MB-998877",
      warna: "Kuning",
      kapasitas: 5,
      masaBerlakuPajak: addDays(new Date(), 60),
      hargaSewaHarian: 800000,
      statusMobil: "tersedia",
      status: "pending_approval",
    },
  });

  // Seed one approval-log entry so the dashboard activity feed isn't empty.
  await db.approvalLog.create({
    data: {
      merchantId: merchant.id,
      approvableType: "pemilik",
      approvableId: String(pakJoko.idPemilik),
      action: "approved",
      fromStatus: "pending_approval",
      toStatus: "approved",
      actorId: manager.id,
      note: "Dokumen lengkap.",
      createdAt: subDays(new Date(), 2),
    },
  });

  console.log("Seed OK.");
  console.log("Login dengan salah satu:");
  console.log("  superadmin@explorin.co.id / password123  (root host)");
  console.log("  manager@explorin.co.id    / password123  (merchant host)");
  console.log("  admin@explorin.co.id      / password123  (merchant host)");
  // Silence unused-var warning
  void admin;
  void superAdmin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
