import i18nFullExample from "./i18n.js";
import loggerExample from "./logger.js";
import crawlExample from "./crawl.js";

export default {
  logger: loggerExample,
  i18n: i18nFullExample,
  crawl: crawlExample,

  // Enabled by default
  showPlay: true,
  showProgress: true,
  showAudioTracks: false,
  showPoster: true,
  showPlaceholder: true,
  showForward: true,
  showBackward: true,
  showSettings: true,
  showDownload: true,
  isHandlingKeyboardEvents: true,
  useOriginTimeForPreview: true,
  showExtensions: true,
  disableAutoFullScreenOnIOS: false,
  
  showPlaybackRate: true, // disabled on Android devices
  
  showFullScreen: true, // disabled for audio
  showClosedCaptions: true, // disabled for audio
  showTOC: true, // disabled for audio
  showAnnotations: true, // disabled for audio
  
  showVolume: true, // disabled on mobile devices
  showQuality: true, // disabled on mobile devices and for audio
  showTitle: true, // disabled on mobile devices
  showCCLayout: true, // disabled on mobile devices
  
  // Disabled by default
  showNextFrame: false,
  isProgressLiveStream: false,
  showPrevFrame: false,
  showPrev: false,
  showNext: false,
  showCrawl: false,
  showDownloadCC: false,
  showBottomNext: false,
  showBottomPrev: false,
  showCaptionSearch: false,
  showTheaterMode: false,
  showSubtitles: false,
  globalKeyboardListeners: false,
  useNativeControls: false,
  plalistAutoGoNext: true,
  playLoop: false,
  hideplaylist: false,
  alwaysShowExtensions: false,
  savePlayTime: false,
  isAudio: false, // true for audio-only content
  isMobile: false, // true on mobile devices

  timecode: 0,
  frameRate: 23.976,
  loggerLevel: 2,
  playlistmode: 'auto', // 'auto', 'bottom', 'right'
  playlistforcepoint: 0,
  extensionsVisibilityTimeout: 2000, // 4000 on mobile devices
  skipDelta: 10,
  keyboardListeners: {},
  bufferingTimeout: 200,
  
  // clip: [0, 20], // [start, end]
  // autoStart: true,
  // startTime: 0,
  // endTime: 0,
  // playbackRates: [0.5, 0.8, 1, 1.5, 2, 3, 5],
  // playlistitle: '',
  // aesToken: '',
  
  // DRM
  // fairplayURL: '',
  // fairplayCertificateUrl: '',
  // widevineURL: '',
  // playreadyURL: '',
}