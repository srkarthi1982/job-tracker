import type { Alpine } from "alpinejs";
import { actions } from "astro:actions";
import { AvBaseStore } from "@ansiversa/components/alpine";
import type { JobApplicationDTO, JobApplicationForm, JobApplicationStatus } from "./types";

const defaultForm = (): JobApplicationForm => ({
  companyName: "",
  roleTitle: "",
  status: "wishlist",
  appliedDate: new Date().toISOString().slice(0, 10),
  jobUrl: "",
  location: "",
  notes: "",
});

const defaultState = () => ({
  applications: [] as JobApplicationDTO[],
  form: defaultForm(),
  editingId: null as string | null,
  loading: false,
  error: null as string | null,
  success: null as string | null,
});

export class JobApplicationsStore extends AvBaseStore implements ReturnType<typeof defaultState> {
  applications: JobApplicationDTO[] = [];
  form: JobApplicationForm = defaultForm();
  editingId: string | null = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  init(initial?: { applications?: JobApplicationDTO[] }) {
    this.applications = initial?.applications ?? [];
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
