# Bromo-app — Explorin.co.id Dashboard

Dashboard dua-portal untuk platform jeep wisata Bromo:

- **SuperAdmin (MKW)** di `www.explorin.co.id` — mengelola merchant, user merchant, KPI platform.
- **Merchant Portal** di `merchant.explorin.co.id` — mendaftarkan pemilik / kendaraan / driver, approval queue, users & roles.

Single Next.js app, subdomain dirutekan oleh `middleware.ts`.

## Tech stack

- **Next.js 15** (App Router, RSC, Server Actions) + **TypeScript**
- **Tailwind CSS** + custom UI primitives (shadcn-style)
- **PostgreSQL** + **Prisma**
- **NextAuth v5** (credentials, JWT session) + RBAC helper
- **Zod** validation pada setiap server action
- **date-fns** + locale `id-ID`, TZ `Asia/Jakarta`

## Struktur

```
app/
  login/                   Halaman login
  admin/                   Rewrite target untuk root host (SuperAdmin)
  merchant/                Rewrite target untuk merchant.<root>
  api/auth/[...nextauth]/  Endpoint NextAuth
components/
  ui/                      Primitives (Card, Button, Input, Table, Badge)
  kpi-card.tsx             Komponen KPI
  sidebar.tsx              Navigasi portal
  status-badge.tsx         Status approval Bahasa Indonesia
lib/
  db.ts                    Singleton Prisma
  rbac.ts                  Role → permission matrix
  approvals.ts             State-machine approval + audit log
  utils.ts                 cn(), formatIDR(), formatDate()
auth.ts                    NextAuth config
middleware.ts              Rewrite subdomain → route group
prisma/
  schema.prisma            Model Merchant, User, Pemilik, Driver, Mobil, ApprovalLog
  seed.ts                  Data demo
```

## Menjalankan lokal

```bash
# 1. Install
npm install

# 2. Setup env
cp .env.example .env
# isi DATABASE_URL dan AUTH_SECRET (openssl rand -base64 32)

# 3. Database
npm run prisma:push      # atau `prisma migrate dev` jika sudah siap
npm run seed

# 4. Dev
npm run dev
```

### Mengakses subdomain di dev

- Root: <http://localhost:3000>
- Merchant: <http://merchant.localhost:3000> (kebanyakan OS resolve `*.localhost` secara otomatis; jika tidak, tambah entri ke `/etc/hosts`)

### Akun demo (setelah `npm run seed`)

| Role         | Email                        | Password      | Host              |
|--------------|------------------------------|---------------|-------------------|
| SUPER_ADMIN  | `superadmin@explorin.co.id`  | `password123` | root              |
| MANAGER      | `manager@explorin.co.id`     | `password123` | merchant.*        |
| ADMIN        | `admin@explorin.co.id`       | `password123` | merchant.*        |

## Pola yang diikuti (best practices)

1. **Approval = state machine**, bukan boolean. Transisi valid didefinisikan di `lib/approvals.ts`. Setiap transisi menulis `ApprovalLog` dalam transaksi yang sama.
2. **Multi-tenancy** lewat `merchantId` di setiap tabel domain + pengecekan eksplisit di server action.
3. **Server-first**: RSC fetch data, Server Actions melakukan mutasi dengan Zod validation.
4. **RBAC terpusat** di `lib/rbac.ts`. UI menyembunyikan aksi yang tidak diizinkan, server `assertCan(...)` mem-verifikasi ulang.
5. **Indonesia-first UI**: label, status, format angka (IDR) & tanggal (`id-ID`, `Asia/Jakarta`).
6. **Soft lifecycle**: `statusAktif`, `tanggalNonaktif`, status approval terpisah. Tidak ada hard delete.

## TODO berikutnya

- Form create/edit Pemilik / Driver / Mobil (Admin input).
- Detail pages + timeline `ApprovalLog` per entity.
- Filter URL-driven (status / kota / tipe) pada list pages.
- Chart trend 30 hari (Recharts) di dashboard.
- Reminder cron untuk SIM/pajak expiring (Inngest atau Vercel Cron).
- Webhook endpoint untuk Dolan (redemption tiket) — nanti.
