/**
 * Handling of the Azure long-running operation (LRO) contract:
 * https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/async-operations
 *
 * Some RMS API calls cannot finish inside the request. The API validates the call, answers
 * 202 Accepted (or 201 Created), and continues the work server side. An SDK would hide this
 * behind something like `WaitUntil.Completed`; calling the REST API directly means implementing
 * it yourself:
 *
 *   1. Send the request. Only 201/202 start an async operation — 200/204 means it is already done.
 *   2. Read the status-tracking URL from the `Azure-AsyncOperation` response header. Only when
 *      that header is absent, fall back to `Location`; the two behave differently.
 *   3. GET the tracking URL until the body reports a terminal status.
 *   4. Wait the number of seconds in the `Retry-After` header between polls, or
 *      DEFAULT_POLLING_INTERVAL_MS when the response does not carry one.
 */

/** Used when a response carries no Retry-After header. */
export const DEFAULT_POLLING_INTERVAL_MS = 4000;

/** Starting a live event can take minutes when the node pool is cold, longer with live CC. */
export const DEFAULT_OPERATION_TIMEOUT_MS = 10 * 60 * 1000;

/** The only three terminal values in the contract. Anything else means "still running". */
const SUCCEEDED = 'Succeeded';
const TERMINAL_FAILURE_STATUSES = ['Failed', 'Canceled'];

/** Polling is silent unless the caller opts in by passing an onProgress callback. */
const noop = () => {};

/**
 * Sends a request and resolves once the operation it started has completed.
 *
 * @param {string} url - The full URL of the initiating request.
 * @param {Object} options - fetch options (method, headers, body).
 * @param {Object} config
 * @param {string} config.token - Bearer token, reused for the status polls.
 * @param {string} [config.description] - Used in progress messages and error messages.
 * @param {number} [config.timeoutMs] - Overall budget for the operation.
 * @param {(message: string) => void} [config.onProgress] - Called for each polling step. Omitted by
 *   default, so polling is silent; pass `log` from utils.js to surface progress in the page log.
 * @returns {Promise<Object|null>} The final status body, or null when there was nothing to poll.
 */
export async function sendLongRunningRequest(url, options, {
  token,
  description = 'Operation',
  timeoutMs = DEFAULT_OPERATION_TIMEOUT_MS,
  onProgress = noop,
} = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`${description} failed: ${await describeError(response)}`);
  }

  // An async operation starts with 201 or 202. Any other success status (200, 204) means the
  // API already finished the work and there is nothing to track.
  if (response.status !== 202 && response.status !== 201) {
    return null;
  }

  const asyncOperationUrl = response.headers.get('Azure-AsyncOperation');
  if (asyncOperationUrl) {
    return pollAsyncOperation(toTrackableUrl(asyncOperationUrl), {
      token,
      description,
      timeoutMs,
      onProgress,
      initialDelayMs: getRetryAfterMs(response),
    });
  }

  // Location is only to be used when Azure-AsyncOperation is absent.
  const locationUrl = response.headers.get('Location');
  if (locationUrl) {
    await pollLocation(toTrackableUrl(locationUrl), {
      token,
      description,
      timeoutMs,
      onProgress,
      initialDelayMs: getRetryAfterMs(response),
    });
    return null;
  }

  // A 201 does not necessarily mean the operation is async, so a missing tracking header simply
  // means it completed. A 202 with nothing to poll is a broken (or CORS-blocked) response.
  if (response.status === 201) {
    return null;
  }

  throw new Error(
    `${description} returned 202 Accepted but no 'Azure-AsyncOperation' or 'Location' header could be read, ` +
    `so the operation cannot be tracked. If the API does send those headers, the browser may not be able to ` +
    `see them: through the proxy check that they survive the hop, and when calling RMS directly ` +
    `check that it returns 'Access-Control-Expose-Headers' — cross-origin response headers are hidden unless ` +
    `explicitly exposed.`
  );
}

/**
 * Polls an Azure-AsyncOperation URL, which returns a status document:
 *
 *   { "name": "...", "status": "InProgress", "percentComplete": 40, "error": { ... } }
 *
 * Only "Succeeded", "Failed" and "Canceled" are terminal. Every other value means the operation
 * is still running — each resource provider names its running state freely, so an unrecognized
 * status must not be treated as an error.
 */
