import { defineDb } from "astro:db";
import { Faq, job_applications } from "./tables";

export default defineDb({
  tables: {
    job_applications,
    Faq,
  },
});
