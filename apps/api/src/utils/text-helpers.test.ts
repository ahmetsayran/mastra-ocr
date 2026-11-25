import { describe, expect, it } from 'bun:test';
import { splitText } from './text-helpers';

describe('splitText', () => {
  it('returns short text as a single part', () => {
    expect(splitText('kısa metin', 20)).toEqual(['kısa metin']);
  });

  it('splits long text at word boundaries within the limit', () => {
    const text = Array.from({ length: 50 }, (_, i) => `kelime${i}`).join(' ');
    const parts = splitText(text, 40);

    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((part) => part.length <= 40)).toBe(true);
    expect(parts.join(' ')).toBe(text);
  });

  it('keeps a word longer than the limit as its own part', () => {
    expect(splitText(`a ${'x'.repeat(30)} b`, 10)).toEqual(['a', 'x'.repeat(30), 'b']);
  });
});
