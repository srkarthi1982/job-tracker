import type { Alpine } from "alpinejs";
import { actions } from "astro:actions";
import { AvBaseStore } from "@ansiversa/components/alpine";
import {
  JOB_APPLICATION_STATUS,
  JOB_APPLICATION_STATUS_LABEL,
  JOB_APPLICATION_AI_ACTION_LABEL,
  type JobApplicationAiAction,
  type JobApplicationAiResultDTO,
  type JobApplicationDTO,
  type JobApplicationEventDTO,
  type JobApplicationForm,
  type JobApplicationStatus,
  type JobMatchIntelligenceResultDTO,
} from "./types";

type JobApplicationsView = "board" | "timeline";

type JobApplicationBoardGroup = {
  status: JobApplicationStatus;
  label: string;
  applications: JobApplicationDTO[];
};

type JobApplicationTimelineItem = {
  id: string;
  applicationId: string;
  companyName: string;
  roleTitle: string;
  label: string;
  date: string;
  notes: string | null;
  source: "event" | "application";
  sortTime: number;
};

export type JobApplicationSortOption =
  | "updatedDesc"
  | "updatedAsc"
  | "appliedDesc"
  | "appliedAsc"
  | "companyAsc"
  | "nextActionAsc";

const defaultForm = (): JobApplicationForm => ({
  companyName: "",
  roleTitle: "",
  status: "wishlist",
  appliedDate: new Date().toISOString().slice(0, 10),
  jobUrl: "",
  location: "",
  nextActionDate: "",
  nextActionLabel: "",
  lastContactDate: "",
  interviewDate: "",
  jobDescription: "",
  resumeSnapshotText: "",
  resumeLabel: "",
  notes: "",
});

const todayDate = () => new Date().toISOString().slice(0, 10);

type ApplicationAiUiState = {
  open: boolean;
  loading: boolean;
  error: string | null;
  activeAction: JobApplicationAiAction | null;
  lastAction: JobApplicationAiAction | null;
  result: JobApplicationAiResultDTO | null;
};

const defaultAiState = (): ApplicationAiUiState => ({
  open: false,
  loading: false,
  error: null,
  activeAction: null,
  lastAction: null,
  result: null,
});


type ApplicationMatchUiState = {
  open: boolean;
  loading: boolean;
  error: string | null;
  result: JobMatchIntelligenceResultDTO | null;
};

const defaultMatchState = (): ApplicationMatchUiState => ({
  open: false,
  loading: false,
  error: null,
  result: null,
});

export class JobApplicationsStore extends AvBaseStore {
  applications: JobApplicationDTO[] = [];
  statusFilter: "all" | JobApplicationStatus = "all";
  searchQuery = "";
  sortBy: JobApplicationSortOption = "updatedDesc";
  activeView: JobApplicationsView = "board";
  form: JobApplicationForm = defaultForm();
  editingId: string | null = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  expandedTimelineIds: string[] = [];
  aiByApplicationId: Record<string, ApplicationAiUiState> = {};
  matchByApplicationId: Record<string, ApplicationMatchUiState> = {};

  init(initial?: { applications?: JobApplicationDTO[] }) {
    this.applications = initial?.applications ?? [];
    this.aiByApplicationId = Object.fromEntries(this.applications.map((application) => [application.id, defaultAiState()]));
    this.matchByApplicationId = Object.fromEntries(this.applications.map((application) => [application.id, defaultMatchState()]));
  }

  get filteredApplications() {
    const query = this.searchQuery.trim().toLowerCase();

    return this.applications.filter((application) => {
      const matchesStatus = this.statusFilter === "all" || application.status === this.statusFilter;
      if (!matchesStatus) return false;

      if (!query) return true;

      return [application.companyName, application.roleTitle, application.location ?? ""]
        .some((value) => value.toLowerCase().includes(query));
    });
  }

  get visibleApplications() {
    return [...this.filteredApplications].sort((left, right) => {
      const updatedLeft = new Date(left.updatedAt).getTime();
      const updatedRight = new Date(right.updatedAt).getTime();
      const appliedLeft = new Date(left.appliedDate).getTime();
      const appliedRight = new Date(right.appliedDate).getTime();
      const actionLeft = left.nextActionDate ? new Date(left.nextActionDate).getTime() : Number.MAX_SAFE_INTEGER;
      const actionRight = right.nextActionDate ? new Date(right.nextActionDate).getTime() : Number.MAX_SAFE_INTEGER;

      switch (this.sortBy) {
        case "updatedAsc":
          return updatedLeft - updatedRight;
        case "appliedDesc":
          return appliedRight - appliedLeft;
        case "appliedAsc":
          return appliedLeft - appliedRight;
        case "companyAsc":
          return left.companyName.localeCompare(right.companyName);
        case "nextActionAsc":
          return actionLeft - actionRight;
        case "updatedDesc":
        default:
          return updatedRight - updatedLeft;
      }
    });
  }

