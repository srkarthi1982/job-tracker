import { randomUUID } from "node:crypto";
import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { and, asc, db, desc, eq, inArray, job_application_events, job_applications } from "astro:db";
import { z } from "astro:schema";
import { requireUser } from "./_guards";
import {
  normalizeDateInput,
  normalizeJobApplication,
  normalizeJobApplicationEvent,
  normalizeOptionalDateInput,
  normalizeOptionalText,
  normalizeText,
  toDbDate,
  toOptionalDbDate,
} from "../modules/job-applications/helpers";
import {
  buildApplicationAiResult,
  getAiGuardrailMessage,
} from "../modules/job-applications/aiAssistant";
import {
  buildMatchIntelligenceResult,
  getMatchIntelligenceGuardrailMessage,
} from "../modules/job-applications/matchIntelligence";
import {
  JOB_APPLICATION_AI_ACTIONS,
  JOB_APPLICATION_EVENT_TYPE,
  JOB_APPLICATION_STATUS,
  type JobApplicationAiAction,
  type JobApplicationStatus,
} from "../modules/job-applications/types";
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
  nextActionDate: z.string().optional(),
  nextActionLabel: z.string().optional(),
  lastContactDate: z.string().optional(),
  interviewDate: z.string().optional(),
  jobDescription: z.string().optional(),
  resumeSnapshotText: z.string().optional(),
  resumeLabel: z.string().optional(),
  notes: z.string().optional(),
});

const listSchema = z.object({
  limit: z.number().int().min(1).max(250).default(200),
});

const aiAssistSchema = z.object({
  applicationId: z.string().min(1),
  action: z.enum(JOB_APPLICATION_AI_ACTIONS),
});

