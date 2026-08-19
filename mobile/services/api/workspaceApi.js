import { apiRequest } from "./client";

export function getWorkspace() {
  return apiRequest("/workspace/default");
}
