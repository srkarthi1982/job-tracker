import {
  JOB_APPLICATION_STATUS_LABEL,
  type JobApplicationAiAction,
  type JobApplicationAiResultDTO,
  type JobApplicationDTO,
} from "./types";

export type JobApplicationAiResult = JobApplicationAiResultDTO & {
  action: JobApplicationAiAction;
  title: string;
  output: string;
  context: string[];
  generatedAt: string;
};

const daysSince = (value?: string | null) => {
  if (!value) return null;
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return null;
  return Math.floor(diff / (24 * 60 * 60 * 1000));
};

const getContextLines = (application: JobApplicationDTO) => {
  const lines = [
    `${application.companyName} · ${application.roleTitle}`,
    `Stage: ${JOB_APPLICATION_STATUS_LABEL[application.status]}`,
    `Applied: ${application.appliedDate}`,
  ];

  if (application.nextActionDate) {
    lines.push(`Next action date: ${application.nextActionDate}`);
  }

  if (application.interviewDate) {
    lines.push(`Interview date: ${application.interviewDate}`);
  }

  if (application.lastContactDate) {
    lines.push(`Last contact: ${application.lastContactDate}`);
  }

  if (application.events[0]) {
    lines.push(`Latest timeline event: ${application.events[0].eventLabel} (${application.events[0].eventDate})`);
  }

  return lines;
};

export const getAiGuardrailMessage = (action: JobApplicationAiAction, application: JobApplicationDTO) => {
  if (!application.roleTitle || !application.companyName) {
    return "Add company and role title to generate useful suggestions.";
  }

  if (!application.notes && action !== "summarizeStatus") {
    return "Add notes to get stronger suggestions tailored to your context.";
  }

  if (action === "draftThankYouNote" && !application.interviewDate) {
    return "Interview date is required for a thank-you note draft.";
  }

  return null;
};

export const buildApplicationAiResult = (
  action: JobApplicationAiAction,
  application: JobApplicationDTO,
): JobApplicationAiResult => {
  const statusLabel = JOB_APPLICATION_STATUS_LABEL[application.status] || application.status;
  const nextAction = application.nextActionLabel || "follow up with the recruiter";
  const contactGapDays = daysSince(application.lastContactDate ?? application.appliedDate);
  const contactGap = contactGapDays == null ? "recently" : `${contactGapDays} day${contactGapDays === 1 ? "" : "s"} ago`;
  const prepReminder = application.interviewDate
    ? `Interview is on ${application.interviewDate}; prepare three role-specific examples and one salary range question.`
    : "No interview date logged yet; keep outreach focused on response and timeline clarity.";

  const notesSnippet = application.notes
    ? `Based on your notes: ${application.notes.slice(0, 220)}${application.notes.length > 220 ? "…" : ""}`
    : "Notes are currently light, so this suggestion prioritizes clear next actions.";

  if (action === "suggestNextStep") {
    return {
      action,
      title: "Suggested next step",
      output: `Follow up within 2 days for ${application.roleTitle} at ${application.companyName}. The application is in ${statusLabel} stage, last contact was ${contactGap}, and your next move should be to ${nextAction}. ${prepReminder}`,
      context: getContextLines(application),
      generatedAt: new Date().toISOString(),
    };
  }

  if (action === "draftFollowUp") {
    return {
      action,
      title: "Draft follow-up message",
      output: `Hi [Name],\n\nI hope you're doing well. I wanted to follow up on my application for the ${application.roleTitle} role at ${application.companyName}. I'm still very interested in the opportunity and would appreciate any update you can share on the next steps.\n\nIf helpful, I can provide additional details on my recent experience that aligns with this role.\n\nThank you for your time,\n[Your Name]`,
      context: getContextLines(application),
      generatedAt: new Date().toISOString(),
    };
  }

  if (action === "draftThankYouNote") {
    return {
      action,
      title: "Draft thank-you note",
      output: `Hi [Interviewer Name],\n\nThank you for taking the time to speak with me about the ${application.roleTitle} role at ${application.companyName}. I enjoyed learning more about the team and the priorities for this position.\n\nOur conversation reinforced my excitement about contributing, especially around [specific topic discussed]. Please let me know if there is anything else I can share to support your decision.\n\nThanks again,\n[Your Name]`,
      context: getContextLines(application),
      generatedAt: new Date().toISOString(),
    };
  }

  return {
    action,
    title: "Application status summary",
    output: `Application is currently in ${statusLabel} stage for ${application.roleTitle} at ${application.companyName}. ${application.nextActionDate ? `Next action is "${nextAction}" by ${application.nextActionDate}.` : "No next action date is set yet."} ${application.interviewDate ? `Interview date is ${application.interviewDate}.` : "Interview date is not scheduled."} ${notesSnippet}`,
    context: getContextLines(application),
    generatedAt: new Date().toISOString(),
  };
};
