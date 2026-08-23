import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../HelpSection';

describe('HelpSection Markdown rendering', () => {
  it('escapes raw HTML instead of creating executable markup', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">');

    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(html).not.toContain('<img');
  });

  it('renders unsupported link schemes as inert text', () => {
    const html = renderMarkdown('[click me](javascript:alert(1))');

    expect(html).toContain('click me');
    expect(html).not.toContain('href=');
    expect(html).not.toContain('javascript:');
  });

  it('allows safe anchors and isolated HTTPS links', () => {
    const html = renderMarkdown('[section](#safe-section) [site](https://example.com/path?q=1)');

    expect(html).toContain('data-anchor="safe-section"');
    expect(html).toContain('href="https://example.com/path?q=1"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
  });
});
