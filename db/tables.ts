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
  Faq,
} as const;
