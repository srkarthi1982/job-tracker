export const JOB_APPLICATION_STATUS = ["wishlist", "applied", "interview", "offer", "rejected"] as const;

export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUS)[number];

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
