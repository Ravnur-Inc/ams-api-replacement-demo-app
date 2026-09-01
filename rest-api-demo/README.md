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
- Create live streaming events, or reuse an existing one
- Support for multiple ingest protocols (RTMP, SRT, RTSP)
- Multiple encoding options (Passthrough, 720p, 1080p)
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

## Documentation Links

- [RMS API Documentation](https://docs.ravnur.com/)
- [Live Streaming Implementation Details](src/pages/live/README.md) - a step-by-step walkthrough of what happens after you click "Create" or pick an existing event (resource setup, encoder connection, status polling, playback, cleanup). Worth a read before your first live test, so you know what to expect at each stage instead of guessing from the UI.
