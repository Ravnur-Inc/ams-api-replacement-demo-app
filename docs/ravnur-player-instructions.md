# Ravnur Media Player Documentation

1. [Installation](#installation)
   - [Using CDN](#using-cdn)
   - [Add to Codebase](#add-to-codebase)
   - [Using private NPM registry](#using-private-npm-registry)

2. [Initialization](#initialization)

3. [Setup](#setup)

4. [Demo page](#player-demo-page)

5. [Options](#player-options)

6. [Events](#player-events)

7. [Emits](#player-emits)

8. [Methods](#player-methods)

7. [Types (Flow syntax)](#types-flow-syntax)


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

## <a id="player-demo-page"></a>Demo page

https://strmsdemo.z13.web.core.windows.net/

## <a id="player-options"></a>Options

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
| playbackRates | `[0.5, 0.8, 1, 1.5, 2, 3, 5]` | Array of numbers | Custom playback rate options: an array of numbers from 0.01 to 5. For example, `[0.25, 0.50, 1, 1.75]`. Option 1 is always present as "Standard", and option 5 is hidden for audio-only media.|

## <a id="player-events"></a>Events

You can listen to player events using the `player.on()` method. Additionally, the player supports all HTMLMediaElement events. For details, refer to the MDN documentation: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement


| Name | Data | Description |
| :--- | :----: | :--- |
|audiotrackswitched| `null` | Triggered when the player changes audio tracks |
|handle-play-clicked|`null`|Triggered when the play button is clicked|
|theaterchanging|`null`|Triggered when theater mode is changed|
|fullscreenchanging|`boolean`|Triggered when full-screen mode changes|
|toclang|`string`|Triggered when cue points language changes|
|cclang|`string`|Triggered when captions language changes|
|annotationslang|`string`|Triggered when annotations language changes|
|qualitychange|`string`|Triggered when the quality level changes|
|resizeplayer| `{ width, height, outerWidth }` |Triggered when the player size changes|
|prevtrack|`null`|Triggered when switching to the previous track in the playlist|
|nexttrack|`null`|Triggered when switching to the next track in the playlist|
|mobiletouch|`null`|Triggered on mobile touch events|
|downloadRequested|`string`|Triggered when someone requests media download, returns download URL|
|statechanged|`Player$State`|Triggered when the player state changes|
|cclayoutchange|`{ mode, fontSize }`|Triggered when closed captions layout changes|
|captionschange|`Player$TimeDataSource`|Triggered when captions change|
|changeplaylistmode|`bottom` \| `right`|Triggered when the player playlist mode changes|
|changesource|`Player$Source`|Triggered when the current media source changes|


## <a id="player-emits"></a>Emits

You have the option to manually trigger these events. For instance, you can use the following example: `player.bus.emit('fullscreenchanging', false);`

| Name | Payload | Description |
| :--- | :----: | :--- |
|fullscreenchanging|`boolean`|Alters full-screen mode|
|toclang|`string`|Modifies language for cue points|
|cclang|`string`|Modifies language for captions|
|annotationslang|`string`|Modifies language for annotations|
|prevtrack|`null`|Switches to the previous media in the playlist|
|nexttrack|`null`|Switches to the next media in the playlist|
|changeplaylistmode|`bottom` \| `right`|Changes the player's playlist mode|
|changesource|`Player$Source`|Changes the current media source|

## <a id="player-methods"></a>Methods

Example of usage: `player.controller.getCurrentTime();`.

| Method | Payload | Return | Description |
| :--- | :----: | :----: | :--- |
|getCurrentTime| - | `number` | Retrieves the current time of the media in seconds|
|setCurrentTime| `number` | - | Sets the player's playback time|
|isPaused| - | `boolean` | Checks if the media is currently paused|
|isEnded| - | `boolean` | Checks if the media has reached the end|
|isMuted| - | - | Checks if the player is currently muted|
|play| - | `Promise` | Initiates playback of the media. Returns a `Promise` resolved when playback begins|
|pause| - | - | Pauses the current playback|
|prevFrame| - | - | Steps to the previous frame in the media|
|nextFrame| - | - | Steps to the next frame in the media|
|getDuration| - | `number` | Retrieves the duration of the media in seconds|
|setMuted| `boolean` | - | Adjusts the muted state of the player|
|getVolume| - | `number` | Retrieves the current volume level|
|setVolume| `number` | - | Sets the volume level of the player|
|getLevels| - | Array of objects | Retrieves the available quality levels|
|getLevel| - | Object | Retrieves the current quality level|
|setLevel| Object | - | Sets the quality level of the media|
|isMultiQuality| - | `boolean` | Checks if the media has multiple quality options|
|isMultiAudioTracks| - | `boolean` | Checks if the media has multiple audio tracks|
|getAudioTracks| - | Array of objects | Retrieves the available audio tracks|
|getAudioTrack| - | `number` | Retrieves the index of the current audio track|
|setAudioTrack| `number` | - | Sets the current audio track by index|
|load| `Player$Source` | - | Loads a new media source|
|getBufferedPercent| - | `number` | Retrieves the current buffered percentage|
|getElement| - | HTML element | Retrieves the player element|
|_getFrameDuration| - | `number` | Retrieves the current frame duration|
|refreshCrawlExtension|`crawl: Player$CrawlOptions, visibility: boolean`||Refreshes crawl options in the player|
|setPlaybackRate|`number`||Sets the current playback rate|


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