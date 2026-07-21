# Live Streaming Demo

This page demonstrates how to create and manage live streaming events using the RMS REST API.

### 1. **Fill the form and click "Create Live Event"**
- System creates the live event using your settings
- Optionally enables **live transcription (closed captions)** — see below
- If DVR is enabled (depends on encoding type), the system automatically:
  - Creates an asset for recording
  - Creates a live output to connect the event to the asset
  - Creates a streaming locator for playback URLs

### 2. **System automatically starts the event**
- Event moves to "Starting" state
- System displays encoder connection details (ingest URL, stream key, etc.)
- You can now start streaming from your encoder using these details

### 3. **Status monitoring begins**
- System polls the event status every 5 seconds
- Waiting for your encoder to connect and start streaming
- Once streaming is detected as healthy, polling stops

### 4. **When streaming becomes healthy**
- System generates playback URLs (live stream and DVR if enabled)
- Ravnur media player loads the live stream

### 5. **Click "Stop Event" when done**
- System stops the live event
- All resources are cleaned up

---

## Live Transcription (Closed Captions)

The **Enable Live Closed Captions** checkbox adds a real-time transcription track to a newly created live event.

- **RTMP or SRT ingest, Passthrough encoding only, without low latency** — the checkbox is disabled automatically for RTSP ingest protocols, for Adaptive Bitrate (720p/1080p) encoding, and for events with low latency enabled, since RMS only supports live transcription on Passthrough-encoded RTMP or SRT events.
- **Language selection** — pick the spoken language of the incoming stream (e.g. `en-US`, `es-ES`, `fr-FR`) from the dropdown that appears once the checkbox is checked.
- **Only applies to new events** — transcription is set when the live event is created. Selecting an existing live event from the "Existing Live Event" dropdown reuses that event's current configuration; the closed captions checkbox has no effect in that case.

Under the hood, `createLiveEvent` ([src/actions/event.js](../../actions/event.js)) adds a `transcriptions` entry to the live event's `properties` when `enableLiveCC` is checked:

```js
transcriptions: [
  {
    language: config.liveCCLanguage,
  }
]
```

Once the event is running and receiving a stream, RMS generates a WebVTT caption track for the configured language alongside the video/audio renditions, which compatible HLS players (including the Ravnur Media Player used on this page) can display as closed captions.
