<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RavnurMediaPlayer } from 'ravnur-player-public';

const initPlayer = () => {
    // Get the player container element
  const element = document.querySelector('#player');

  // Initialize Ravnur Media Player
  const player = new RavnurMediaPlayer(element, {});

  // Object containing video source information.
  var video = {
    src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    type: "application/x-mpegURL",
  };

  let options = {};

  player.setup(video, options);
}

onMounted(initPlayer)
</script>

<template>
  <div ref="player" id="player" ></div>
</template>


<style>
  #app {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0 auto;
  }

  #player {
    width: 640px;
    height: 400px;
  }
</style>