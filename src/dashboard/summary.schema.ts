import { db, eq, job_applications } from "astro:db";
import type { JobApplicationStatus } from "../modules/job-applications/types";

export type JobTrackerDashboardSummaryV1 = {
  appId: "job-tracker";
  version: 1;
  updatedAt: string;
  totalApplications: number;
  statusCounts: {
    wishlist: number;
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
    accepted: number;
  };
  activeCount: number;
  closedCount: number;
};

export const buildJobTrackerSummary = async (userId: string): Promise<JobTrackerDashboardSummaryV1> => {
  const rows = await db
    .select({ status: job_applications.status })
    .from(job_applications)
    .where(eq(job_applications.userId, userId));

  const statusCounts = {
    wishlist: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    accepted: 0,
  };

  for (const row of rows) {
    const status = String(row.status ?? "") as JobApplicationStatus;
    if (
      status === "wishlist"
      || status === "applied"
      || status === "interview"
      || status === "offer"
      || status === "rejected"
      || status === "accepted"
    ) {
      statusCounts[status] += 1;
    }
  }

  return {
    appId: "job-tracker",
    version: 1,
    updatedAt: new Date().toISOString(),
    totalApplications: rows.length,
    statusCounts,
    activeCount: statusCounts.wishlist + statusCounts.applied + statusCounts.interview + statusCounts.offer,
    closedCount: statusCounts.rejected + statusCounts.accepted,
  };
};