const matchIntelligenceSchema = z.object({
  applicationId: z.string().min(1),
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
    nextActionDate: normalizeOptionalDateInput(input.nextActionDate),
    nextActionLabel: normalizeOptionalText(input.nextActionLabel),
    lastContactDate: normalizeOptionalDateInput(input.lastContactDate),
    interviewDate: normalizeOptionalDateInput(input.interviewDate),
    jobDescription: normalizeOptionalText(input.jobDescription),
    resumeSnapshotText: normalizeOptionalText(input.resumeSnapshotText),
    resumeLabel: normalizeOptionalText(input.resumeLabel),
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

const findOwnedApplication = async (userId: string, applicationId: string) => {
  const rows = await db
    .select()
    .from(job_applications)
    .where(and(eq(job_applications.id, applicationId), eq(job_applications.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
};

const requireOwnedApplication = async (userId: string, applicationId: string) => {
  const application = await findOwnedApplication(userId, applicationId);
  if (!application) {
    throw new ActionError({ code: "NOT_FOUND", message: "Application not found" });
  }
  return application;
};

const logEvent = async (input: {
  applicationId: string;
  userId: string;
  eventType: (typeof JOB_APPLICATION_EVENT_TYPE)[number];
  eventLabel: string;
  eventDate: string;
  notes?: string | null;
}) => {
  const application = await findOwnedApplication(input.userId, input.applicationId);
  if (!application) {
    throw new ActionError({ code: "NOT_FOUND", message: "Application not found" });
  }

  await db.insert(job_application_events).values({
    id: randomUUID(),
    applicationId: application.id,
    userId: application.userId,
    eventType: input.eventType,
    eventLabel: input.eventLabel,
    eventDate: toDbDate(input.eventDate),
    notes: normalizeOptionalText(input.notes),
    createdAt: new Date(),
  });
};

type ApplicationRowWithEvents = {
  id: string;
  events?: unknown[];
  [key: string]: unknown;
};

const withEvents = async (userId: string, rows: ApplicationRowWithEvents[]) => {
  if (!rows.length) return rows.map((row) => ({ ...row, events: [] }));
  const applicationIds = rows.map((row) => row.id);

  const eventRows = await db
    .select()
    .from(job_application_events)
    .where(and(
      eq(job_application_events.userId, userId),
      inArray(job_application_events.applicationId, applicationIds),
    ))
    .orderBy(desc(job_application_events.eventDate), desc(job_application_events.createdAt));

  const eventsByApplication = new Map<string, ReturnType<typeof normalizeJobApplicationEvent>[]>();
  for (const eventRow of eventRows) {
    const normalized = normalizeJobApplicationEvent(eventRow);
    const existing = eventsByApplication.get(normalized.applicationId) ?? [];
    existing.push(normalized);
    eventsByApplication.set(normalized.applicationId, existing);
  }

  return rows.map((row) => ({
    ...row,
    events: eventsByApplication.get(String(row.id)) ?? [],
  }));
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

    const rowsWithEvents = await withEvents(user.id, rows);

    return {
      applications: rowsWithEvents.map(normalizeJobApplication),
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
        nextActionDate: toOptionalDbDate(payload.nextActionDate),
        nextActionLabel: payload.nextActionLabel,
        lastContactDate: toOptionalDbDate(payload.lastContactDate),
        interviewDate: toOptionalDbDate(payload.interviewDate),
        jobDescription: payload.jobDescription,
        resumeSnapshotText: payload.resumeSnapshotText,
        resumeLabel: payload.resumeLabel,
        notes: payload.notes,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const application = inserted[0];
    if (application) {
      await logEvent({
        applicationId: application.id,
        userId: user.id,
        eventType: "created",
        eventLabel: `Application created for ${payload.roleTitle} at ${payload.companyName}`,
        eventDate: payload.appliedDate,
      });

      if (payload.interviewDate) {
        await logEvent({
          applicationId: application.id,
          userId: user.id,
          eventType: "interviewScheduled",
          eventLabel: "Interview scheduled",
          eventDate: payload.interviewDate,
        });
      }

      if (payload.nextActionDate && payload.nextActionLabel) {
        await logEvent({
          applicationId: application.id,
          userId: user.id,
          eventType: "followUpPlanned",
          eventLabel: `Next action planned: ${payload.nextActionLabel}`,
          eventDate: payload.nextActionDate,
        });
      }

      if (payload.lastContactDate) {
        await logEvent({
          applicationId: application.id,
          userId: user.id,
          eventType: "contactLogged",
          eventLabel: "Last contact logged",
          eventDate: payload.lastContactDate,
        });
      }
    }

    void pushSummaryActivity(user.id, "jobApplications.created", application?.id);

    const withEventRows = await withEvents(user.id, inserted);
    return {
      application: normalizeJobApplication(withEventRows[0]),
    };
  },
});

export const updateApplication = defineAction({
  input: z.object({ id: z.string().min(1), data: applicationPayloadSchema }),
  async handler({ id, data }, context: ActionAPIContext) {
    const user = requireUser(context);
    const payload = normalizePayload(data);

    const existing = await requireOwnedApplication(user.id, id);
    const previous = normalizeJobApplication(existing);

    const updated = await db
      .update(job_applications)
      .set({
        companyName: payload.companyName,
        roleTitle: payload.roleTitle,
        status: payload.status,
        appliedDate: toDbDate(payload.appliedDate),
        jobUrl: payload.jobUrl,
        location: payload.location,
        nextActionDate: toOptionalDbDate(payload.nextActionDate),
        nextActionLabel: payload.nextActionLabel,
        lastContactDate: toOptionalDbDate(payload.lastContactDate),
        interviewDate: toOptionalDbDate(payload.interviewDate),
        jobDescription: payload.jobDescription,
        resumeSnapshotText: payload.resumeSnapshotText,
        resumeLabel: payload.resumeLabel,
        notes: payload.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(job_applications.id, id), eq(job_applications.userId, user.id)))
      .returning();

    const nextStatus = payload.status as JobApplicationStatus;
    if (previous.status !== nextStatus) {
      await logEvent({
        applicationId: id,
        userId: user.id,
        eventType: "statusChanged",
        eventLabel: `Status changed: ${previous.status} → ${nextStatus}`,
        eventDate: new Date().toISOString().slice(0, 10),
      });
    }

    if (previous.interviewDate !== payload.interviewDate && payload.interviewDate) {
      await logEvent({
        applicationId: id,
        userId: user.id,
        eventType: "interviewScheduled",
        eventLabel: "Interview date updated",
        eventDate: payload.interviewDate,
      });
    }

    if (
      (previous.nextActionDate !== payload.nextActionDate || previous.nextActionLabel !== payload.nextActionLabel)
      && payload.nextActionDate
      && payload.nextActionLabel
    ) {
      await logEvent({
        applicationId: id,
        userId: user.id,
        eventType: "followUpPlanned",
        eventLabel: `Next action planned: ${payload.nextActionLabel}`,
        eventDate: payload.nextActionDate,
      });
    }

    if (previous.lastContactDate !== payload.lastContactDate && payload.lastContactDate) {
      await logEvent({
        applicationId: id,
        userId: user.id,
        eventType: "contactLogged",
        eventLabel: "Contact logged",
        eventDate: payload.lastContactDate,
      });
    }

    if (previous.notes !== payload.notes && payload.notes) {
      await logEvent({
        applicationId: id,
        userId: user.id,
        eventType: "noteAdded",
        eventLabel: "Notes updated",
        eventDate: new Date().toISOString().slice(0, 10),
      });
    }

    void pushSummaryActivity(user.id, "jobApplications.updated", id);

    const withEventRows = await withEvents(user.id, updated);
    return {
      application: normalizeJobApplication(withEventRows[0]),
    };
  },
});

export const deleteApplication = defineAction({
  input: z.object({ id: z.string().min(1) }),
  async handler({ id }, context: ActionAPIContext) {
    const user = requireUser(context);

    await requireOwnedApplication(user.id, id);

    await db.delete(job_application_events).where(and(
      eq(job_application_events.applicationId, id),
      eq(job_application_events.userId, user.id),
    ));
    await db.delete(job_applications).where(and(eq(job_applications.id, id), eq(job_applications.userId, user.id)));

    void pushSummaryActivity(user.id, "jobApplications.deleted", id);

    return { success: true };
  },
});

export const generateApplicationAiAssist = defineAction({
  input: aiAssistSchema,
  async handler({ applicationId, action }, context: ActionAPIContext) {
    const user = requireUser(context);

    const applicationRow = await requireOwnedApplication(user.id, applicationId);
    const rowsWithEvents = await withEvents(user.id, [applicationRow]);
    const application = normalizeJobApplication(rowsWithEvents[0]);
    const preset = action as JobApplicationAiAction;

    const guardrailMessage = getAiGuardrailMessage(preset, application);
    if (guardrailMessage) {
      throw new ActionError({ code: "BAD_REQUEST", message: guardrailMessage });
    }

    return {
      result: buildApplicationAiResult(preset, application),
    };
  },
});


export const generateApplicationMatchIntelligence = defineAction({
  input: matchIntelligenceSchema,
  async handler({ applicationId }, context: ActionAPIContext) {
    const user = requireUser(context);

    const applicationRow = await requireOwnedApplication(user.id, applicationId);
    const application = normalizeJobApplication(applicationRow);
    const guardrailMessage = getMatchIntelligenceGuardrailMessage({
      jobDescription: application.jobDescription,
      resumeText: application.resumeSnapshotText,
    });

    if (guardrailMessage) {
      throw new ActionError({ code: "BAD_REQUEST", message: guardrailMessage });
    }

    return {
      result: buildMatchIntelligenceResult({
        jobDescription: application.jobDescription ?? "",
        resumeText: application.resumeSnapshotText ?? "",
        roleTitle: application.roleTitle,
        companyName: application.companyName,
      }),
    };
  },
});
