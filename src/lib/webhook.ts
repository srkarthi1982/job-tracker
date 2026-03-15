const DEFAULT_TIMEOUT_MS = 4000;
const DEFAULT_RETRIES = 2;
const RESPONSE_PREVIEW_LIMIT = 240;

const previewResponseText = (value: string) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.length > RESPONSE_PREVIEW_LIMIT
    ? `${normalized.slice(0, RESPONSE_PREVIEW_LIMIT)}...`
    : normalized;
};

export const postWebhook = async (params: {
  url: string | null;
  secret?: string | null;
  payload: Record<string, unknown>;
  appKey: string;
  timeoutMs?: number;
  retries?: number;
}): Promise<boolean> => {
  const url = params.url;
  const secret = params.secret;
  if (!url || !secret) {
    if (import.meta.env.DEV) {
      console.warn(
        `postWebhook skipped: missing url/secret (appKey=${params.appKey})`,
      );
    }
    return false;
  }

  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = params.retries ?? DEFAULT_RETRIES;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Ansiversa-Signature": secret,
        },
        body: JSON.stringify(params.payload),
        signal: controller.signal,
      });

      if (response.ok) {
        return true;
      }

      const responseText = await response.text().catch(() => "");
      const responsePreview = previewResponseText(responseText);
      const errorContext = {
        appKey: params.appKey,
        attempt: attempt + 1,
        retries: retries + 1,
        status: response.status,
        statusText: response.statusText,
        url,
        responsePreview,
      };

      if (attempt >= retries) {
        console.warn("postWebhook failed with non-2xx response", errorContext);
        return false;
      }
    } catch (error) {
      if (attempt >= retries) {
        console.warn(`postWebhook failed after network exception (appKey=${params.appKey})`, {
          url,
          error,
        });
        return false;
      }
    } finally {
      clearTimeout(timeout);
    }

    const delay = 400 * (attempt + 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return false;
};