async function pollAsyncOperation(trackingUrl, { token, description, timeoutMs, onProgress, initialDelayMs }) {
  onProgress(`${description} accepted, tracking status at ${trackingUrl}`);

  const deadline = Date.now() + timeoutMs;
  let delayMs = initialDelayMs ?? DEFAULT_POLLING_INTERVAL_MS;

  while (true) {
    await delay(delayMs);

    const response = await fetch(trackingUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to read the status of ${description}: ${await describeError(response)}`);
    }

    const result = await response.json();

    if (!result?.status) {
      throw new Error(`The status endpoint of ${description} returned a body without a 'status' field`);
    }

    if (result.status === SUCCEEDED) {
      onProgress(`${description} completed with status '${result.status}'`);
      return result;
    }

    if (TERMINAL_FAILURE_STATUSES.includes(result.status)) {
      // The error object is only returned in a failed or canceled state.
      const reason = result.error
        ? `${result.error.code ?? 'Error'}: ${result.error.message ?? 'no message'}`
        : 'no error details returned';
      throw new Error(`${description} finished with status '${result.status}' — ${reason}`);
    }

    if (Date.now() >= deadline) {
      throw new Error(
        `${description} did not complete within ${Math.round(timeoutMs / 60000)} minutes, ` +
        `last reported status was '${result.status}'`
      );
    }

    delayMs = getRetryAfterMs(response) ?? DEFAULT_POLLING_INTERVAL_MS;

    const progress = typeof result.percentComplete === 'number' ? ` (${result.percentComplete}% complete)` : '';
    onProgress(`${description} is still '${result.status}'${progress}, checking again in ${delayMs / 1000}s`);
  }
}

/**
 * Polls a Location URL. Unlike Azure-AsyncOperation there is no status document: the endpoint
 * answers 202 while the operation runs and 200 once it is done.
 */
async function pollLocation(locationUrl, { token, description, timeoutMs, onProgress, initialDelayMs }) {
  onProgress(`${description} accepted, tracking status at ${locationUrl}`);

  const deadline = Date.now() + timeoutMs;
  let delayMs = initialDelayMs ?? DEFAULT_POLLING_INTERVAL_MS;

  while (true) {
    await delay(delayMs);

    const response = await fetch(locationUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to read the status of ${description}: ${await describeError(response)}`);
    }

    if (response.status !== 202) {
      onProgress(`${description} completed`);
      return;
    }

    if (Date.now() >= deadline) {
      throw new Error(`${description} did not complete within ${Math.round(timeoutMs / 60000)} minutes`);
    }

    delayMs = getRetryAfterMs(response) ?? DEFAULT_POLLING_INTERVAL_MS;
    onProgress(`${description} is still in progress, checking again in ${delayMs / 1000}s`);
  }
}

/**
 * Re-points a tracking URL at the dev-server proxy.
 *
 * RMS returns `Azure-AsyncOperation` / `Location` as absolute URLs pointing at the real RMS host.
 * This demo deliberately never talks to that host from the browser — all API calls go through the
 * Vite proxy prefix (`/rms-api/`) so that CORS never applies. Fetching the header URL as-is would
 * bypass the proxy and fail, so keep only its path and query and put the proxy prefix back in
 * front. When the app is configured with an absolute API endpoint there is no proxy and the URL
 * is used unchanged.
 */
function toTrackableUrl(trackingUrl) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;

  if (!apiEndpoint || /^https?:\/\//i.test(apiEndpoint)) {
    return trackingUrl;
  }

  const proxyPrefix = apiEndpoint.replace(/\/+$/, '');

  try {
    const { pathname, search } = new URL(trackingUrl, window.location.origin);

    // Guard against double-prefixing if the URL already comes back proxy-relative.
    if (pathname.startsWith(`${proxyPrefix}/`)) {
      return `${pathname}${search}`;
    }

    return `${proxyPrefix}${pathname}${search}`;
  } catch {
    return trackingUrl;
  }
}

/**
 * Reads Retry-After, which the server may send either as a number of seconds or as an HTTP date.
 * Returns null when the header is absent or unusable, so the caller can fall back to its default.
 */
function getRetryAfterMs(response) {
  const value = response.headers.get('Retry-After');

  if (!value) {
    return null;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return seconds > 0 ? seconds * 1000 : null;
  }

  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    const wait = date - Date.now();
    return wait > 0 ? wait : null;
  }

  return null;
}

async function describeError(response) {
  const text = await response.text();

  try {
    const json = JSON.parse(text);
    return `HTTP ${response.status}: ${json.error?.message || text}`;
  } catch {
    return `HTTP ${response.status}: ${text || response.statusText}`;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
