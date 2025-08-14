import './style.css'
import { createAsset } from './actions/assets.js';
import { createTransform } from './actions/transforms.js';
import { createJob, jobStatusPolling } from './actions/jobs.js';
import { getStreamingEndpoint } from "./actions/streamingEndpoints.js";
import { uploadBlob } from "./actions/uploadBlob.js";
import { initializeHlsPlayer } from "./actions/player.js";
import { createStreamingLocator, listStreamingLocatorPaths } from "./actions/streamingLocators.js";
import { clearLog } from "./utils.js";
import getToken from './actions/getToken.js';

const fileInputEl = document.getElementById("fileInput");
const progressBar = document.getElementById("progressBar");

async function onFileSelected() {
  clearLog();
  progressBar.value = 0;
  const file = fileInputEl.files?.[0];
  if (!file) return;

  // Step 1: Get the token
  const token = await getToken();

  // Step 2: Create an asset
  const assetName = `asset-${Date.now()}`;
  const asset = await createAsset(assetName, token);
  
  // Get the container name from the asset. Example name: asset-841fdeee-13c0-4c55-2bcb-08dddaef909e
  const containerName = asset.properties.container;

  // Step 3: Upload the file to the container
  await uploadBlob(file, containerName);

  // Step 4: Create a transform
  const transformName = `transform-${Date.now()}`;
  await createTransform(transformName, token);

  // Step 5: Create output asset for the job
  const outputAssetName = `output-asset-${Date.now()}`;
  await createAsset(outputAssetName, token);

  // Step 6: Create a job
  const jobName = `job-${Date.now()}`;
  await createJob(jobName, assetName, outputAssetName, transformName, token);

  // Step 7: Poll the job status
  await jobStatusPolling(jobName, transformName, token);

  // Step 8: Create a streaming locator
  const streamingLocatorName = `streaming-locator-${Date.now()}`;
  await createStreamingLocator(streamingLocatorName, outputAssetName, token);

  // Step 9: List the streaming locator paths
  const paths = await listStreamingLocatorPaths(streamingLocatorName, token);

  // Step 10: Get the streaming endpoint
  const streamingEndpoint = await getStreamingEndpoint(token);
  const streamingEndpointHostName = streamingEndpoint.properties.hostName;

  // Step 11: Get the HLS path
  const hlsPath = paths.streamingPaths.find(path => path.streamingProtocol === 'Hls');
  const hlsUrl = `https://${streamingEndpointHostName}${hlsPath.paths[0]}`;

  // Step 12: Initialize the player
  initializeHlsPlayer(hlsUrl);
}

fileInputEl.addEventListener("change", onFileSelected);