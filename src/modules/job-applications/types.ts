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

export const JOB_APPLICATION_EVENT_TYPE = [
  "created",
  "statusChanged",
  "interviewScheduled",
  "followUpPlanned",
  "contactLogged",
  "noteAdded",
] as const;

export type JobApplicationEventType = (typeof JOB_APPLICATION_EVENT_TYPE)[number];

export type JobApplicationEventDTO = {
  id: string;
  applicationId: string;
  userId: string;
  eventType: JobApplicationEventType;
  eventLabel: string;
  eventDate: string;
  notes: string | null;
  createdAt: string;
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
  nextActionDate: string | null;
  nextActionLabel: string | null;
  lastContactDate: string | null;
  interviewDate: string | null;
  notes: string | null;
  events: JobApplicationEventDTO[];
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
  nextActionDate: string;
  nextActionLabel: string;
  lastContactDate: string;
  interviewDate: string;
  notes: string;
};


export const JOB_APPLICATION_AI_ACTIONS = [
  "suggestNextStep",
  "draftFollowUp",
  "draftThankYouNote",
  "summarizeStatus",
] as const;

export type JobApplicationAiAction = (typeof JOB_APPLICATION_AI_ACTIONS)[number];

export const JOB_APPLICATION_AI_ACTION_LABEL: Record<JobApplicationAiAction, string> = {
  suggestNextStep: "Suggest next step",
  draftFollowUp: "Draft follow-up message",
  draftThankYouNote: "Draft thank-you note",
  summarizeStatus: "Summarize application status",
};

export type JobApplicationAiResultDTO = {
  action: JobApplicationAiAction;
  title: string;
  output: string;
  context: string[];
  generatedAt: string;
};
