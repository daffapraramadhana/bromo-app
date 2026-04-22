import { Prisma } from "@prisma/client";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState =
  | { ok: true }
  | { ok: false; errors: FieldErrors; message?: string };

export const initialState: ActionState = { ok: true };

// Map Prisma DB column names back to camelCase form field names.
// Keep this in sync with @map() directives in prisma/schema.prisma.
const COLUMN_TO_FIELD: Record<string, string> = {
  id_pemilik: "idPemilik",
  no_polisi: "noPolisi",
  no_rangka: "noRangka",
  no_mesin: "noMesin",
  no_sim: "noSim",
};

const FRIENDLY_LABELS: Record<string, string> = {
  nik: "NIK",
  npwp: "NPWP",
  noPolisi: "No. polisi",
  noRangka: "No. rangka",
  noMesin: "No. mesin",
  noSim: "No. SIM",
  email: "Email",
};

export function prismaErrorToFieldErrors(
  err: unknown,
): FieldErrors | null {
  if (
    !(err instanceof Prisma.PrismaClientKnownRequestError) ||
    err.code !== "P2002"
  ) {
    return null;
  }
  // err.meta.target is either string[] (Postgres) or string (SQLite).
  const raw = err.meta?.target;
  const cols = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  const errors: FieldErrors = {};
  for (const col of cols) {
    const field = COLUMN_TO_FIELD[col] ?? col;
    const label = FRIENDLY_LABELS[field] ?? field;
    errors[field] = [`${label} sudah terdaftar untuk merchant ini.`];
  }
  return errors;
}

export function fail(errors: FieldErrors, message?: string): ActionState {
  return { ok: false, errors, message };
}
