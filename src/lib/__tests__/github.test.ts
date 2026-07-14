import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  copyBugReportDraft,
  createGitHubIssueDraft,
  formatIssueBody,
  openGitHubIssue,
  sanitizePublicIssueText,
} from '../github';
import type { BugReportPayload } from '@/types';

const TEST_CREDENTIAL = [
  'github',
  'pat',
  'TEST',
  'ONLY',
  '1234567890abcdefghijklmnopqrstuvwxyz',
].join('_');
const tauriMocks = vi.hoisted(() => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: tauriMocks.invoke,
}));

function createPayload(overrides: Partial<BugReportPayload> = {}): BugReportPayload {
  return {
    title: 'Settings crash',
    description: 'The settings screen closes when I create an export.',
    stepsToReproduce: 'Open Settings, then select export.',
    expectedBehavior: 'The export dialog should open.',
    actualBehavior: 'The window closes.',
    severity: 'medium',
    systemInfo: {
      appVersion: '1.10.2',
      platform: 'Win32',
      userAgent: 'Test Agent',
      timestamp: '2026-07-14T12:00:00.000Z',
    },
    ...overrides,
  };
}

afterEach(() => {
  delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  tauriMocks.invoke.mockClear();
});

describe('public GitHub issue drafts', () => {
  it('redacts credentials, local paths, contact details, and record identifiers', () => {
    const sensitiveText = [
      `token=${TEST_CREDENTIAL}`,
      'C:\\Users\\Alice\\Documents\\client-record.json',
      'alice@example.com',
      '(304) 555-0199',
      '123e4567-e89b-42d3-a456-426614174000',
    ].join(' ');

    const sanitized = sanitizePublicIssueText(sensitiveText);

    expect(sanitized).not.toContain(TEST_CREDENTIAL);
    expect(sanitized).not.toContain('Alice');
    expect(sanitized).not.toContain('alice@example.com');
    expect(sanitized).not.toContain('304');
    expect(sanitized).not.toContain('123e4567');
    expect(sanitized).toContain('[redacted credential]');
    expect(sanitized).toContain('[redacted filesystem path]');
    expect(sanitized).toContain('[redacted contact information]');
    expect(sanitized).toContain('[redacted identifier]');
  });

  it('builds the exact sanitized preview without an authenticated request path', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const payload = createPayload({
      description: `Failure at C:\\Users\\Alice\\record.json using ${TEST_CREDENTIAL}`,
    });

    const draft = createGitHubIssueDraft(payload);
    const issueUrl = new URL(draft.issueUrl);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(issueUrl.protocol).toBe('https:');
    expect(issueUrl.hostname).toBe('github.com');
    expect(issueUrl.pathname).toBe('/LeftHandVoodoo/Respectabullz/issues/new');
    expect(issueUrl.search).toBe('');
    expect(draft.body).toBe(formatIssueBody(payload));
    expect(draft.body).not.toContain(TEST_CREDENTIAL);
    expect(draft.body).not.toContain('Authorization');
    expect(draft.body).toContain('[redacted credential]');
    expect(draft.body).toContain('[redacted filesystem path]');
    expect(draft.body).toContain('No logs, database records, photos, documents, or credentials were attached automatically.');
  });

  it('copies the reviewed draft and opens only the blank support page', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);
    const draft = createGitHubIssueDraft(createPayload());

    await copyBugReportDraft(draft);
    const opened = await openGitHubIssue(draft);

    expect(writeText).toHaveBeenCalledWith(`Title: ${draft.title}\n\n${draft.body}`);
    expect(openSpy).toHaveBeenCalledWith(draft.issueUrl, '_blank', 'noopener,noreferrer');
    expect(opened).toBe(true);
  });

  it('refuses to open a draft URL outside the fixed public repository', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);

    await expect(openGitHubIssue({
      title: 'Unsafe',
      body: 'Unsafe',
      issueUrl: 'https://example.com/issues/new',
    })).rejects.toThrow('Refusing to open an invalid bug report URL.');
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('uses the fixed native support command in the desktop app', async () => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);
    const draft = createGitHubIssueDraft(createPayload());

    await expect(openGitHubIssue(draft)).resolves.toBe(true);
    expect(tauriMocks.invoke).toHaveBeenCalledWith('open_support_issue_page');
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('redacts forward-slash Windows paths', () => {
    expect(sanitizePublicIssueText('Opened C:/Users/Alice/client.json')).toBe(
      'Opened [redacted filesystem path]',
    );
  });
});
