import {
  createApplication,
  deleteApplication,
  fetchMyApplications,
  updateApplication,
} from "./jobApplications";

export const jobApplications = {
  fetchMyApplications,
  createApplication,
  updateApplication,
  deleteApplication,
};

export const server = {
  jobApplications,
};
