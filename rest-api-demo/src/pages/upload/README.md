# Upload & Processing Demo

This page demonstrates how to upload and process video files using the RMS REST API.

### 1. **Select a video file**
- Click "Choose File" and select your video
- System gets authentication token

### 2. **Upload process begins automatically**
- System creates an input asset for your file
- File uploads to Azure Blob Storage
- System creates a transform for video processing

### 3. **Processing starts**
- System creates an output asset for processed video
- Encoding job starts to process your video
- System polls job status until completion

### 4. **When processing completes**
- System creates streaming locator for playback
- Playback URLs are generated (HLS format)

### 5. **Video is ready to watch**
- Ravnur media player shows your processed video
