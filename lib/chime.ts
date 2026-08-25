let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    ctx = new AudioContextClass();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/**
 * A short, synthesized three-note major arpeggio (C5, E5, G5), no audio
 * file needed. Plays on a real task completion only, the same rule the
 * placard's +1 flash already follows: an ambient page-arrival strike
 * never earns a sound any more than it earns a rep.
 */
export function playSuccessChime() {
  const audio = getContext();
  if (!audio) return;

  const notes = [523.25, 659.25, 783.99];
  const start = audio.currentTime;

  notes.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const noteStart = start + i * 0.07;
    const noteEnd = noteStart + 0.22;

    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(noteStart);
    osc.stop(noteEnd + 0.02);
  });
}
