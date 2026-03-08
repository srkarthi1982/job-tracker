import { Faq, db, eq } from "astro:db";

type FaqItem = { category: string; question: string; answer: string };

const FAQS: FaqItem[] = [
  {
    category: "Overview",
    question: "What is App Starter?",
    answer:
      "App Starter is the baseline mini-app template used in Ansiversa. It provides the core structure, auth alignment, and admin foundations used by production apps.",
  },
  {
    category: "Development",
    question: "How does it help build mini-apps?",
    answer:
      "It gives a ready project layout with established patterns for pages, actions, data handling, and admin flows, so teams can build app-specific features faster and consistently.",
  },
  {
    category: "Skills",
    question: "Do I need coding knowledge?",
    answer:
      "Yes. App Starter is intended for developers and technical builders who customize logic, data models, and UI behavior for their app domain.",
  },
  {
    category: "Deployment",
    question: "Can I deploy my app?",
    answer:
      "Yes. Apps built from this baseline can be deployed through the standard Ansiversa deployment flow used across mini-app repositories.",
  },
  {
    category: "Integration",
    question: "How does it integrate with Ansiversa?",
    answer:
      "It follows the Ansiversa app contract for identity context, shared components, and platform-level behaviors so mini-apps stay aligned with the parent ecosystem.",
  },
];

export default async function seedFaqContent() {
  await db.delete(Faq).where(eq(Faq.audience, "user"));

  await db.insert(Faq).values(
    FAQS.map((item, index) => ({
      audience: "user",
      category: item.category,
      question: item.question,
      answer_md: item.answer,
      sort_order: index + 1,
      is_published: true,
      created_at: new Date(),
      updated_at: new Date(),
    }))
  );

  console.log(`Seeded ${FAQS.length} production FAQs for app-starter user audience.`);
}