  get hasActiveFilters() {
    return this.statusFilter !== "all" || this.searchQuery.trim().length > 0;
  }

  get boardGroups() {
    return JOB_APPLICATION_STATUS.map<JobApplicationBoardGroup>((status) => ({
      status,
      label: JOB_APPLICATION_STATUS_LABEL[status],
      applications: this.visibleApplications.filter((application) => application.status === status),
    }));
  }

  get timelineItems() {
    const items: JobApplicationTimelineItem[] = [];

    for (const application of this.visibleApplications) {
      items.push(this.applicationCreatedTimelineItem(application));

      for (const event of application.events) {
        items.push(this.eventTimelineItem(application, event));
      }
    }

    return items.sort((left, right) => right.sortTime - left.sortTime);
  }

  setView(view: JobApplicationsView) {
    this.activeView = view;
  }

  formatTimelineDate(date: string) {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  private timelineSortTime(date: string, fallbackDate: string) {
    const value = new Date(date).getTime();
    if (!Number.isNaN(value)) return value;
    const fallback = new Date(fallbackDate).getTime();
    return Number.isNaN(fallback) ? 0 : fallback;
  }

  private applicationCreatedTimelineItem(application: JobApplicationDTO): JobApplicationTimelineItem {
    return {
      id: `created-${application.id}`,
      applicationId: application.id,
      companyName: application.companyName,
      roleTitle: application.roleTitle,
      label: "Application added",
      date: application.appliedDate,
      notes: application.notes,
      source: "application",
      sortTime: this.timelineSortTime(application.appliedDate, application.createdAt),
    };
  }

  private eventTimelineItem(application: JobApplicationDTO, event: JobApplicationEventDTO): JobApplicationTimelineItem {
    return {
      id: event.id,
      applicationId: application.id,
      companyName: application.companyName,
      roleTitle: application.roleTitle,
      label: event.eventLabel,
      date: event.eventDate,
      notes: event.notes,
      source: "event",
      sortTime: this.timelineSortTime(event.eventDate, event.createdAt),
    };
  }

  get statusCounts() {
    const counts: Record<JobApplicationStatus, number> = {
      wishlist: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      accepted: 0,
    };

    for (const application of this.applications) {
      counts[application.status] += 1;
    }

    return counts;
  }

  get activeCount() {
    return this.statusCounts.wishlist
      + this.statusCounts.applied
      + this.statusCounts.interview
      + this.statusCounts.offer;
  }

  get closedCount() {
    return this.statusCounts.rejected + this.statusCounts.accepted;
  }

  get needsAttention() {
    const today = todayDate();
    const overdue = this.applications
      .filter((application) => !!application.nextActionDate && application.nextActionDate <= today)
      .sort((a, b) => (a.nextActionDate ?? "").localeCompare(b.nextActionDate ?? ""));

    const upcoming = this.applications
      .filter((application) => {
        if (!application.interviewDate) return false;
        const diff = new Date(application.interviewDate).getTime() - new Date(today).getTime();
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return days >= 0 && days <= 7;
      })
      .sort((a, b) => (a.interviewDate ?? "").localeCompare(b.interviewDate ?? ""));

    return { overdue, upcoming };
  }

  resetFilters() {
    this.statusFilter = "all";
    this.searchQuery = "";
    this.sortBy = "updatedDesc";
  }

  toggleTimeline(id: string) {
    if (this.expandedTimelineIds.includes(id)) {
      this.expandedTimelineIds = this.expandedTimelineIds.filter((item) => item !== id);
      return;
    }
    this.expandedTimelineIds = [...this.expandedTimelineIds, id];
  }

  isTimelineExpanded(id: string) {
    return this.expandedTimelineIds.includes(id);
  }

  matchState(id: string) {
    if (!this.matchByApplicationId[id]) {
      this.matchByApplicationId = { ...this.matchByApplicationId, [id]: defaultMatchState() };
    }
    return this.matchByApplicationId[id];
  }

  toggleMatchPanel(id: string) {
    const current = this.matchState(id);
    this.matchByApplicationId = {
      ...this.matchByApplicationId,
      [id]: {
        ...current,
        open: !current.open,
      },
    };
  }

  private setMatchState(id: string, partial: Partial<ApplicationMatchUiState>) {
    const current = this.matchState(id);
    this.matchByApplicationId = {
      ...this.matchByApplicationId,
      [id]: {
        ...current,
        ...partial,
      },
    };
  }

  async runMatchAnalysis(id: string) {
    const existing = this.applications.find((application) => application.id === id);
    if (!existing) return;

    this.setMatchState(id, { loading: true, error: null, open: true });

    try {
      const res = await actions.jobApplications.generateApplicationMatchIntelligence({ applicationId: id });
      const data = this.unwrapResult<{ result: JobMatchIntelligenceResultDTO }>(res);
      this.setMatchState(id, { loading: false, result: data.result });
    } catch (err: any) {
      this.setMatchState(id, { loading: false, error: err?.message || "Unable to analyze resume match." });
    }
  }

  async copyMatchOutput(id: string) {
    const state = this.matchState(id);
    if (!state.result || typeof navigator === "undefined" || !navigator.clipboard) return;

    const text = [
      `Match score: ${state.result.matchScore}%`,
      "",
      "Strong matches:",
      ...state.result.strongMatches.map((item) => `- ${item}`),
      "",
      "Missing skills:",
      ...state.result.missingSkills.map((item) => `- ${item}`),
      "",
      "Improvement suggestions:",
      ...state.result.improvementSuggestions.map((item) => `- ${item}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      this.success = "Match analysis copied.";
    } catch {
      this.error = "Unable to copy output.";
    }
  }

  aiState(id: string) {
    if (!this.aiByApplicationId[id]) {
      this.aiByApplicationId = { ...this.aiByApplicationId, [id]: defaultAiState() };
    }
    return this.aiByApplicationId[id];
  }

  toggleAiPanel(id: string) {
    const current = this.aiState(id);
    this.aiByApplicationId = {
      ...this.aiByApplicationId,
      [id]: {
        ...current,
        open: !current.open,
      },
    };
  }

  aiActionLabel(action: JobApplicationAiAction) {
    return JOB_APPLICATION_AI_ACTION_LABEL[action] ?? action;
  }

  private setAiState(id: string, partial: Partial<ApplicationAiUiState>) {
    const current = this.aiState(id);
    this.aiByApplicationId = {
      ...this.aiByApplicationId,
      [id]: {
        ...current,
        ...partial,
      },
    };
  }

  async runAiAction(id: string, action: JobApplicationAiAction) {
    const existing = this.applications.find((application) => application.id === id);
    if (!existing) return;

    this.setAiState(id, {
      loading: true,
      error: null,
      activeAction: action,
      open: true,
    });

    try {
      const res = await actions.jobApplications.generateApplicationAiAssist({ applicationId: id, action });
      const data = this.unwrapResult<{ result: JobApplicationAiResultDTO }>(res);
      this.setAiState(id, {
        loading: false,
        activeAction: null,
        lastAction: action,
        result: data.result,
      });
    } catch (err: any) {
      this.setAiState(id, {
        loading: false,
        activeAction: null,
        error: err?.message || "Unable to generate AI suggestion.",
      });
    }
  }

  async regenerateAiAction(id: string) {
    const state = this.aiState(id);
    if (!state.lastAction) return;
    await this.runAiAction(id, state.lastAction);
  }

  async copyAiOutput(id: string) {
    const state = this.aiState(id);
    if (!state.result?.output || typeof navigator === "undefined" || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(state.result.output);
      this.success = "AI output copied.";
    } catch {
      this.error = "Unable to copy output.";
    }
  }

  private unwrapResult<T = any>(result: any): T {
    if (result?.error) {
      const message = result.error?.message || result.error;
      throw new Error(message || "Request failed.");
    }
    return (result?.data ?? result) as T;
  }

  private emitDrawerEvent(name: "job-app-drawer-open" | "job-app-drawer-close", detail?: Record<string, unknown>) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  openCreate() {
    this.editingId = null;
    this.form = defaultForm();
    this.error = null;
    this.success = null;
    this.emitDrawerEvent("job-app-drawer-open", { key: "create" });
  }

  openEdit(application: JobApplicationDTO) {
    this.editingId = application.id;
    this.form = {
      companyName: application.companyName,
      roleTitle: application.roleTitle,
      status: application.status,
      appliedDate: application.appliedDate,
      jobUrl: application.jobUrl ?? "",
      location: application.location ?? "",
      nextActionDate: application.nextActionDate ?? "",
      nextActionLabel: application.nextActionLabel ?? "",
      lastContactDate: application.lastContactDate ?? "",
      interviewDate: application.interviewDate ?? "",
      jobDescription: application.jobDescription ?? "",
      resumeSnapshotText: application.resumeSnapshotText ?? "",
      resumeLabel: application.resumeLabel ?? "",
      notes: application.notes ?? "",
    };
    this.error = null;
    this.success = null;
    this.emitDrawerEvent("job-app-drawer-open", { key: "settings" });
  }

  closeDrawer() {
    this.editingId = null;
    this.form = defaultForm();
    this.error = null;
    this.emitDrawerEvent("job-app-drawer-close");
  }

  private validateForm() {
    if (!this.form.companyName.trim()) {
      return "Company name is required.";
    }
    if (!this.form.roleTitle.trim()) {
      return "Role title is required.";
    }
    if (!this.form.appliedDate.trim()) {
      return "Applied date is required.";
    }
    if (this.form.nextActionDate.trim() && !this.form.nextActionLabel.trim()) {
      return "Next action label is required when next action date is set.";
    }
    return null;
  }

  private payload() {
    return {
      companyName: this.form.companyName,
      roleTitle: this.form.roleTitle,
      status: this.form.status,
      appliedDate: this.form.appliedDate,
      jobUrl: this.form.jobUrl,
      location: this.form.location,
      nextActionDate: this.form.nextActionDate,
      nextActionLabel: this.form.nextActionLabel,
      lastContactDate: this.form.lastContactDate,
      interviewDate: this.form.interviewDate,
      jobDescription: this.form.jobDescription,
      resumeSnapshotText: this.form.resumeSnapshotText,
      resumeLabel: this.form.resumeLabel,
      notes: this.form.notes,
    };
  }

  async submitCreate() {
    const validationError = this.validateForm();
    if (validationError) {
      this.error = validationError;
      return;
    }

    if (this.loading) return;

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const res = await actions.jobApplications.createApplication(this.payload());
      const data = this.unwrapResult<{ application: JobApplicationDTO }>(res);
      if (data?.application) {
        this.applications = [data.application, ...this.applications];
        this.aiByApplicationId = { ...this.aiByApplicationId, [data.application.id]: defaultAiState() };
        this.matchByApplicationId = { ...this.matchByApplicationId, [data.application.id]: defaultMatchState() };
      }
      this.success = "Application created.";
      this.closeDrawer();
    } catch (err: any) {
      this.error = err?.message || "Unable to create application.";
    } finally {
      this.loading = false;
    }
  }

  async submitUpdate() {
    if (!this.editingId) return;

    const validationError = this.validateForm();
    if (validationError) {
      this.error = validationError;
      return;
    }

    if (this.loading) return;

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const res = await actions.jobApplications.updateApplication({
        id: this.editingId,
        data: this.payload(),
      });
      const data = this.unwrapResult<{ application: JobApplicationDTO }>(res);
      if (data?.application) {
        this.applications = this.applications.map((application) =>
          application.id === data.application.id ? data.application : application,
        );
      }
      this.success = "Application updated.";
      this.closeDrawer();
    } catch (err: any) {
      this.error = err?.message || "Unable to update application.";
    } finally {
      this.loading = false;
    }
  }

  async deleteApplication(id: string) {
    if (!id || this.loading) return;

    const approved = typeof window !== "undefined"
      ? window.confirm("Delete this application entry?")
      : true;

    if (!approved) return;

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const res = await actions.jobApplications.deleteApplication({ id });
      this.unwrapResult(res);
      this.applications = this.applications.filter((application) => application.id !== id);
      const nextAiState = { ...this.aiByApplicationId };
      delete nextAiState[id];
      this.aiByApplicationId = nextAiState;
      const nextMatchState = { ...this.matchByApplicationId };
      delete nextMatchState[id];
      this.matchByApplicationId = nextMatchState;
      this.success = "Application deleted.";
    } catch (err: any) {
      this.error = err?.message || "Unable to delete application.";
    } finally {
      this.loading = false;
    }
  }

  async quickUpdateStatus(id: string, status: JobApplicationStatus) {
    const existing = this.applications.find((application) => application.id === id);
    if (!existing || this.loading || existing.status === status) return;

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const res = await actions.jobApplications.updateApplication({
        id,
        data: {
          companyName: existing.companyName,
          roleTitle: existing.roleTitle,
          status,
          appliedDate: existing.appliedDate,
          jobUrl: existing.jobUrl ?? "",
          location: existing.location ?? "",
          nextActionDate: existing.nextActionDate ?? "",
          nextActionLabel: existing.nextActionLabel ?? "",
          lastContactDate: existing.lastContactDate ?? "",
          interviewDate: existing.interviewDate ?? "",
          jobDescription: existing.jobDescription ?? "",
          resumeSnapshotText: existing.resumeSnapshotText ?? "",
          resumeLabel: existing.resumeLabel ?? "",
          notes: existing.notes ?? "",
        },
      });

      const data = this.unwrapResult<{ application: JobApplicationDTO }>(res);
      if (data?.application) {
        this.applications = this.applications.map((application) =>
          application.id === data.application.id ? data.application : application,
        );
      }
      this.success = "Status updated.";
    } catch (err: any) {
      this.error = err?.message || "Unable to update status.";
    } finally {
      this.loading = false;
    }
  }
}

export const registerJobApplicationsStore = (Alpine: Alpine) => {
  Alpine.store("jobApplications", new JobApplicationsStore());
};
