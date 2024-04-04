import baseOptions from './examples/options.js';
import closedCaptions from './examples/closed-captions/closed-captions.js';
import chapters from './examples/chapters/chapters.js';
import annotations from './examples/annotations/annotations.js';
import crawl from './examples/crawl.js';

const mp4Video = {
  id: '1',
  title: 'MP4',
  src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  type: "video/mp4",
  poster: "https://placehold.co/600x400?text=MP4",
};

const hlsVideo = {
  id: '1',
  title: 'HLS',
  src: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
  type: "application/x-mpegURL",
  poster: "https://placehold.co/600x400?text=HLS",
  cc: closedCaptions,
  chapters: chapters,
  annotations: annotations,
};
  
const dashVideo = {
  id: '1',
  title: 'DASH',
  src: "https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd",
  type: "application/dash+xml",
  poster: "https://placehold.co/600x400?text=DASH",
  cc: closedCaptions,
  chapters: chapters,
  annotations: annotations,
};

const audio = {
  id: '1',
  title: 'Audio',
  src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  type: "audio/mp3",
  poster: "https://placehold.co/600x400?text=Audio",
};

function initializeVideoPlayer() {
  const element = document.getElementById('video');
  const player = new RavnurMediaPlayer(element);

  player.setup(mp4Video, {
    ...baseOptions,
    showCrawl: true,
    crawl: crawl,
  });
}

function initializeHlsPlayer() {
  const element = document.getElementById('hls');
  const player = new RavnurMediaPlayer(element);

  player.setup(hlsVideo, baseOptions);
}

function initializeDashPlayer() {
  const element = document.getElementById('dash');
  const player = new RavnurMediaPlayer(element);

  player.setup(dashVideo, baseOptions);
}

function initializeAudioPlayer() {
  const element = document.getElementById('audio');
  const player = new RavnurMediaPlayer(element);

  player.setup(audio, baseOptions);
}

function initializePlaylistPlayer() {
  const element = document.getElementById('playlist');
  const player = new RavnurMediaPlayer(element);

  player.setup([
    mp4Video,
    hlsVideo,
    dashVideo,
    audio,
  ], baseOptions);
}

initializeVideoPlayer();
initializeHlsPlayer();
initializeDashPlayer();
initializeAudioPlayer();
initializePlaylistPlayer();