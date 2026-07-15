import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const tracks = [
  { title: "Hari Merdeka", source: "/audio/hari-merdeka.mp3" },
  { title: "Tanah Air", source: "/audio/tanah-air.mp3" },
  { title: "Bagimu Negeri", source: "/audio/bagimu-negeri.mp3" },
];

export interface BackgroundMusicController {
  start: () => Promise<void>;
}

export const BackgroundMusic = forwardRef<BackgroundMusicController>(function BackgroundMusic(
  _,
  ref,
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const shouldPlayRef = useRef(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [activated, setActivated] = useState(false);
  const [playing, setPlaying] = useState(false);

  async function play() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      shouldPlayRef.current = true;
      setActivated(true);
      await audio.play();
      setPlaying(true);
    } catch {
      shouldPlayRef.current = false;
      setPlaying(false);
    }
  }

  useImperativeHandle(ref, () => ({ start: play }));

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.22;
  }, []);

  useEffect(() => {
    if (shouldPlayRef.current) void play();
  }, [trackIndex]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      shouldPlayRef.current = false;
      audio.pause();
      setPlaying(false);
    } else {
      void play();
    }
  }

  function nextTrack() {
    setTrackIndex((current) => (current + 1) % tracks.length);
  }

  const track = tracks[trackIndex];
  return (
    <>
      <audio
        ref={audioRef}
        src={track.source}
        preload="metadata"
        onEnded={nextTrack}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      {activated && (
        <div className="fixed right-5 bottom-5 z-[60] flex items-center gap-3 rounded-full border border-black/10 bg-white/95 py-2 pr-4 pl-2 text-ink shadow-xl backdrop-blur">
          <button
            className="grid size-12 place-items-center rounded-full bg-brand-red text-xl font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
            type="button"
            onClick={toggle}
            aria-label={playing ? "Jeda musik latar" : "Putar musik latar"}
          >
            {playing ? "Ⅱ" : "♪"}
          </button>
          <div className="max-w-36 leading-tight">
            <p className="text-xs font-bold tracking-wider text-black/45 uppercase">BGM</p>
            <p className="truncate text-sm font-bold">{track.title}</p>
          </div>
        </div>
      )}
    </>
  );
});
