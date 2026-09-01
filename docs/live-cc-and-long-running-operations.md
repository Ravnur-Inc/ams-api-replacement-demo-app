# Live closed captions and long-running operations

This document describes the changes made to the demo applications to support two features:

- **Live CC** — live transcription (closed captions) on a live event.
- **Long-running operations** — explicit handling of the Azure async-operation contract for API calls that do not finish within the request.

| Application | Stack | Live CC | Long-running operations |
|---|---|---|---|
| [`rest-api-demo`](../rest-api-demo) | Browser app calling the naked RMS REST API | ✅ | ✅ implemented by hand |
| [`rms-live-demo-app`](../rms-live-demo-app) | .NET 8 console app on the `Azure.ResourceManager.Media` SDK | ✅ | handled by the SDK — see note below |

---

## 1. Live closed captions

RMS generates a WebVTT caption track for a live event configured with a `transcriptions` entry. One constraint shapes the implementation in both apps:

- RMS only supports live transcription on **Passthrough-encoded** events (RTMP or SRT ingest), and not together with low latency.

### `rest-api-demo`

**`src/pages/live/index.html`** gained an `enableLiveCC` checkbox and a `liveCCLanguage` select, hidden until the checkbox is ticked.

**`src/actions/event.js`** — `createLiveEvent` adds the transcription block to the request body when the option is on:

```js
...(config.enableLiveCC && {
  transcriptions: [
    { language: config.liveCCLanguage }
  ]
})
```

**`src/pages/live/live.js`** enforces the RMS constraints in the UI. Live CC is only selectable for RTMP/SRT passthrough without low latency, and the relationship is mutual — enabling CC restricts the protocol/encoding/low-latency controls, and choosing an incompatible option clears and disables the CC checkbox:

```js
const canEnableCC = (isRTMP || isSRT) && !isABR && !isLowLatency;
```

The page also warns up front that provisioning takes longer with live CC enabled (up to ~5 minutes to start, and up to ~72 seconds for the player to appear), so a normal wait does not look like a hang.

### `rms-live-demo-app`

After the output type is chosen, the console app asks whether to enable transcription, but only when Passthrough was selected:

```csharp
// Live transcription (closed captions) is only supported for Passthrough-encoded events (RTMP or SRT ingest)
string? transcriptionLanguage = null;
if (liveOutputType == 1)
{
    Console.Write("Enable live transcription (closed captions)? (y/N): ");
    // ... language prompt, defaulting to en-US
}
```

The chosen language flows into `GetOrCreateLiveEvent` names events deterministically from the ingest/output combo, so a live event from a previous run is often reused rather than freshly created — and that event may already carry different transcription settings than what was just requested. So after `GetOrCreateLiveEvent` returns, the app compares the event's current transcription language against `transcriptionLanguage` and, only when they differ, clears any existing entry and updates the event

```csharp
if (liveEvent.Data.Transcriptions.FirstOrDefault()?.Language != transcriptionLanguage)
{
    liveEvent.Data.Transcriptions.Clear();
    if (transcriptionLanguage is not null)
    {
        liveEvent.Data.Transcriptions.Add(new LiveEventTranscription
        {
            Language = transcriptionLanguage,
        });
    }
    await liveEvent.UpdateAsync(WaitUntil.Completed, liveEvent.Data);
}
```
Without this, a reused live event would keep whatever transcription language (or lack of one) it was first created with, ignoring what you answer on later runs.
---

## 2. Long-running operations

### The problem

Starting and stopping a live event are long-running: the API validates the request, answers **202 Accepted**, and continues the work server side. A response arriving is not the same as the operation being done. Azure defines a standard contract for tracking these — [Track asynchronous Azure operations](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/async-operations) — and RMS implements it.

**In `rms-live-demo-app` there is nothing to do:** the Azure SDK implements the contract internally, and `WaitUntil.Completed` is the app's way of opting into it.

