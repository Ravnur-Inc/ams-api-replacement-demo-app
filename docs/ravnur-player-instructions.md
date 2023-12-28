# Ravnur Media Player Documentation

1. [Installation](#installation)
   - [Using CDN](#using-cdn)
   - [Add to Codebase](#add-to-codebase)
   - [Using private NPM registry](#using-private-npm-registry)

2. [Initialization](#initialization)

3. [Setup](#setup)

4. [Player demo page](#player-demo-page)

5. [Player Options](#player-options)

6. [Types (Flow syntax)](#types-flow-syntax)


## 1. <a id="installation"></a>Installation

### <a id="using-cdn"></a>Using CDN

Include the Ravnur Media Player script in your HTML file by adding the following CDN link in the `<head>` section:

```
<script src="https://cdn.example.com/RavnurMediaPlayer.min.js"></script>
```

### <a id="add-to-codebase"></a>Add to Codebase

Alternatively, you can include the Ravnur Media Player script to your project's codebase. Ensure that you include the script in your HTML file:

```
<script src="path/to/RavnurMediaPlayer.min.js"></script>
```

### <a id="using-private-npm-registry"></a>Using private NPM registry

You can also install Ravnur Media Player using the npm private registry. If this is the right option for you, follow the steps below:

1. Request an access token from the Ravnur administrator.
2. Generate a base64 string using the provided token.

```
NPM_TOKENB64=$(echo -n '... your token here ...' | base64)
```

3. Update your `.npmrc` file as shown below. You can leave `username` and `email` blank.

```
@ravnur:registry=https://ravnur.pkgs.visualstudio.com/Ravnur/_packaging/ravnur-npm/npm/registry/         
; begin auth token
//ravnur.pkgs.visualstudio.com/Ravnur/_packaging/ravnur-npm/npm/registry/:username=
//ravnur.pkgs.visualstudio.com/Ravnur/_packaging/ravnur-npm/npm/registry/:_password=${NPM_TOKENB64}
//ravnur.pkgs.visualstudio.com/Ravnur/_packaging/ravnur-npm/npm/registry/:email=
//ravnur.pkgs.visualstudio.com/Ravnur/_packaging/ravnur-npm/npm/:username=
//ravnur.pkgs.visualstudio.com/Ravnur/_packaging/ravnur-npm/npm/:_password=${NPM_TOKENB64}
//ravnur.pkgs.visualstudio.com/Ravnur/_packaging/ravnur-npm/npm/:email=
; end auth token
```
4. Install Ravnur Player, ensuring that you specify the correct version.

```
npm install @ravnur/player@^3.1.1
```

5. Include the player import in the file.

```
import RavnurPlayer from '@ravnur/player';
```


## 2. <a id="initialization"></a>Initialization

To use Ravnur Media Player, initiate a new instance by providing the target element and styles:

```
// Replace 'yourElementId' with the ID of the HTML element where you want the player.
const element = document.getElementById('yourElementId');

// Object containing custom styling options (Optional)
const styles = { ... }; // Player$Styles type

// Initialize Ravnur Media Player
const player = new RavnurMediaPlayer(element, styles);
```

## 3. <a id="setup"></a>Setup

After initialization, set up the player with a video source and additional options.

```
// Object containing video source information. See Main Types section below.
let video = { ... }; // Player$Source type

// Object containing player options
let options = { ... };

player.setup(video, options); 
```

## <a id="player-demo-page"></a>Player demo page

https://strmsdemo.z13.web.core.windows.net/

## <a id="player-options"></a>Player Options

| Property | Default value | Type | Description |
| :--- | :----: | :---: | :--- |
| logger | `null` | `Player$Logger` | Custom logger |
| loggerLevel | `2` | `number` | This parameter sets the severity of logs. |
| i18n |  | `Player$Translation` | Custom translations object |
| showPlay | `true` | `boolean` | Shows play button |
| showProgress | `true` | `boolean` | Shows progress bar |
| showVolume | `true` | `boolean` | Shows volume control |
| showFullScreen | `true` | `boolean` | Shows full screen button |
| showTheaterMode | `false` | `boolean` | Shows theater mode button |
| showClosedCaptions | `true` | `boolean` | Shows captions |
| showTOC | `true` | `boolean` | Shows chapters |
| showAnnotations | `true` | `boolean` | Shows annotations |
| showQuality | `true` | `boolean` | Shows quality levels |
| showAudioTracks | `true` | `boolean` | Shows audio tracks |
| showPoster | `true` | `boolean` | Shows poster image |
| showPlaceholder | `true` | `boolean` | Adds play button as overlay |
| showPlaybackRate | `true` | `boolean` | Shows playback rate option in settings |
| showForward | `true` | `boolean` | Shows 10 sec forward button |
| showBackward | `true` | `boolean` | Shows 10 sec backward button |
| showSettings | `true` | `boolean` | Shows settings button |
| showDownload | `true` | `boolean` | Shows download button |
| showTitle | `true` | `boolean` | Shows media title |
| showNextFrame | `false` | `boolean` | Shows next frame button |
| showPrevFrame | `false` | `boolean` | Shows prev frame button |
| showCCLayout | `true` | `boolean` | Enables caption layout option in CC settings |
| showPrev? | `false` | `boolean` | Shows next track button in full screen mode |
| showNext? | `false` | `boolean` | Shows prev track button in full screen mode |
| showCrawl? | `false` | `boolean` | Shows crawl text |
| crawl | `null` | `Player$CrawlOptions` | Crawl text configurations |
| isProgressLiveStream | `false` |`boolean` | If `true`, disables progressbar click event and current time indicatior |
| useMux | `false` | `boolean` | Enables MUX |
| showSubtitles | `false` | `boolean` | Disables captions build in manifest |
| isAudio | `false` | `boolean` | Turns on players audio mode |
| timecode | `0` | `number` | Sets time code value |
| frameRate | `23.976` | `number` | Sets frame rate value |
| clip | `undefined` | `[number, number]` | Plays part of the media |
| autoStart | `false` | `boolean` | Enables autoplay |
| startTime | `null` | `number`| Sets media start time |
| endTime | `null` | `number` | Sets media end time |
| useNativeControls | `false` | `boolean` | Removes all elements from the player and allows only native controls |
| useOriginTimeForPreview | `true` | `boolean` | Enables origin time frame for preview |
| playlistmode | `auto` | `Player$PlaylistMode` | Controls playlist position |
| plalistAutoGoNext | `true` | `boolean` | Plays next media when current ended |
| playlistitle | `''` | `string` | Playlist title value |
| playlistforcepoint | `0` | `number` | Minimum width in pixels. If the player is resized to a width lower than this value, the playlist mode will be changed to 'bottom'.|
| playLoop | `false` | `boolean` | Automatically starts playing from the beginning when the media has ended. |
| hideplaylist | `false` | `boolean` | Hides playlist media previews |
| showExtensions | `true` | `boolean` | Shows custom extensions |
| alwaysShowExtensions | `true` | `boolean` | Keeps showing extensions even if media is playing |
| extensionsVisibilityTimeout | `2000` ms on the desktop and `4000` ms on mobile | `number` | Hides extensions if media is playing after this time. |
| skipDelta | `10` | `number` | Value in seconds which is used for media skip forward/backward functionality |
| keyboardListeners | `{}` | `{ [keyCode]: (player) => void }` | List of key codes with custom handle functions |
| globalKeyboardListeners | `false` | `boolean` | Controls whether keyboard events are listened to globally across the entire webpage or just within the specific player element |
| isHandlingKeyboardEvents | `true` | `boolean` | Enables keyboard event handling |
| bufferingTimeout | `200` | `number` | Specifies the delay, in milliseconds, before displaying the processing spinner during buffering |
| hls | `{ maxFragLookUpTolerance: 0.001, maxMaxBufferLength: 60 }` | `Player$HlsOptions` | Hls.js options | 
| mux | `{ page_type: 'watchpage', player_name: 'RavnurPlayer', player_version: '1.0.0', video_stream_type: 'on-demand', }` | `Player$MuxOptions` | Mux options |
| isMobile | `true` on mobile devices | `boolean` | Enables mobile mode in the player |
| hlsjsURL | `https://cdn.jsdelivr.net/ hls.js/latest/hls.min.js` | `string` | URL to specific hls.js version |
| flashPath | `/` | `string` | Path to specific Flash version |
| muxURL | `https://src.litix.io/ core/2/mux.js` | `string` | Path to specific Mux version |
| savePlayTime | `false` | `boolean` | If enabled, the player will save the last watched time in the browser's local storage. This allows the player to resume playback from the saved time during the next visit. |
| aesToken | `undefined` | `string` | AES Token value |

## <a id="types-flow-syntax"></a>Types (Flow syntax)

```
type Player$LoggerFn = (...args: Array<mixed>) => void

type Player$Logger = {
   debug : Player$LoggerFn,
   log   : Player$LoggerFn,
   warn  : Player$LoggerFn,
   error : Player$LoggerFn
}

type Player$CrawlOptions = {
   text: string,
   speed: number,
   backgroundColor: string,
   textColor: string
}

type Player$PlaylistMode = 'bottom' | 'right' | 'auto';

 type Player$HlsOptions = {
   maxFragLookUpTolerance: number,
   maxMaxBufferLength: number
}

type Player$MuxOptions = {
   property_key: string,
   page_type: '' | 'watchpage' | 'iframe',
   viewer_user_id: string,
   experiment_name: string,
   sub_property_id: string,
   player_name: 'RavnurPlayer',
   player_version: string,
   player_init_time: number | null | '',
   video_id: string,
   video_title: string,
   video_series: string,
   video_producer: string,
   video_content_type: '' | 'short' | 'movie' | 'episode' | 'clip' | 'trailer' | 'event',
   video_language_code: string,
   video_variant_name: string,
   video_variant_id: string,
   video_duration: number | null | '',
   video_stream_type: 'live' | 'on-demand',
   video_encoding_variant: string,
   video_cdn: string
}

type Player$SourceStatus = 0 | 1 | 2;

type Player$TimeDataSource = {
   src: string,
   label: string,
   srclang: string,
   default?: boolean,
   type?: 'json' | 'vtt',
   state?: Player$SourceStatus
}

type Player$Source = {
   id: string;
   src: string,
   type: string,
   title: string,
   annotations?: Player$TimeDataSource[],
   chapters?: Player$TimeDataSource[],
   cc?: Player$TimeDataSource[],
   preview?: ?string,
   poster?: ?string,
   thumbnails?: ?string,
   clip?: ?[number, number] // [ 10, 300 ] sec
}

type Player$CCColor = '#F44336'
   | '#9C27B0' | '#3F51B5' | '#2196F3' | '#4CAF50'
   | '#FFEB3B' | '#FF9800' | '#795548' | '#9E9E9E' | '#FFF' | '#000'

type Player$CCFontSize = '75%' | '100%' | '125%' | '150%' | '200%'

type Player$CCFontFamily = '"Courier New", Courier, "Nimbus Mono L", "Cutive Mono", monospace'
   | '"Times New Roman", Times, Georgia, Cambria, "PT Serif Caption", serif'
   | '"Deja Vu Sans Mono", "Lucida Console", Monaco, Consolas, "PT Mono", monospace'
   | 'Roboto, "Arial Unicode Ms", Arial, Helvetica, Verdana, sans-serif'

type Player$CCLocation = 'over' | 'below'

type Player$StateCC = {
   color: Player$CCColor,
   bgcolor: Player$CCColor,
   fontSize: Player$CCFontSize,
   fontFamily: Player$CCFontFamily,
   location: Player$CCLocation,
   lang: ?string,
   sources: Player$TimeDataSource[],
   loading?: boolean,
   timedata: Player$TimeData[],
   timedataLang: string
}

type Player$StateTOC = {
   lang: ?string,
   sources: Player$TimeDataSource[],
   timedata: Player$TimeData[],
   timedataLang: string
}

type Player$State = {
   isFullScreen: boolean,
   isTheaterMode: boolean,
   cc: Player$StateCC,
   toc: Player$StateTOC
}

type Player$Styles = {
   accentColor: string,
   mainColor: string,
   submenuBgColor: string,
   submenuColor: string,
   chaptersBubbleColor: string,
   pltHeight: string,
   rplaylistHeight: string
}

 type Player$TimeData = {
   id: string,
   from: number,
   to: number,
   text: string,
   title?: ?string
}

type Player$Translation = {
   'fullscreen': string,
   'exit-fullscreen': string,
   'theater': string,
   'exit-theater': string,
   'play': string,
   'pause': string,
   'replay': string,
   'standard-playbackrate': string,
   'forward': string,
   'backward': string,
   'prevframe': string,
   'nextframe': string,
   'annotations': string,
   'quality': string,
   'audio-track': string,
   'playback-rate': string,
   'settings': string,
   'buffering': string,
   'cc': string,
   'chapters': string,
   'back': string,
   'settings-fontcolor': string,
   'settings-fontsize': string,
   'settings-fontfamily': string,
   'settings-background': string,
   'settings-captionlocations': string,
   'help': string,
   'download': string,
   'video-only': string,
   'video-and': string,
   'language': string,
   'unapproved-source': string,
   'translate': string,
   'translating': string,
   'monoserif'  : string,
   'propserif'  : string,
   'monosans'   : string,
   'propssans'  : string,
   'cc-location-over'    : string,
   'cc-location-below'   : string,
   'red'     : string,
   'purple'  : string,
   'indigo'  : string,
   'blue'    : string,
   'green'   : string,
   'yellow'  : string,
   'orange'  : string,
   'brown'   : string,
   'grey'    : string,
   'white'   : string,
   'black'   : string,
   'help-bacward'  : string,
   'help-play'     : string,
   'help-skip'     : string,
   'help-volume'   : string,
   'help-esc'      : string,
   'no-video'      : string,
   'no-flash'      : string,
   'playlist-count-of': string
}
```
