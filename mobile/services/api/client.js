import { API_URL } from "../../constants/config";
import { getAccessToken, removeAccessToken } from "../storage/authStorage";

export class ApiError extends Error {
  constructor(message, status, code = null, data = null) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

/**
 * Shared JSON request helper for every backend call — attaches the mobile
 * Bearer token automatically and normalizes error/response shapes so
 * feature API files never duplicate this plumbing.
 */
export async function apiRequest(path, options = {}) {
  const token = await getAccessToken();

  const headers = {
    Accept: "application/json",
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    // Stale/expired session — drop the token so the auth layer can route
    // back to login instead of retrying with a token that will never work.
    await removeAccessToken();
  }

  if (!response.ok) {
    throw new ApiError(
      payload.message || `Request failed (${response.status}).`,
      response.status,
      payload.code || null,
      payload
    );
  }

  return payload.data ?? payload;
}
