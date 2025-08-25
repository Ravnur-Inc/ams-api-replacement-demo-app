// DOCUMENTATION: https://github.com/Ravnur-Inc/ravplayer

import { log } from '../utils.js';

export class Player {
  constructor(containerId = 'player') {
    this.containerId = containerId;
    this.player = null;
  }

  /**
   * Initialize the player with a source
   * @param {string} source - The HLS URL
   * @param {Object} options - Player configuration options. See https://github.com/Ravnur-Inc/ravplayer/blob/main/ravnur-player-instructions.md#options
   */
  async initialize(source, options = {}) {
    if (!source) {
      log('No source provided to player');
      return false;
    }

    try {
      const element = document.getElementById(this.containerId);

      if (!element) {
        log(`Player container with ID '${this.containerId}' not found`);
        return false;
      }

      log(`Initializing player.`);

      // Create player instance
      this.player = new RavnurMediaPlayer(element);

      // Setup the player
      const sourceConfig = {
        src: source,
        type: 'application/x-mpegURL'
      };

      this.player.setup(sourceConfig, options);

      // Show the player container
      const containerElement = document.getElementById('playerContainer');
  
      if (containerElement) {
        containerElement.style.display = 'block';
      }

      log('Player initialized successfully.');
      return true;

    } catch (error) {
      log(`Player initialization failed: ${error.message}`);
      return false;
    }
  }
}
