import {
  createLiveEvent,
  stopLiveEvent,
  getLiveEventStatus,
  startLiveEvent,
  createLiveOutput,
  getLiveEvent,
  LiveEventIngestProtocol,
  LiveEventRtspMode,
  LiveEventEncodingType
} from '../../actions/event.js';
import { log } from '../../utils.js';
import getToken from '../../actions/getToken.js';
import { createAsset } from '../../actions/assets.js';
import { createStreamingLocator, listStreamingLocatorPaths } from '../../actions/streamingLocators.js';
import { Player } from '../../actions/player.js';
import {
  ProtocolUtils,
  IngestDisplayUtils,
  FormUtils
} from './helpers.js';
import { getStreamingEndpoint } from '../../actions/streamingEndpoints.js';

// Form elements
const eventNameInput = document.getElementById('eventName');
const eventDescriptionInput = document.getElementById('eventDescription');
const encodingTypeSelect = document.getElementById('encodingType');
const ingestProtocolSelect = document.getElementById('ingestProtocol');
const rtspPullUrlInput = document.getElementById('rtspPullUrl');
const rtspModeSelect = document.getElementById('rtspMode');
const lowLatencyCheckbox = document.getElementById('enableLowLatency');
const createEventBtn = document.getElementById('createEventBtn')
const stopEventBtn = document.getElementById('stopEventBtn');
const rtspFieldsContainer = document.getElementById('rtspFields');

// Global variables
let statusPollingInterval = null;
let eventName = null;
let token = null;
let locatorName = null;

// Create live event and automatically start it
async function onCreateEvent() {
  createEventBtn.disabled = true;
  createEventBtn.textContent = 'Creating...';

  try {
    // Get authentication token
    token = await getToken();

    if (!token) {
      throw new Error('Failed to get authentication token');
    }

    // Prepare configuration
    const config = {
      eventDescription: eventDescriptionInput.value.trim(),
      encodingType: encodingTypeSelect.value,
      ingestProtocol: ingestProtocolSelect.value,
      rtspPullUrl: rtspPullUrlInput.value.trim(),
      rtspMode: rtspModeSelect.value,
      enableLowLatency: lowLatencyCheckbox.checked
    };

    // #1 Create the live event
    eventName = eventNameInput.value.trim();
    log(`Creating live event: ${eventName}`);
    const liveEvent = await createLiveEvent(eventName, config, token);

    log(`Live event created successfully: ${eventName}`);

    // #2 Prepare required resources
    // #2.1 Create asset
    const assetName = `live-archive-${eventName}}`;
    log(`Creating asset: ${assetName}`);
    const asset = await createAsset(assetName, token);

    if (!asset || !asset.name) {
      throw new Error('Failed to create asset for DVR recording');
    }

    // #2.2 Create live output
    const liveOutputName = `live-output-${eventName}`;
    log(`Creating live output: ${liveOutputName}`);
    await createLiveOutput(eventName, asset.name, liveOutputName, token);

    // #2.3 Create streaming locator
    locatorName = `live-locator-${eventName}`;
    log(`Creating streaming locator: ${locatorName}`);
    await createStreamingLocator(locatorName, asset.name, token);

    log('DVR setup completed successfully');

    createEventBtn.textContent = 'Starting...';

    // #3 Start the live event
    await startLiveEvent(eventName, token);

    // #4 Get live event details
    log('Fetching live event details...');
    const eventDetails = await getLiveEvent(eventName, token);

    // #5 Display encoder settings
    displayIngestInformation(eventDetails);

    // #5 Start status polling and wait for streaming to start
    log('Starting status polling...');
    log('Please start streaming now using contribution feed encoder settings above.');
    startStatusPolling(eventName, token);
    
    createEventBtn.style.display = 'none';
    stopEventBtn.style.display = 'block';
  } catch (error) {
    log(`Error: ${error.message}`);
  }
}

async function onStopEvent() {
  stopEventBtn.disabled = true;
  stopEventBtn.textContent = 'Stopping...';
  await stopLiveEvent(eventName, token);
  stopEventBtn.textContent = 'Event Stopped';
  stopStatusPolling();
}

