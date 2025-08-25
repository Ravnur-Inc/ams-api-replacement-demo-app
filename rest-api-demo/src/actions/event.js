import { log } from "../utils.js";

export const LiveEventIngestProtocol = {
  RTMP: 'RTMP',
  SRT: 'SRT',
  RTSPPull: 'RTSPPull',
  RTSPPush: 'RTSPPush',
};

export const LiveEventRtspMode = {
  TCPPreferred: 'tcp_udp',
  RTSPOverHTTP: 'rtsp_http',
  TCPOnly: 'tcp',
  UDPOnly: 'udp',
};

export const LiveEventEncodingType = {
  PassthroughStandard: 'PassthroughStandard',
  Standard: 'Standard',
  Premium1080P: 'Premium1080P',
};

export const LiveEventStreamOptions = {
  LowLatency: 'LowLatency',
};

/**
 * Creates a live event with the specified configuration
 * @param {string} eventName - The name of the live event
 * @param {Object} config - The live event configuration
 * @param {string} config.eventDescription - Description of the event
 * @param {string} config.encodingType - Encoding type (PassthroughStandard, Standard, Premium1080P)
 * @param {string} config.ingestProtocol - Ingest protocol (RTMP, SRT, RTSPPull, RTSPPush)
 * @param {string} config.rtspPullUrl - RTSP Pull URL (required if ingestProtocol is RTSPPull)
 * @param {string} config.rtspMode - RTSP mode (required if ingestProtocol is RTSPPull)
 * @param {boolean} config.enableLowLatency - Enable low latency streaming
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} The created live event
 */
export async function createLiveEvent(eventName, config, token) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2023-01-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/liveEvents/${eventName}?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Build the request body similar to the Vue component
  const isRtspPull = config.ingestProtocol === LiveEventIngestProtocol.RTSPPull;
  const isLowLatency = config.enableLowLatency;

  const requestBody = {
    tags: {
      ...(isRtspPull && {
        'IngestOptions.RtspPullUrl': config.rtspPullUrl,
        'IngestOptions.RtspPullMode': config.rtspMode
      })
    },
    location: 'West Europe',
    properties: {
      description: config.eventDescription || '',
      input: {
        streamingProtocol: config.ingestProtocol,
        accessControl: {
          ip: {
            allow: []
          }
        },
        keyFrameIntervalDuration: 'PT2S',
        ...(isRtspPull && {
          rtspPullMode: config.rtspMode,
        })
      },
      encoding: {
        encodingType: config.encodingType,
      },
      streamOptions: isLowLatency ? [LiveEventStreamOptions.LowLatency] : []
    }
  };

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    const liveEvent = await response.json();
    return liveEvent;
  } catch (error) {
    log(`Live event creation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Gets basic information about a live event
 * @param {string} eventName - The name of the live event
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} The live event basic info
 */
export async function getLiveEvent(eventName, token) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2023-01-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/liveEvents/${eventName}?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to ping live event: ${response.status} ${response.statusText}`);
    }

    const eventInfo = await response.json();
    return eventInfo;
  } catch (error) {
    log(`Failed to ping live event: ${error.message}`);
    throw error;
  }
}

/**
 * Gets the detailed status of a live event (only when running)
 * @param {string} eventName - The name of the live event
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} The live event status
 */
export async function getLiveEventStatus(eventName, token) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2023-01-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/liveEvents/${eventName}/getStatus?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to get live event status: ${response.status} ${response.statusText}`);
    }

    const status = await response.json();
    return status.value[0];
  } catch (error) {
    log(`Failed to get live event status: ${error.message}`);
    throw error;
  }
}

/**
 * Starts a live event
 * @param {string} eventName - The name of the live event
 * @param {string} token - Authentication token
 * @returns {Promise<void>}
 */
export async function startLiveEvent(eventName, token) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2023-01-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/liveEvents/${eventName}/start?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    log(`Starting live event: ${eventName}`);

    const response = await fetch(url, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to start live event: ${response.status} ${response.statusText}`);
    }

    log(`Live event started successfully: ${eventName}`);
  } catch (error) {
    log(`Failed to start live event: ${error.message}`);
    throw error;
  }
}

/**
 * Stops a live event
 * @param {string} eventName - The name of the live event
 * @param {string} token - Authentication token
 * @returns {Promise<void>}
 */
export async function stopLiveEvent(eventName, token) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2023-01-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/liveEvents/${eventName}/stop?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    log(`Stopping live event: ${eventName}`);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        removeOutputsOnStop: true
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to stop live event: ${response.status} ${response.statusText}`);
    }

    log(`Live event stopped successfully: ${eventName}`);
  } catch (error) {
    log(`Failed to stop live event: ${error.message}`);
    throw error;
  }
}

/**
 * Creates a live output
 * @param {string} eventName - The name of the live event
 * @param {string} assetName - The asset name to store the recording
 * @param {string} liveOutputName - The name of the live output
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} The created live output
 */
export async function createLiveOutput(eventName, assetName, liveOutputName, token) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2022-08-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/liveEvents/${eventName}/liveOutputs/${liveOutputName}?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const requestBody = {
    properties: {
      assetName: assetName,
      archiveWindowLength: 'PT2H',
      manifestName: 'output'
    }
  };

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    const liveOutput = await response.json();
    log(`Live output created successfully: ${liveOutput.name}`);
    return liveOutput;
  } catch (error) {
    log(`Live output creation failed: ${error.message}`);
    throw error;
  }
}
