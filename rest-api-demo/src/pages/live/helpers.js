import { LiveEventIngestProtocol } from '../../actions/event.js';
import { log } from '../../utils.js';

/**
 * Protocol detection utilities
 */
export const ProtocolUtils = {
  isRTMP: (protocol) => protocol === LiveEventIngestProtocol.RTMP,
  isSRT: (protocol) => protocol === LiveEventIngestProtocol.SRT,
  isRTSPPull: (protocol) => protocol === LiveEventIngestProtocol.RTSPPull,
  isRTSPPush: (protocol) => protocol === LiveEventIngestProtocol.RTSPPush,
  isRTSP: (protocol) => ProtocolUtils.isRTSPPull(protocol) || ProtocolUtils.isRTSPPush(protocol)
};

/**
 * SRT URL construction utilities
 */
export const SRTUtils = {
  /**
   * Constructs SRT URL with query parameters matching Vue component logic
   * @param {string} baseUrl - Base SRT URL
   * @param {string} streamId - Stream ID (access token)
   * @param {string} passphrase - SRT passphrase
   * @param {string|number} latency - SRT latency in ms
   * @param {string|number} maxBandwidth - Max bandwidth
   * @returns {string} Complete SRT URL with parameters
   */
  constructUrl: (baseUrl, streamId, passphrase, latency, maxBandwidth) => {
    if (!baseUrl) return 'Not available';
    
    const params = new URLSearchParams();
    
    if (streamId) params.set('streamid', streamId);
    if (passphrase) {
      params.set('passphrase', passphrase);
      params.set('pbkeylen', '16');
    }
    
    params.set('mode', 'caller');
    
    if (latency) params.set('latency', String(latency));
    
    return `${baseUrl}?${params.toString()}`;
  },

  /**
   * Extracts SRT parameters from event details
   * @param {Object} eventDetails - Live event details
   * @returns {Object} SRT parameters
   */
  extractParameters: (eventDetails) => {
    const endpoints = eventDetails.properties?.input?.endpoints || [];
    return {
      baseUrl: endpoints[0]?.url || '',
      streamId: eventDetails.properties?.input?.accessToken || '',
      passphrase: eventDetails.properties?.input?.srtPassphrase || '',
      latency: eventDetails.properties?.input?.srtLatency || '',
      maxBandwidth: eventDetails.properties?.input?.srtMaxBW || ''
    };
  }
};

/**
 * DOM utilities for managing ingest information display
 */
export const DOMUtils = {
  /**
   * Gets all ingest-related DOM elements
   * @returns {Object} DOM elements
   */
  getIngestElements: () => ({
    // Standard ingest info
    ingestInfoBox: document.getElementById('ingestInfo'),
    rtmpUrlInput: document.getElementById('rtmpUrl'),
    rtmpsUrlInput: document.getElementById('rtmpsUrl'),
    streamKeyInput: document.getElementById('streamKey'),

    // RTSP-specific elements
    rtspIngestInfoBox: document.getElementById('rtspIngestInfo'),
    rtspIngestUrlInput: document.getElementById('rtspIngestUrl'),
    
    // SRT-specific elements
    srtIngestInfoBox: document.getElementById('srtIngestInfo'),
    srtUrlInput: document.getElementById('srtUrl')
  }),

  /**
   * Shows/hides elements based on visibility
   * @param {HTMLElement} element - Element to show/hide
   * @param {boolean} visible - Whether to show the element
   */
  toggleVisibility: (element, visible) => {
    if (element) {
      element.style.display = visible ? 'block' : 'none';
    }
  },

  /**
   * Sets input value safely
   * @param {HTMLElement} input - Input element
   * @param {string} value - Value to set
   * @param {string} fallback - Fallback value if main value is empty
   */
  setInputValue: (input, value, fallback = 'Not available') => {
    if (input) {
      input.value = value || fallback;
    }
  }
};

/**
 * Ingest information display utilities
 */
