import { Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RavnurMediaPlayer } from 'ravnur-player-public';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'angular-demo';

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    // Get the player container element
    const element = this.elementRef.nativeElement.querySelector('#player');

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
}
