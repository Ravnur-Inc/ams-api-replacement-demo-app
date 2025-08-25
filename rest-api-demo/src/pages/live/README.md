# Live Streaming Demo

This page demonstrates how to create and manage live streaming events using the RMS REST API.

### 1. **Fill the form and click "Create Live Event"**
- System creates the live event using your settings
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
