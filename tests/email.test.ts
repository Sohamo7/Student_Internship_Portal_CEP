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

  it('renders complete project details (track, description, metrics, and milestones) when provided', () => {
    const html = renderProjectAssignedHtml(
      'Asha Rao',
      'Digital Literacy Initiative',
      'Dr. Sharma',
      'sharma@ngo.org',
      'project_brief.pdf',
      'https://example.org/project_brief.pdf',
      {
        track: 'Education',
        description: 'Empowering underprivileged students with digital skills.',
        durationWeeks: 8,
        targetHours: 120,
        milestones: ['Curriculum setup', 'Classroom delivery', 'Final evaluation'],
      }
    );
    expect(html).toContain('Education Track');
    expect(html).toContain('Empowering underprivileged students with digital skills.');
    expect(html).toContain('8 Weeks');
    expect(html).toContain('120 Hours');
    expect(html).toContain('Curriculum setup');
    expect(html).toContain('Classroom delivery');
    expect(html).toContain('project_brief.pdf');
    expect(html).toContain('Download Project Attachment');
  });

  it('escapes attacks inside project description and milestones', () => {
    const html = renderProjectAssignedHtml(
      'Asha',
      'Clean Initiative',
      'Mentor',
      'mentor@ngo.org',
      null,
      null,
      {
        track: ATTACK,
        description: ATTACK,
        milestones: [ATTACK],
      }
    );
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
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
