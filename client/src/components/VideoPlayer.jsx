import { useEffect, useRef } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

export default function VideoPlayer() {
  const videoRef = useRef(null);

  useEffect(() => {
    const player = new Plyr(videoRef.current, {
      controls: [
        "play",
        "progress",
        "current-time",
        "mute",
        "volume",
        "fullscreen",
      ],
    });

    return () => {
      player.destroy();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="plyr-react plyr"
      controls
      playsInline
    >
      <source src="/loading.mp4" type="video/mp4" />
    </video>
  );
}