```csharp
await liveEvent.StartAsync(WaitUntil.Completed);
await liveEvent.StopAsync(WaitUntil.Completed, new LiveEventActionContent());
```

**`rest-api-demo` calls the naked REST API**, so it had no such handling. `startLiveEvent` and `stopLiveEvent` fired the POST, checked `response.ok`, and immediately logged success — which was inaccurate, since at that point the operation had only been *accepted*. Everything downstream (fetching ingest details, starting status polling) therefore ran against an event that was not necessarily started yet.

### The contract

1. Send the initiating request. An async operation starts with **`201 Created`** or **`202 Accepted`**; any other success status (`200`, `204`) means the work is already done.
2. Read the status-tracking URL from the **`Azure-AsyncOperation`** response header. Only when that header is absent, fall back to **`Location`**.
3. `GET` the tracking URL until the body reports a terminal status.
4. Between polls, wait the number of seconds given by the **`Retry-After`** header, or 4 seconds when the response carries none.

An `Azure-AsyncOperation` URL returns a status document:

```json
{
  "name": "<operation id>",
  "status": "InProgress | Succeeded | Failed | Canceled",
  "percentComplete": 40,
  "error": { "code": "<error code>", "message": "<error description>" }
}
```

Only **`Succeeded`**, **`Failed`** and **`Canceled`** are terminal, and the `error` object is only returned in the latter two. Every other value means the operation is still running — the contract lets each resource provider name its running state freely, so an unrecognized status must not be treated as an error.

A `Location` URL behaves differently: no status document, just `202` while running and `200` when done. The two headers are not interchangeable.

### New file: `src/actions/longRunningOperation.js`

Implements the contract once, for any long-running RMS endpoint. The entry point wraps `fetch`:

```js
export async function sendLongRunningRequest(url, options, { token, description, timeoutMs, onProgress })
```

Behaviour worth noting:

- Resolves with the final status body, or `null` when there was nothing to poll — either a `200`/`204`, or a `201` with no tracking header (per the contract a `201` does not necessarily mean the operation is async). A `202` with no tracking header is a broken response and rejects.
- Rejects when the initiating request fails, when the operation ends in `Failed`/`Canceled`, or when it exceeds the timeout.
- Default timeout is **10 minutes** — a live event can take minutes to start when the node pool is cold, longer with live CC.
- `Retry-After` is honoured on the initial response and on every poll, in both seconds and HTTP-date form.
- **Polling is silent by default.** It emits a line per poll, which would bury the rest of the page log
  during a multi-minute operation, so progress reporting is opt-in: pass an `onProgress` callback
  (`log` from `utils.js` writes to the on-page log). Errors are unaffected — a failed or timed-out
  operation always rejects with a full message.
- `percentComplete` is included in the progress message when the provider sends it.
- The `description` passed by the caller is used in both progress and error messages.

#### Tracking URLs are rewritten to go through the proxy

The one browser-specific wrinkle, handled by `toTrackableUrl`. This demo never talks to the RMS host from the browser — all calls go through the Vite dev-server proxy prefix (`/rms-api/`) precisely so CORS never applies. But RMS returns `Azure-AsyncOperation` and `Location` as **absolute URLs pointing at the real RMS host**, so polling them as-is would bypass the proxy and fail. The helper keeps only the path and query and puts the proxy prefix back in front:

```js
const { pathname, search } = new URL(trackingUrl, window.location.origin);
return `${proxyPrefix}${pathname}${search}`;
```

When the app is configured with an absolute API endpoint instead of the proxy prefix, the URL is used unchanged.

### Changes to `src/actions/event.js`

`startLiveEvent` and `stopLiveEvent` became thin wrappers over the helper. The bodies, URLs and headers are unchanged; only the `fetch` + `response.ok` check was replaced:

```js
await sendLongRunningRequest(
  url,
  { method: 'POST', headers },
  { token, description: `Start of live event '${eventName}'` }
);
```

Both functions now resolve only once the operation has actually reached `Succeeded`, so the existing `log('Live event started successfully')` line finally means what it says.
