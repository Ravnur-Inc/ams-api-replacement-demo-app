# RMS – Upload & Streaming Demo

This is a simple JavaScript application demonstrating how to upload a media file to **Ravnur Media Services** (RMS), process it, and stream.

---

## Setup

#### 1. Fill the .env file with your credentials

```
# Azure Storage (for asset files)
VITE_STORAGE_ACCOUNT_NAME       # Your Azure Storage account name
VITE_STORAGE_ACCOUNT_KEY        # Your Azure Storage account key

# RMS (for API access)
VITE_AZURE_SUBSCRIPTION_ID      # Azure subscription ID
VITE_AZURE_RESOURCE_GROUP       # Azure resource group
VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME  # RMS account name
VITE_RAVNUR_API_ENDPOINT        # RMS API endpoint URL
VITE_RAVNUR_API_KEY             # RMS API key
```

#### 2. Install packages
```
npm install
```
#### 3. Run app

```
npm run dev
```

---

## Step-by-Step Logic from `main.js` file

The `main.js` file handles the full media lifecycle in Ravnur Media Service (RMS) from upload to playback. The steps are:

1. **Get the token** – Retrieve an access token to authenticate requests to RMS APIs.  

2. **Create an input asset** – Create a new asset to hold the uploaded media, providing a storage container for the file.  

3. **Upload the file to the container** – Upload the selected media file to the input asset’s storage container.  

4. **Create a transform** – Define a transform to process the media.  

5. **Create an output asset** – Prepare an output asset to store the results of the processing job.  

6. **Create a job** – Submit a processing job using the input asset (uploaded file), output asset, and transform.  

7. **Poll the job status** – Check the status of the job repeatedly until it completes, ensuring the processing is finished before proceeding.  

8. **Create a streaming locator** – Generate a streaming locator to make the processed asset available for playback.  

9. **List the streaming locator paths** – Retrieve available streaming paths (HLS, DASH, etc.) for the asset from the locator.  

10. **Get the streaming endpoint** – Retrieve the hostname of the RMS streaming endpoint that will serve the media.  

11. **Get the HLS path** – Select the HLS path from the streaming paths and combine it with the endpoint hostname to form a full playback URL.  

12. **Initialize the player** – Initialize the HLS player in the browser using the generated HLS URL so the user can watch the processed video.  

> This flow covers the complete lifecycle of media in the app: **upload → process → stream**.
>
> <img width="1920" height="5225" alt="gitmind rms api demo" src="https://github.com/user-attachments/assets/04f715a0-5791-42f8-ac8d-ead35f0dde22" />
