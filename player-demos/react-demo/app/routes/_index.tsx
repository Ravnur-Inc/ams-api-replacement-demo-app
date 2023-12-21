import type { MetaFunction } from "@remix-run/node";
import { useEffect, useRef } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const mounted = useRef(false);

  useEffect(() => {
    import('ravnur-player-public').then((module) => {
      if (mounted.current) { return; }

      const element = document.getElementById('player');
  
      const RavnurMediaPlayer = module.default.RavnurMediaPlayer;
  
      // Object containing custom styling options (Optional)
      const styles = { /* ... */ }; // Player$Styles type
  
      // Initialize Ravnur Media Player
      const player = new RavnurMediaPlayer(element, styles);
  
      // Object containing video source information.
      const video = {
        src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        type: "application/x-mpegURL",
      };
  
      const options = {};
  
      player.setup(video, options);

      mounted.current = true;
    });

    return () => {};
  }, [mounted]);


  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div id="player" style={{ width: 640, height: 400 }}></div>
    </div>
  );
}
