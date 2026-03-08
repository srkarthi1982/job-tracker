import { JOB_APPLICATION_STATUS, type JobApplicationDTO, type JobApplicationStatus } from "./types";

const toIso = (value?: string | Date | null) => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

export const normalizeText = (value?: string | null) => {
  const next = (value ?? "").trim();
  return next.length ? next : "";
};

export const normalizeOptionalText = (value?: string | null) => {
  const next = normalizeText(value);
  return next.length ? next : null;
};

export const normalizeStatus = (value?: string | null): JobApplicationStatus => {
  const normalized = normalizeText(value) as JobApplicationStatus;
  return JOB_APPLICATION_STATUS.includes(normalized) ? normalized : "wishlist";
};

export const normalizeDateInput = (value?: string | Date | null): string => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const next = normalizeText(value);
  if (!next) return new Date().toISOString().slice(0, 10);

  const parsed = new Date(next);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

export const toDbDate = (value: string) => new Date(`${normalizeDateInput(value)}T00:00:00.000Z`);

export const normalizeJobApplication = (row: any): JobApplicationDTO => ({
  id: String(row.id),
  userId: String(row.userId),
  companyName: String(row.companyName ?? ""),
  roleTitle: String(row.roleTitle ?? ""),
  status: normalizeStatus(row.status),
  appliedDate: normalizeDateInput(row.appliedDate),
  jobUrl: normalizeOptionalText(row.jobUrl),
  location: normalizeOptionalText(row.location),
  notes: normalizeOptionalText(row.notes),
  createdAt: toIso(row.createdAt),
  updatedAt: toIso(row.updatedAt),
});
