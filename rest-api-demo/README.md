# RMS REST API Demo

This is a comprehensive JavaScript application demonstrating the capabilities of **Ravnur Media Services** (RMS) REST API. The demo includes two main workflows: **video upload & processing** and **live streaming events**.

---

## Features

### 🎥 **Upload & Processing**
- Upload video files to RMS
- Create encoding transforms
- Process media with jobs
- Generate streaming URLs
- Built-in HLS video player

### 📡 **Live Streaming**
- Create live streaming events
- Support for multiple ingest protocols (RTMP, SRT, RTSP)
- Multiple encoding options (Passthrough, 720p, 1080p)
- Live transcription / closed captions (RTMP/SRT ingest only, passthrough, multiple languages)
- Real-time status monitoring
- DVR (Digital Video Recording) support
- Live playback with HLS player

---

## ⚠️ Important Notes

This is a **demo application for local testing purposes only**. It demonstrates how to work with the RMS API for both VOD (video-on-demand) and live streaming workflows.

### CORS Handling
Calling a real RMS server directly from the browser would normally trigger **CORS (Cross-Origin Resource Sharing) errors**. To avoid this, the Vite dev server proxies all RMS API calls: the browser talks only to its own origin (`http://localhost:5173/rms-api/…`), and the dev server forwards those requests to the real RMS endpoint server-side, where CORS does not apply.

**What this means for you:**
- No browser workarounds are needed — run the app in a normal browser with web security enabled.
- Set `RMS_API_TARGET` in your `.env` to your RMS endpoint (see below). Leave `VITE_RAVNUR_API_ENDPOINT` as the local proxy prefix `/rms-api/`.
- The proxy runs only for `npm run dev` / `npm run preview`, which is all this local demo needs.

---

## Setup

### 1. Environment Configuration

Create a `.env` file in the root directory with your RMS credentials:

```env
# Azure Storage
VITE_STORAGE_ACCOUNT_NAME       # Your Azure Storage account name
VITE_STORAGE_ACCOUNT_KEY        # Your Azure Storage account key

# RMS
VITE_AZURE_SUBSCRIPTION_ID      # Azure subscription ID
VITE_AZURE_RESOURCE_GROUP       # Azure resource group
VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME  # RMS account name
VITE_RAVNUR_API_ENDPOINT        # Local proxy prefix — leave as /rms-api/
RMS_API_TARGET                  # Real RMS API endpoint the dev-server proxy forwards to (no trailing slash)
VITE_RAVNUR_API_KEY             # RMS API key
```

### 2. Installation

```bash
npm install
```

### 3. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

---

## Navigation
The application provides two main sections accessible from the home page:

- **Upload Demo** (`/src/pages/upload/`) - Video file upload and processing
- **Live Streaming Demo** (`/src/pages/live/`) - Live event management

---

## Long-running operations

Some RMS API calls cannot finish inside the request. Starting and stopping a live event are the clearest examples: the API validates the call, answers **202 Accepted**, and continues the actual work server side. A response arriving is therefore *not* the same as the operation being done.

Azure defines a standard contract for tracking these, which RMS implements — see [Track asynchronous Azure operations](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/async-operations). An SDK hides the whole handshake behind something like `WaitUntil.Completed`. This demo calls the naked REST API, so it implements the contract itself in [`src/actions/longRunningOperation.js`](src/actions/longRunningOperation.js).

### The contract

1. Send the initiating request. An async operation starts with **`201 Created`** or **`202 Accepted`**; any other success status (`200`, `204`) means the work is already done and there is nothing to poll.
2. Read the status-tracking URL from the **`Azure-AsyncOperation`** response header. Only when that header is absent, fall back to **`Location`** — the two are not interchangeable and return different things.
3. `GET` the tracking URL until the body reports a terminal status.
4. Between polls, wait the number of seconds given by the **`Retry-After`** header. When the response carries no `Retry-After`, this app falls back to a **4-second** interval.

An `Azure-AsyncOperation` URL returns a status document:

```json
{
  "name": "<operation id>",
  "status": "InProgress | Succeeded | Failed | Canceled",
  "percentComplete": 40,
  "error": {
    "code": "<error code>",
    "message": "<error description>"
  }
}
```

Only **`Succeeded`**, **`Failed`** and **`Canceled`** are terminal. `Succeeded` resolves the call; the other two throw, using the `error` object, which is only returned in those two states.

Every other value means the operation is still running. This matters: the contract lets each resource provider name its running state freely (RMS uses `InProgress`, others use `Running` or `Accepted`), so an unrecognized status must be treated as "keep polling" rather than as an error. Polling continues until a terminal status arrives or the overall budget expires (10 minutes by default — a live event can take minutes to start when the node pool is cold, longer with live CC enabled).

A `Location` URL behaves differently: there is no status document. The endpoint answers `202` while the operation runs and `200` once it is done.

### Using the helper

`sendLongRunningRequest` wraps `fetch`, so it works for any long-running RMS endpoint, not just start/stop:

```js
import { sendLongRunningRequest } from './longRunningOperation.js';

await sendLongRunningRequest(
  url,
  { method: 'POST', headers },
  { token, description: `Start of live event '${eventName}'` }
);
```

It resolves with the final status body (or `null` when there was nothing to poll) and rejects when the initiating request fails, when the operation ends in `Failed`/`Canceled`, or when it exceeds the timeout. The `description` is used in error messages and progress messages. `startLiveEvent` and `stopLiveEvent` in [`src/actions/event.js`](src/actions/event.js) are thin wrappers over it.

### Progress reporting

**Polling is silent by default** — it emits one line per poll, which would bury the rest of the page log during a multi-minute operation. To see it, pass an `onProgress` callback; `log` from `utils.js` writes to the on-page log:

```js
import { log } from '../utils.js';

await sendLongRunningRequest(
  url,
  { method: 'POST', headers },
  { token, description: `Start of live event '${eventName}'`, onProgress: log }
);
```

With it enabled the log shows the operation progressing:

```
[10:12:04] Starting live event: live-event-1737460000000
[10:12:05] Start of live event 'live-event-...' accepted, tracking status at /rms-api/subscriptions/.../operationResults/...
[10:12:09] Start of live event 'live-event-...' is still 'InProgress', checking again in 4s
[10:12:13] Start of live event 'live-event-...' is still 'InProgress', checking again in 4s
[10:12:17] Start of live event 'live-event-...' completed with status 'Succeeded'
[10:12:17] Live event started successfully: live-event-1737460000000
```

Without it, only the surrounding `Starting live event` / `Live event started successfully` lines appear — but those now bracket the *real* duration of the operation, since the call no longer returns early.

Errors are unaffected by this setting: a failed or timed-out operation always rejects with a full message regardless of `onProgress`.

### Two gotchas

- **Tracking URLs are rewritten to go through the proxy.** RMS returns `Azure-AsyncOperation` and `Location` as absolute URLs pointing at the real RMS host. Fetching those directly from the browser would bypass the dev-server proxy described above and hit CORS, so the helper keeps only the path and query and puts the `/rms-api` prefix back in front. If you point the app at an absolute API endpoint instead, the URLs are used unchanged.
- **Polling needs resource-group-level permission.** The tracking URL is not scoped to the resource, so resource-level permission is enough to *start* an operation but not to *track* it.

---

## Documentation Links

- [RMS API Documentation](https://docs.ravnur.com/)
- [Live Streaming Implementation Details](src/pages/live/README.md)

