import type { Alpine } from "alpinejs";
import { registerAppDrawerStore } from "./modules/app/drawerStore";
import { registerJobApplicationsStore } from "./modules/job-applications/store";

export default function initAlpine(Alpine: Alpine) {
  registerAppDrawerStore(Alpine);
  registerJobApplicationsStore(Alpine);

  if (typeof window !== "undefined") {
    window.Alpine = Alpine;
  }
}
