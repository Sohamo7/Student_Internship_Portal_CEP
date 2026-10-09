import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  renderApplicationApprovedHtml,
  renderApplicationSubmittedHtml,
  renderProjectAssignedHtml,
} from '@/lib/email/send';
import { clampText, createThrottle, normalizeEmail } from '@/lib/email/guard';

const ATTACK = '<script>alert(1)</script><img src=x onerror="steal()">';

describe('email templates escape user-supplied text', () => {
  it('escapeHtml neutralises tags, quotes and ampersands', () => {
    expect(escapeHtml(`<b onclick="x">Tom & 'Jerry'</b>`)).toBe(
      '&lt;b onclick=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/b&gt;'
    );
  });

  it('application received / approved emails cannot be hijacked through the name', () => {
    for (const html of [renderApplicationSubmittedHtml(ATTACK), renderApplicationApprovedHtml(ATTACK)]) {
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;script&gt;');
    }
  });

  it('project assigned email escapes title, supervisor name and the mailto link', () => {
    const html = renderProjectAssignedHtml('Asha', ATTACK, ATTACK, 'x@y.org"><script>1</script>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('"><script');
  });

  it('still renders normal text unchanged', () => {
    expect(renderApplicationSubmittedHtml('Asha Rao')).toContain('Application Received, Asha Rao!');
  });
});

describe('request guards', () => {
  it('normalizeEmail accepts real addresses (lower-cased) and rejects junk', () => {
    expect(normalizeEmail('  Asha@Example.ORG ')).toBe('asha@example.org');
    for (const bad of ['', 'nope', 'a@b', 'a b@c.org', 42, null, undefined, 'x'.repeat(260) + '@a.org']) {
      expect(normalizeEmail(bad)).toBeNull();
    }
  });

  it('clampText trims, caps length and ignores non-strings', () => {
    expect(clampText('  hello  ', 100)).toBe('hello');
    expect(clampText('abcdef', 3)).toBe('abc');
    expect(clampText({ a: 1 }, 10)).toBe('');
  });

  it('throttle allows one action per key per window, then again after it', () => {
    let now = 1_000;
    const t = createThrottle(30_000, () => now);
    expect(t.allow('a')).toBe(true);
    expect(t.allow('a')).toBe(false);
    expect(t.allow('b')).toBe(true); // different key is independent
    now += 30_001;
    expect(t.allow('a')).toBe(true);
  });
});
