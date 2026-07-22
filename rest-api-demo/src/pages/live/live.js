import {
  createLiveEvent,
  stopLiveEvent,
  getLiveEventStatus,
  startLiveEvent,
  createLiveOutput,
  deleteLiveOutput,
  getLiveEvent,
  listLiveEvents,
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
const liveSourceSelect = document.getElementById('liveSource');
const liveCCCheckbox = document.getElementById('enableLiveCC');
const liveCCLanguageSelect = document.getElementById('liveCCLanguage');
const liveCCFieldsContainer = document.getElementById('liveCCFields');
const createEventBtn = document.getElementById('createEventBtn')
const stopEventBtn = document.getElementById('stopEventBtn');
const rtspFieldsContainer = document.getElementById('rtspFields');
const newEventFieldsContainer = document.getElementById('newEventFields');
const playerLatencyWarning = document.getElementById('playerLatencyWarning');
const eventStartWarning = document.getElementById('eventStartWarning');

// Global variables
let statusPollingInterval = null;
let eventName = null;
let token = null;
let locatorName = null;

// Create live event and automatically start it (or use existing one)
async function onCreateEvent() {
  createEventBtn.disabled = true;
  createEventBtn.textContent = 'Creating...';

  const useExisting = !!liveSourceSelect.value;

  try {
    // Get authentication token
    token = await getToken();

    if (!token) {
      throw new Error('Failed to get authentication token');
    }

    if (useExisting) {
      // Use existing live event
      eventName = liveSourceSelect.value;
      log(`Using existing live event: ${eventName}`);
    } else {
      // Prepare configuration for new event
      const config = {
        eventDescription: eventDescriptionInput.value.trim(),
        encodingType: encodingTypeSelect.value,
        ingestProtocol: ingestProtocolSelect.value,
        rtspPullUrl: rtspPullUrlInput.value.trim(),
        rtspMode: rtspModeSelect.value,
        enableLowLatency: lowLatencyCheckbox.checked,
        enableLiveCC: liveCCCheckbox.checked,
        liveCCLanguage: liveCCLanguageSelect.value,
      };

      // #1 Create the live event
      eventName = eventNameInput.value.trim();
      log(`Creating live event: ${eventName}`);
      await createLiveEvent(eventName, config, token);
      log(`Live event created successfully: ${eventName}`);
    }

    // #2 Prepare required resources
    // #2.1 Create asset
    const assetName = `live-archive-${eventName}`;
    log(`Creating asset: ${assetName}`);
    const asset = await createAsset(assetName, token);

    if (!asset || !asset.name) {
      throw new Error('Failed to create asset for DVR recording');
    }

    // #2.2 Create live output
    const liveOutputName = `live-output-${eventName}`;
    await deleteLiveOutput(eventName, liveOutputName, token);
    log(`Creating live output: ${liveOutputName}`);
    await createLiveOutput(eventName, asset.name, liveOutputName, token);

    // #2.3 Create streaming locator
    locatorName = `live-locator-${eventName}`;
    log(`Creating streaming locator: ${locatorName}`);
    await createStreamingLocator(locatorName, asset.name, token);

    log('DVR setup completed successfully');

    createEventBtn.textContent = 'Starting...';

    // #3 Start the live event
    // Provisioning blocks for minutes (up to ~3.5 with live CC), so warn up front
    // rather than leaving the page looking hung.
    if (eventStartWarning) eventStartWarning.style.display = 'block';
    try {
      await startLiveEvent(eventName, token);
    } finally {
      if (eventStartWarning) eventStartWarning.style.display = 'none';
    }

    // #4 Get live event details
    log('Fetching live event details...');
    const eventDetails = await getLiveEvent(eventName, token);

    // #5 Display encoder settings
    displayIngestInformation(eventDetails);

    // #6 Start status polling and wait for streaming to start
    log('Starting status polling...');
    log('Please start streaming now using contribution feed encoder settings above.');
    // Warn that the player can take a while to appear (up to ~72s with live CC),
    // so users don't start troubleshooting a normal wait.
    if (playerLatencyWarning) playerLatencyWarning.style.display = 'block';
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
  try {
    // Stop is a long-running operation, so this waits for the event to actually reach a stopped
    // state rather than for the request to be accepted.
    await stopLiveEvent(eventName, token);
    stopEventBtn.textContent = 'Event Stopped';
    if (playerLatencyWarning) playerLatencyWarning.style.display = 'none';
    stopStatusPolling();
  } catch (error) {
    // Leave the button usable so a failed stop can be retried instead of stranding the UI.
    log(`Error: ${error.message}`);
    stopEventBtn.textContent = 'Stop Event';
    stopEventBtn.disabled = false;
  }
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
  toggleLiveSourceFields();
}

// Recompute every dependent control from the current selections. The live CC constraints
// are mutual — CC limits protocol/encoding/low latency and they limit CC — so all the
// change listeners funnel through here, otherwise the resulting state would depend on
// which control the user happened to touch.
function syncFormState() {
  // CC availability is resolved first because updateFormFieldStates reads the CC
  // checkbox: this way a selection that invalidates CC clears it before the option
  // states are derived from it.
  updateLiveCCAvailability();

  FormUtils.updateFormFieldStates(
    ingestProtocolSelect.value,
    encodingTypeSelect.value,
    { encodingTypeSelect, ingestProtocolSelect, lowLatencyCheckbox, liveCCCheckbox }
  );
}

// Toggle RTSP-specific fields based on ingest protocol
function toggleRtspFields() {
  const isRtspPull = ProtocolUtils.isRTSPPull(ingestProtocolSelect.value);
  rtspFieldsContainer.style.display = isRtspPull ? 'block' : 'none';

  syncFormState();
}

// Live CC is only available for RTMP/SRT passthrough without low latency
function updateLiveCCAvailability() {
  const isRTMP = ingestProtocolSelect.value === LiveEventIngestProtocol.RTMP;
  const isSRT = ingestProtocolSelect.value === LiveEventIngestProtocol.SRT;
  const isABR = FormUtils.isABREncoding(encodingTypeSelect.value);
  const isLowLatency = lowLatencyCheckbox.checked;
  const canEnableCC = (isRTMP || isSRT) && !isABR && !isLowLatency;

  if (!canEnableCC) {
    liveCCCheckbox.checked = false;
    liveCCFieldsContainer.style.display = 'none';
  }
  liveCCCheckbox.disabled = !canEnableCC;
}

// Toggle Live CC language fields
function toggleLiveCCFields() {
  liveCCFieldsContainer.style.display = liveCCCheckbox.checked ? 'block' : 'none';

  // Checking CC restricts protocol/encoding/low latency; unchecking restores whatever
  // the current selections allow.
  syncFormState();
}

// Toggle new event fields based on live source selection
function toggleLiveSourceFields() {
  const useExisting = !!liveSourceSelect.value;
  newEventFieldsContainer.style.display = useExisting ? 'none' : 'block';
  createEventBtn.textContent = useExisting
    ? 'Use existing live event and start streaming'
    : 'Create live event and start streaming server';
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
    // Stream is available — the wait is over, so hide the latency warning.
    if (playerLatencyWarning) playerLatencyWarning.style.display = 'none';

    const player = new Player();
    player.initialize(liveStreamUrl, { isProgressLiveStream: true, useHLSJSPlayer: true });
  }
}

// Display encoder settings
function displayIngestInformation(eventDetails) {
  IngestDisplayUtils.displayIngestInformation(eventDetails);
}

// Populate live sources dropdown from existing live events
async function populateLiveSources() {
  try {
    const authToken = await getToken();
    if (!authToken) return;

    const events = await listLiveEvents(authToken);
    if (!events?.value?.length) return;

    for (const event of events.value) {
      const option = document.createElement('option');
      option.value = event.name;
      option.textContent = event.name;
      liveSourceSelect.appendChild(option);
    }
  } catch (error) {
    log(`Could not load live sources: ${error.message}`);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeForm();

  // Form change listeners
  ingestProtocolSelect.addEventListener('change', toggleRtspFields);
  encodingTypeSelect.addEventListener('change', syncFormState);
  liveCCCheckbox.addEventListener('change', toggleLiveCCFields);
  lowLatencyCheckbox.addEventListener('change', syncFormState);
  liveSourceSelect.addEventListener('change', toggleLiveSourceFields);

  // Populate live sources
  populateLiveSources();

  // Button listeners
  createEventBtn.addEventListener('click', onCreateEvent);
  stopEventBtn.addEventListener('click', onStopEvent);
});