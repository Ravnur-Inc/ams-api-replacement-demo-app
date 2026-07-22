// DOCUMENTATION: https://docs.ravnur.com/hc/en-us/articles/20199019452690-RMS-API-Authentication

import { log } from "../utils";

/**
 * Characters a token may consist of: base64url (which legitimately includes "-" and "_"), the "."
 * that separates JWT segments, and standard-base64 padding. Anything else - whitespace, newlines,
 * or the "<" of an HTML error page - means the response is not a token.
 */
const VALID_TOKEN = /^[A-Za-z0-9._~+\/=-]+$/;

/**
 * Gets an authentication token
 * @returns {Promise<string|null>} The authentication token, or null when authentication failed
 */
export default async function getToken() {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const apiKey = import.meta.env.VITE_RAVNUR_API_KEY;

  const url = `${apiEndpoint}auth/token`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subscriptionId, apiKey })
    });

    const body = (await response.text()).trim();

    // Without this check an error response (e.g. a gateway's HTML error page) is returned as if it
    // were a token. It then fails much later and far less obviously: a multi-line body makes
    // `Authorization: Bearer <body>` an illegal header value, so the *next* API call is what dies,
    // with "Failed to execute 'fetch' on 'Window': Invalid value".
    if (!response.ok) {
      log(`Authentication failed: HTTP ${response.status} ${response.statusText} — ${summarize(body)}`);
      return null;
    }

    // A 200 is not proof of a token, and a token has to survive being put in a header, so check the
    // shape here rather than letting it blow up at the point of use.
    if (!body || !VALID_TOKEN.test(body)) {
      log(`Authentication failed: the endpoint returned a response that is not a token — ${summarize(body)}`);
      return null;
    }

    log('Authentication successful');
    return body;
  } catch (error) {
    log(`Authentication failed: ${error}`);
    return null;
  }
}

/** Keeps error logs readable when the body is an HTML page rather than a short message. */
function summarize(body) {
  if (!body) return 'empty response';

  const text = body.replace(/\s+/g, ' ').trim();
  const looksLikeHtml = /^<(!doctype|html)/i.test(text);
  const preview = text.length > 200 ? `${text.slice(0, 200)}…` : text;

  return looksLikeHtml ? `received an HTML page (${body.length} bytes): ${preview}` : preview;
}