export const IngestDisplayUtils = {
  /**
   * Displays RTMP/RTSP ingest information
   * @param {Object} eventDetails - Live event details
   * @param {Object} elements - DOM elements
   */
  displayRTMPInfo: (eventDetails) => {
    const elements = DOMUtils.getIngestElements();
    const endpoints = eventDetails.properties?.input?.endpoints || [];
    const streamKey = eventDetails.properties?.input?.accessToken || '';
    
    // Find RTMP and RTMPS URLs
    const rtmpEndpoint = endpoints[0];
    const rtmpsEndpoint = endpoints[1];
    
    // Populate the display
    DOMUtils.setInputValue(elements.rtmpUrlInput, rtmpEndpoint?.url);
    DOMUtils.setInputValue(elements.rtmpsUrlInput, rtmpsEndpoint?.url);
    DOMUtils.setInputValue(elements.streamKeyInput, streamKey);
    
    // Show RTMP info, hide SRT info
    DOMUtils.toggleVisibility(elements.ingestInfoBox, true);
    DOMUtils.toggleVisibility(elements.srtIngestInfoBox, false);
    
    // Log information
    log('RTMP/RTSP ingest information:');
    log('Ingest URL (RTMP): ' + (rtmpEndpoint?.url || 'Not available'));
    log('Ingest URL (RTMPS): ' + (rtmpsEndpoint?.url || 'Not available'));
    log('Stream Key: ' + (streamKey || 'Not available'));
  },

  /**
   * Displays RTSP ingest information
   * @param {Object} eventDetails - Live event details
   * @param {Object} elements - DOM elements
   */
  displayRTSPIngestInfo: (eventDetails) => {
    const elements = DOMUtils.getIngestElements();
    const endpoints = eventDetails.properties?.input?.endpoints || [];
    const ingestUrl = endpoints[0]?.url || '';
    DOMUtils.setInputValue(elements.rtspIngestUrlInput, ingestUrl);
    DOMUtils.toggleVisibility(elements.rtspIngestInfoBox, true);
    DOMUtils.toggleVisibility(elements.ingestInfoBox, false);
    DOMUtils.toggleVisibility(elements.srtIngestInfoBox, false);

    log('RTSP ingest information:');
    log('Ingest URL: ' + (ingestUrl || 'Not available'));
  },

  /**
   * Displays SRT ingest information
   * @param {Object} eventDetails - Live event details
   * @param {Object} elements - DOM elements
   */
  displaySRTInfo: (eventDetails) => {
    const elements = DOMUtils.getIngestElements();
    const srtParams = SRTUtils.extractParameters(eventDetails);
    const srtUrl = SRTUtils.constructUrl(
      srtParams.baseUrl,
      srtParams.streamId,
      srtParams.passphrase,
      srtParams.latency,
      srtParams.maxBandwidth
    );
    
    // Populate SRT URL field
    DOMUtils.setInputValue(elements.srtUrlInput, srtUrl);
    
    // Show SRT info, hide RTMP info
    DOMUtils.toggleVisibility(elements.srtIngestInfoBox, true);
    DOMUtils.toggleVisibility(elements.ingestInfoBox, false);
    
    // Log SRT information
    log('SRT ingest information:');
    log('SRT URL: ' + srtUrl);
  },

  /**
   * Main function to display ingest information based on protocol
   * @param {string} protocol - Ingest protocol
   * @param {Object} eventDetails - Live event details
   */
  displayIngestInformation: (eventDetails) => {
    const protocol = eventDetails.properties?.input?.streamingProtocol;
    
    if (ProtocolUtils.isSRT(protocol)) {
      IngestDisplayUtils.displaySRTInfo(eventDetails);
    } else if (ProtocolUtils.isRTSPPull(protocol) || ProtocolUtils.isRTSPPush(protocol)) {
      IngestDisplayUtils.displayRTSPIngestInfo(eventDetails);
    } else {
      IngestDisplayUtils.displayRTMPInfo(eventDetails);
    }
  }
};

/**
 * Form validation utilities
 */
export const FormUtils = {
  /**
   * Checks if encoding type is ABR (Adaptive Bitrate)
   * @param {string} encodingType - Encoding type
   * @returns {boolean} True if ABR encoding
   */
  isABREncoding: (encodingType) => {
    return ['Standard', 'Premium1080P'].includes(encodingType);
  },

  /**
   * Updates form field states based on protocol selection
   * @param {string} protocol - Selected protocol
   * @param {string} encodingType - Selected encoding type
   * @param {Object} formElements - Form DOM elements
   */
  updateFormFieldStates: (protocol, encodingType, formElements) => {
    const isRtsp = ProtocolUtils.isRTSP(protocol);
    const isABR = FormUtils.isABREncoding(encodingType);
    
    // Update encoding type options
    const standardOption = formElements.encodingTypeSelect?.querySelector('option[value="Standard"]');
    const premiumOption = formElements.encodingTypeSelect?.querySelector('option[value="Premium1080P"]');
    
    if (standardOption) standardOption.disabled = isRtsp;
    if (premiumOption) premiumOption.disabled = isRtsp;
    
    // Update low latency availability
    const shouldDisableLowLatency = isRtsp || isABR;
    if (formElements.lowLatencyCheckbox) {
      formElements.lowLatencyCheckbox.disabled = shouldDisableLowLatency;
      if (shouldDisableLowLatency) {
        formElements.lowLatencyCheckbox.checked = false;
      }
    }
  }
};