// Initialize the form
function initializeForm() {
  eventNameInput.value = `live-event-${Date.now()}`;

  // Set default values
  encodingTypeSelect.value = LiveEventEncodingType.PassthroughStandard;
  ingestProtocolSelect.value = LiveEventIngestProtocol.RTMP;
  rtspModeSelect.value = LiveEventRtspMode.TCPPreferred;

  // Hide RTSP fields initially
  toggleRtspFields();
}

// Toggle RTSP-specific fields based on ingest protocol
function toggleRtspFields() {
  const isRtspPull = ProtocolUtils.isRTSPPull(ingestProtocolSelect.value);
  rtspFieldsContainer.style.display = isRtspPull ? 'block' : 'none';

  // Update form field states based on protocol
  FormUtils.updateFormFieldStates(
    ingestProtocolSelect.value,
    encodingTypeSelect.value,
    { encodingTypeSelect, lowLatencyCheckbox }
  );
}

// Update encoding type options and low latency availability
function updateLowLatencyAvailability() {
  FormUtils.updateFormFieldStates(
    ingestProtocolSelect.value,
    encodingTypeSelect.value,
    { encodingTypeSelect, lowLatencyCheckbox }
  );
}

// Start status polling
function startStatusPolling(eventName, token) {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
  }

  statusPollingInterval = setInterval(async () => {
    try {
      const status = await getLiveEventStatus(eventName, token);

      const isPlayable = status.healthDescriptions
        && status.healthDescriptions.length > 0
        && !status.healthDescriptions.includes('Live manifest is not available.')
        && status.state === 'Running';

      // Check if healthDescriptions has value (streaming is healthy)
      if (isPlayable) {
        log('Streaming is healthy');
        stopStatusPolling();
        
        // Get and log streaming URLs
        await getStreamingUrls();
        return;
      }
    } catch (error) {
      log(`Status polling error: ${error.message}`);
    }
  }, 5000); // Poll every 5 seconds
}

// Stop status polling
function stopStatusPolling() {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
    statusPollingInterval = null;
    log('Status polling stopped');
  }
}

// Get streaming URLs and display them in the UI
async function getStreamingUrls() {
  if (!locatorName || !token) {
    log('No locator name available or token missing');
    return;
  }

  try {
    log('Fetching streaming URLs...');
    // Get the streaming endpoint
    const streamingEndpoint = await getStreamingEndpoint(token);
    const streamingEndpointHostName = streamingEndpoint.properties.hostName;
    const streamingPaths = await listStreamingLocatorPaths(locatorName, token);
    
    if (!streamingPaths?.streamingPaths?.length) {
      log('No streaming paths found');
      return;
    }

    // Find HLS path
    const hlsPath = streamingPaths.streamingPaths.find(path => path.streamingProtocol === 'Hls');
    
    if (hlsPath && hlsPath.paths && hlsPath.paths.length > 0) {
      const streamingUrl = `https://${streamingEndpointHostName}${hlsPath.paths[0]}`;
  
      showUrlsAndLoadPlayer(streamingUrl);
    } else {
      log('No HLS streaming path found');
    }
  } catch (error) {
    log(`Error fetching streaming URLs: ${error.message}`);
  }
}

// Display streaming URLs in the UI and initialize player
function showUrlsAndLoadPlayer(liveStreamUrl) {
  const streamingUrlsBox = document.getElementById('streamingUrlsInfo');
  const liveStreamUrlGroup = document.getElementById('liveStreamUrlGroup');
  const liveStreamUrlInput = document.getElementById('liveStreamUrl');

  // Show the streaming URLs box
  streamingUrlsBox.style.display = 'block';

  // Always show live stream URL
  if (liveStreamUrl) {
    liveStreamUrlInput.value = liveStreamUrl;
    liveStreamUrlGroup.style.display = 'block';
  }

  // Initialize player with the live stream URL
  if (liveStreamUrl) {
    const player = new Player();
    player.initialize(liveStreamUrl, { isProgressLiveStream: true, useHLSJSPlayer: true });
  }
}

// Display encoder settings
function displayIngestInformation(eventDetails) {
  IngestDisplayUtils.displayIngestInformation(eventDetails);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeForm();

  // Form change listeners
  ingestProtocolSelect.addEventListener('change', toggleRtspFields);
  encodingTypeSelect.addEventListener('change', updateLowLatencyAvailability);

  // Button listeners
  createEventBtn.addEventListener('click', onCreateEvent);
  stopEventBtn.addEventListener('click', onStopEvent);
});