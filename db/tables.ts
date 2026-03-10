import { column, defineTable, NOW } from "astro:db";

export const job_applications = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),
    companyName: column.text(),
    roleTitle: column.text(),
    status: column.text({ default: "wishlist" }),
    appliedDate: column.date(),
    jobUrl: column.text({ optional: true }),
    location: column.text({ optional: true }),
    nextActionDate: column.date({ optional: true }),
    nextActionLabel: column.text({ optional: true }),
    lastContactDate: column.date({ optional: true }),
    interviewDate: column.date({ optional: true }),
    notes: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
  indexes: [
    { name: "job_applications_user_idx", on: "userId" },
    { name: "job_applications_user_status_idx", on: ["userId", "status"] },
    { name: "job_applications_user_updated_idx", on: ["userId", "updatedAt"] },
  ],
});

export const job_application_events = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    applicationId: column.text(),
    userId: column.text(),
    eventType: column.text(),
    eventLabel: column.text(),
    eventDate: column.date(),
    notes: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
  },
  indexes: [
    { name: "job_app_events_user_idx", on: "userId" },
    { name: "job_app_events_application_idx", on: ["applicationId", "eventDate"] },
    { name: "job_app_events_created_idx", on: ["userId", "createdAt"] },
  ],
});

export const Faq = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    audience: column.text({ default: "user" }),
    category: column.text({ optional: true }),
    question: column.text(),
    answer_md: column.text(),
    sort_order: column.number({ default: 0 }),
    is_published: column.boolean({ default: false }),
    created_at: column.date({ default: NOW }),
    updated_at: column.date({ default: NOW }),
  },
  indexes: [
    {
      name: "faq_audience_published_idx",
      on: ["audience", "is_published"],
    },
    {
      name: "faq_sort_order_idx",
      on: "sort_order",
    },
  ],
});

export const starterTables = {
  job_applications,
  job_application_events,
  Faq,
} as const;
