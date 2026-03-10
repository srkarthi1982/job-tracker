import { defineDb } from "astro:db";
import { Faq, job_application_events, job_applications } from "./tables";

export default defineDb({
  tables: {
    job_applications,
    job_application_events,
    Faq,
  },
});
