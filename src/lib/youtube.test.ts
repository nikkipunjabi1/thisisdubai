import { describe, it, expect } from 'vitest';
import { parseYouTubeId, youTubeEmbedUrl, youTubeThumb } from './youtube';

describe('parseYouTubeId', () => {
  it('accepts a bare 11-char id', () => {
    expect(parseYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts the id from common URL forms', () => {
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for empty or invalid input', () => {
    expect(parseYouTubeId('')).toBeNull();
    expect(parseYouTubeId(null)).toBeNull();
    expect(parseYouTubeId('not a video')).toBeNull();
  });
});

describe('youTubeEmbedUrl', () => {
  it('always uses the nocookie host and hides related videos by default', () => {
    const url = youTubeEmbedUrl('abc12345678');
    expect(url.startsWith('https://www.youtube-nocookie.com/embed/abc12345678?')).toBe(true);
    expect(url).toContain('rel=0');
  });

  it('forces mute when autoplay is on (browsers block unmuted autoplay)', () => {
    const url = youTubeEmbedUrl('abc12345678', { autoplay: true });
    expect(url).toContain('autoplay=1');
    expect(url).toContain('mute=1');
  });

  it('loops a single video via the playlist quirk', () => {
    const url = youTubeEmbedUrl('abc12345678', { loop: true });
    expect(url).toContain('loop=1');
    expect(url).toContain('playlist=abc12345678');
  });

  it('honours a start time and a broader-suggestions opt-out', () => {
    const url = youTubeEmbedUrl('abc12345678', { start: 42.9, hideRelated: false });
    expect(url).toContain('start=42');
    expect(url).toContain('rel=1');
  });

  it('background mode is chromeless, muted, autoplaying and looping regardless of other flags', () => {
    const url = youTubeEmbedUrl('abc12345678', { background: true, controls: true, mute: false });
    expect(url).toContain('autoplay=1');
    expect(url).toContain('mute=1');
    expect(url).toContain('loop=1');
    expect(url).toContain('controls=0');
  });
});

describe('youTubeThumb', () => {
  it('builds a cookieless poster URL', () => {
    expect(youTubeThumb('abc12345678')).toBe('https://i.ytimg.com/vi/abc12345678/hqdefault.jpg');
  });
});
