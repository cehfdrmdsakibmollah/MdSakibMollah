/**
 * A barely audible, 170ms UI chime. Runs ONLY inside a visitor's chat-open click.
 * No music asset, loop, background audio, or automatic playback.
 */
export function playChatOpenChime(): void {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return;
  let context: AudioContext | undefined;
  try {
    context = new window.AudioContext();
    const osc = context.createOscillator();
    const volume = context.createGain();
    const now = context.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.12);
    // 0.012 amplitude: intentionally much quieter than typical UI tones.
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.linearRampToValueAtTime(0.012, now + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(volume);
    volume.connect(context.destination);
    osc.onended = () => { void context?.close().catch(() => {}); };
    osc.start(now);
    osc.stop(now + 0.17);
  } catch {
    // Audio is optional and must never prevent the chat from opening.
    if (context) void context.close().catch(() => {});
  }
}
