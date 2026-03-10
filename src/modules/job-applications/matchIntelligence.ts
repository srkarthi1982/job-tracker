import type { JobMatchIntelligenceResultDTO } from "./types";

type MatchIntelligenceInput = {
  resumeText: string;
  jobDescription: string;
  roleTitle?: string | null;
  companyName?: string | null;
};

const CORE_KEYWORDS = [
  "javascript",
  "typescript",
  "node.js",
  "node",
  "react",
  "next.js",
  "astro",
  "python",
  "java",
  "go",
  "sql",
  "postgresql",
  "mongodb",
  "graphql",
  "rest",
  "aws",
  "gcp",
  "azure",
  "docker",
  "kubernetes",
  "microservices",
  "system design",
  "distributed systems",
  "ci/cd",
  "testing",
  "leadership",
  "mentoring",
  "agile",
  "scrum",
  "communication",
  "problem solving",
  "api",
  "security",
  "performance",
  "scalability",
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9+.#\-/\s]/g, " ");

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

const includesTerm = (text: string, term: string) => {
  if (term.includes(" ")) return text.includes(term);
  return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i").test(text);
};

const extractTerms = (jobText: string, roleTitle?: string | null) => {
  const normalizedJob = normalize(jobText);
  const normalizedRole = normalize(roleTitle ?? "");

  const keywordMatches = CORE_KEYWORDS.filter((term) => includesTerm(normalizedJob, term));
  const roleTerms = normalizedRole.split(/\s+/).filter((term) => term.length >= 4);

  const responsibilityTerms = unique(
    normalizedJob
      .split(/\s+/)
      .filter((term) => term.length >= 5)
      .filter((term) => ["build", "design", "develop", "lead", "optimize", "deliver", "manage"].includes(term)),
  );

  return unique([...keywordMatches, ...roleTerms, ...responsibilityTerms]).slice(0, 30);
};

const titleCase = (value: string) => value.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

export const buildMatchIntelligenceResult = (input: MatchIntelligenceInput): JobMatchIntelligenceResultDTO => {
  const normalizedResume = normalize(input.resumeText);
  const terms = extractTerms(input.jobDescription, input.roleTitle);

  const strongMatches = terms.filter((term) => includesTerm(normalizedResume, term)).slice(0, 8);
  const missingSkills = terms.filter((term) => !includesTerm(normalizedResume, term)).slice(0, 8);

  const coverage = terms.length ? strongMatches.length / terms.length : 0;
  const baseline = 42;
  const score = Math.max(0, Math.min(100, Math.round(baseline + coverage * 58)));

  const suggestions = [
    missingSkills[0] ? `Add a bullet that demonstrates ${titleCase(missingSkills[0])} with measurable impact.` : "Add one quantified achievement that maps directly to the role requirements.",
    input.roleTitle ? `Use the exact job title wording (“${input.roleTitle}”) in your resume summary when accurate.` : "Align your summary wording with the target role title.",
    missingSkills[1] ? `Include a recent project that highlights ${titleCase(missingSkills[1])}.` : "Highlight one relevant project with the same tools mentioned in the job description.",
  ].slice(0, 3);

  const summary = `Match score ${score}%. ${strongMatches.length} strong alignment signals and ${missingSkills.length} notable gaps found for ${input.companyName || "this application"}.`;

  return {
    matchScore: score,
    missingSkills: missingSkills.map(titleCase),
    strongMatches: strongMatches.map(titleCase),
    improvementSuggestions: suggestions,
    summary,
    generatedAt: new Date().toISOString(),
  };
};

export const getMatchIntelligenceGuardrailMessage = (input: { jobDescription?: string | null; resumeText?: string | null }) => {
  const jobDescription = (input.jobDescription ?? "").trim();
  const resumeText = (input.resumeText ?? "").trim();

  if (!jobDescription) return "Add a job description to analyze match.";
  if (!resumeText) return "Paste a resume snapshot to generate a match score.";
  return null;
};
