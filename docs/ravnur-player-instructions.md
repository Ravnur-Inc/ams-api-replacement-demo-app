# Ravnur Media Player Documentation

## 1. Installation

### Using CDN

Include the Ravnur Media Player script in your HTML file by adding the following CDN link in the `<head>` section:

```
<script src="https://cdn.example.com/RavnurMediaPlayer.min.js"></script>
```

### Add to Codebase

Alternatively, you can include the Ravnur Media Player script to your project's codebase. Ensure that you include the script in your HTML file:

```
<script src="path/to/RavnurMediaPlayer.min.js"></script>
```

## 2. Initialization

To use Ravnur Media Player, initiate a new instance by providing the target element and styles:

```
// Replace 'yourElementId' with the ID of the HTML element where you want the player.
const element = document.getElementById('yourElementId');

// Object containing custom styling options (Optional)
const styles = { ... }; // Player$Styles type

// Initialize Ravnur Media Player
const player = new RavnurMediaPlayer(element, styles);
```

## 3. Setup

After initialization, set up the player with a video source and additional options.

```
// Object containing video source information. See Main Types section below.
let video = { ... }; // Player$Source type

// Object containing player options
let options = { ... };

player.setup(video, options); 
```

## Main types reference

```
type Player$Styles = {
   accentColor: string,
   mainColor: string,
   submenuBgColor: string,
   submenuColor: string,
   chaptersBubbleColor: string,
   pltHeight: string,
   rplaylistHeight: string
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
```

## Player demo page

https://strmsdemo.z13.web.core.windows.net/
