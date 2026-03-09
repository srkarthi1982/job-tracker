export const JOB_APPLICATION_STATUS = ["wishlist", "applied", "interview", "offer", "rejected", "accepted"] as const;

export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUS)[number];

export const JOB_APPLICATION_STATUS_LABEL: Record<JobApplicationStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  accepted: "Accepted",
};

export type JobApplicationDTO = {
  id: string;
  userId: string;
  companyName: string;
  roleTitle: string;
  status: JobApplicationStatus;
  appliedDate: string;
  jobUrl: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationForm = {
  companyName: string;
  roleTitle: string;
  status: JobApplicationStatus;
  appliedDate: string;
  jobUrl: string;
  location: string;
  notes: string;
};
