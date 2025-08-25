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
- Real-time status monitoring
- DVR (Digital Video Recording) support
- Live playback with HLS player

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
VITE_RAVNUR_API_ENDPOINT        # RMS API endpoint URL
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
- [Live Streaming Implementation Details](src/pages/live/README.md)

