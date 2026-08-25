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
 * A sine tone with an optional detuned partial layered on top for a bell-like
 * timbre. `dest` lets a caller route the tone straight to the speakers or
 * into an effects bus (e.g. an echo send) instead.
 */
function tone(
  audio: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  opts: { peak?: number; partial?: boolean; partialRatio?: number; partialMix?: number } = {}
) {
  const peak = opts.peak ?? 0.2;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + Math.min(0.015, dur * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.02);

  if (opts.partial) {
    const ratio = opts.partialRatio ?? 2.4;
    const mix = opts.partialMix ?? 0.32;
    const osc2 = audio.createOscillator();
    const gain2 = audio.createGain();
    osc2.type = "sine";
    osc2.frequency.value = freq * ratio;
    gain2.gain.setValueAtTime(0, start);
    gain2.gain.linearRampToValueAtTime(peak * mix, start + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.8);
    osc2.connect(gain2);
    gain2.connect(dest);
    osc2.start(start);
    osc2.stop(start + dur + 0.02);
  }
}

/**
 * The everyday rep sound: a triangle-wave sweep up to a two-note sparkle
 * landing. Plays on a real task completion only, same rule the placard's
 * +1 flash follows: a page-arrival strike never earns a sound any more
 * than it earns a rep.
 */
export function playLevelUpSweep() {
  const audio = getContext();
  if (!audio) return;
  const start = audio.currentTime;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(300, start);
  osc.frequency.exponentialRampToValueAtTime(900, start + 0.38);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.22, start + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + 0.45);

  tone(audio, audio.destination, 1046.5, start + 0.4, 0.3, { peak: 0.18, partial: true });
  tone(audio, audio.destination, 1318.5, start + 0.46, 0.3, { peak: 0.16, partial: true });
}

/**
 * The checkpoint sound: the same five-note bell cascade from the sound
 * library, but every note is also fed into a delay/feedback loop so it
 * trails off in repeating echoes instead of stopping dead. Reserved for
 * real mission-timeline checkpoints, never the everyday rep, so the extra
 * amplification still reads as "this one's different."
 */
export function playBellCascadeEcho() {
  const audio = getContext();
  if (!audio) return;
  const start = audio.currentTime;

  const delay = audio.createDelay(1.0);
  delay.delayTime.value = 0.22;
  const feedback = audio.createGain();
  feedback.gain.value = 0.38;
  const wet = audio.createGain();
  wet.gain.value = 0.5;

  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(audio.destination);

  const notes = [523.25, 587.33, 659.25, 783.99, 880.0];
  notes.forEach((freq, i) => {
    const noteStart = start + i * 0.065;
    const dur = 0.9 - i * 0.05;
    const opts = { peak: 0.16, partial: true, partialRatio: 2.4, partialMix: 0.3 };
    tone(audio, audio.destination, freq, noteStart, dur, opts);
    tone(audio, delay, freq, noteStart, dur, opts);
  });
}
