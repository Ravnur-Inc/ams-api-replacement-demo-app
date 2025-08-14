export function initializeHlsPlayer(hlsSource) {
  const element = document.getElementById('player');
  const player = new RavnurMediaPlayer(element);

  player.setup({ src: hlsSource, type: 'application/x-mpegURL' }, {});
}