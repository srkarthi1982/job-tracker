import {
  createApplication,
  deleteApplication,
  fetchMyApplications,
  generateApplicationAiAssist,
  generateApplicationMatchIntelligence,
  updateApplication,
} from "./jobApplications";

export const jobApplications = {
  fetchMyApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  generateApplicationAiAssist,
  generateApplicationMatchIntelligence,
};

export const server = {
  jobApplications,
};
