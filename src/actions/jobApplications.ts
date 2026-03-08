import { randomUUID } from "node:crypto";
import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { asc, db, desc, eq, job_applications } from "astro:db";
import { z } from "astro:schema";
import { requireUser } from "./_guards";
import {
  normalizeDateInput,
  normalizeJobApplication,
  normalizeOptionalText,
  normalizeText,
  toDbDate,
} from "../modules/job-applications/helpers";
import { JOB_APPLICATION_STATUS } from "../modules/job-applications/types";
import { buildJobTrackerSummary } from "../dashboard/summary.schema";
import { pushJobTrackerActivity } from "../lib/pushActivity";

const statusSchema = z.enum(JOB_APPLICATION_STATUS);

const applicationPayloadSchema = z.object({
  companyName: z.string().min(1, "Company is required"),
  roleTitle: z.string().min(1, "Role title is required"),
  status: statusSchema,
  appliedDate: z.string().min(1, "Applied date is required"),
  jobUrl: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const listSchema = z.object({
  limit: z.number().int().min(1).max(250).default(200),
});

const normalizePayload = (input: z.infer<typeof applicationPayloadSchema>) => {
  const companyName = normalizeText(input.companyName);
  const roleTitle = normalizeText(input.roleTitle);

  if (!companyName) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Company is required" });
  }

  if (!roleTitle) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Role title is required" });
  }

  return {
    companyName,
    roleTitle,
    status: input.status,
    appliedDate: normalizeDateInput(input.appliedDate),
    jobUrl: normalizeOptionalText(input.jobUrl),
    location: normalizeOptionalText(input.location),
    notes: normalizeOptionalText(input.notes),
  };
};

const pushSummaryActivity = async (userId: string, event: string, entityId?: string) => {
  const summary = await buildJobTrackerSummary(userId);
  await pushJobTrackerActivity({
    userId,
    activity: {
      event,
      occurredAt: new Date().toISOString(),
      entityId,
    },
    summary,
  });
};

export const fetchMyApplications = defineAction({
  input: listSchema,
  async handler({ limit }, context: ActionAPIContext) {
    const user = requireUser(context);

    const rows = await db
      .select()
      .from(job_applications)
      .where(eq(job_applications.userId, user.id))
      .orderBy(desc(job_applications.updatedAt), asc(job_applications.companyName), desc(job_applications.createdAt))
      .limit(limit);

    return {
      applications: rows.map(normalizeJobApplication),
    };
  },
});

export const createApplication = defineAction({
  input: applicationPayloadSchema,
  async handler(input, context: ActionAPIContext) {
    const user = requireUser(context);
    const payload = normalizePayload(input);
    const now = new Date();

    const inserted = await db
      .insert(job_applications)
      .values({
        id: randomUUID(),
        userId: user.id,
        companyName: payload.companyName,
        roleTitle: payload.roleTitle,
        status: payload.status,
        appliedDate: toDbDate(payload.appliedDate),
        jobUrl: payload.jobUrl,
        location: payload.location,
        notes: payload.notes,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    void pushSummaryActivity(user.id, "jobApplications.created", inserted[0]?.id);

    return {
      application: normalizeJobApplication(inserted[0]),
    };
  },
});

export const updateApplication = defineAction({
  input: z.object({ id: z.string().min(1), data: applicationPayloadSchema }),
  async handler({ id, data }, context: ActionAPIContext) {
    const user = requireUser(context);
    const payload = normalizePayload(data);

    const existing = await db
      .select({ id: job_applications.id, userId: job_applications.userId })
      .from(job_applications)
      .where(eq(job_applications.id, id))
      .limit(1);

    if (!existing[0] || existing[0].userId !== user.id) {
      throw new ActionError({ code: "NOT_FOUND", message: "Application not found" });
    }

    const updated = await db
      .update(job_applications)
      .set({
        companyName: payload.companyName,
        roleTitle: payload.roleTitle,
        status: payload.status,
        appliedDate: toDbDate(payload.appliedDate),
        jobUrl: payload.jobUrl,
        location: payload.location,
        notes: payload.notes,
        updatedAt: new Date(),
      })
      .where(eq(job_applications.id, id))
      .returning();

    void pushSummaryActivity(user.id, "jobApplications.updated", id);

    return {
      application: normalizeJobApplication(updated[0]),
    };
  },
});

export const deleteApplication = defineAction({
  input: z.object({ id: z.string().min(1) }),
  async handler({ id }, context: ActionAPIContext) {
    const user = requireUser(context);

    const existing = await db
      .select({ id: job_applications.id, userId: job_applications.userId })
      .from(job_applications)
      .where(eq(job_applications.id, id))
      .limit(1);

    if (!existing[0] || existing[0].userId !== user.id) {
      throw new ActionError({ code: "NOT_FOUND", message: "Application not found" });
    }

    await db.delete(job_applications).where(eq(job_applications.id, id));

    void pushSummaryActivity(user.id, "jobApplications.deleted", id);

    return { success: true };
  },
});
