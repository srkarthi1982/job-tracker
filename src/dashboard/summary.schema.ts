import { db, eq, job_applications } from "astro:db";
import type { JobApplicationStatus } from "../modules/job-applications/types";

export type JobTrackerDashboardSummaryV1 = {
  appId: "job-tracker";
  version: 1;
  updatedAt: string;
  totalApplications: number;
  statusCounts: {
    applied: number;
    interview: number;
    offer: number;
  };
};

export const buildJobTrackerSummary = async (userId: string): Promise<JobTrackerDashboardSummaryV1> => {
  const rows = await db
    .select({ status: job_applications.status })
    .from(job_applications)
    .where(eq(job_applications.userId, userId));

  const statusCounts = {
    applied: 0,
    interview: 0,
    offer: 0,
  };

  for (const row of rows) {
    const status = String(row.status ?? "") as JobApplicationStatus;
    if (status === "applied" || status === "interview" || status === "offer") {
      statusCounts[status] += 1;
    }
  }

  return {
    appId: "job-tracker",
    version: 1,
    updatedAt: new Date().toISOString(),
    totalApplications: rows.length,
    statusCounts,
  };
};
