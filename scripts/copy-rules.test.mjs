import { describe, expect, it } from 'vitest';
import { BANNED, BANNED_IN_SRC, EM_DASH, scanLine, scanText } from './copy-rules.mjs';

describe('scanLine', () => {
  it('passes plain text', () => {
    expect(scanLine('Publish, then share one link.')).toEqual([]);
  });

  it('flags "invalid input" in the product\'s code only (stories/E11-6, acceptance 4)', () => {
    expect(BANNED_IN_SRC).toEqual(['invalid input']);
    expect(scanLine('error: "Invalid input."', { src: true })).toEqual([{ kind: 'banned word', word: 'invalid input' }]);
    expect(scanLine('Never "invalid input".')).toEqual([]);
  });

  it('flags an em dash', () => {
    expect(scanLine('A vote ' + EM_DASH + ' a reason')).toEqual([{ kind: 'em dash' }]);
  });

  it('flags every banned word, whatever the case', () => {
    for (const w of BANNED) {
      expect(scanLine('Prefix ' + w.toUpperCase() + ' suffix')).toEqual([{ kind: 'banned word', word: w }]);
    }
  });

  it('does not flag a banned word inside a longer word', () => {
    expect(scanLine('The unlockable door')).toEqual([]);
    expect(scanLine('elevated access')).toEqual([]);
  });

  it('reports one problem per rule on the same line', () => {
    expect(scanLine('honestly ' + EM_DASH + ' robust')).toHaveLength(3);
  });
});

describe('scanText', () => {
  it('numbers lines from 1', () => {
    expect(scanText('fine\nseamless\nfine\nleverage it')).toEqual([
      { line: 2, kind: 'banned word', word: 'seamless' },
      { line: 4, kind: 'banned word', word: 'leverage' }
    ]);
  });
});
