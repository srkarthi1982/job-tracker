import {
  createApplication,
  deleteApplication,
  fetchMyApplications,
  generateApplicationAiAssist,
  updateApplication,
} from "./jobApplications";

export const jobApplications = {
  fetchMyApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  generateApplicationAiAssist,
};

export const server = {
  jobApplications,
};
