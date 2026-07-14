import { VERSION } from './version';
import type { BugReportDraft, BugReportPayload, SystemInfo } from '@/types';

const GITHUB_REPO = 'LeftHandVoodoo/Respectabullz';
const SUPPORT_ISSUE_URL = `https://github.com/${GITHUB_REPO}/issues/new`;
const REDACTED_CREDENTIAL = '[redacted credential]';
const REDACTED_PATH = '[redacted filesystem path]';
const REDACTED_CONTACT = '[redacted contact information]';
const REDACTED_IDENTIFIER = '[redacted identifier]';

/**
 * Removes common credentials, local paths, contact details, and record-style
 * identifiers before a report is shown or copied for a public GitHub issue.
 * The preview remains the final safety check because free-form text can still
 * contain domain-specific names or details that cannot be identified reliably.
 */
export function sanitizePublicIssueText(value: string): string {
  return value
    .replace(/\0/g, '')
    .replace(/\bgithub_pat_[A-Za-z0-9_]+\b/gi, REDACTED_CREDENTIAL)
    .replace(/\bgh[pousr]_[A-Za-z0-9]+\b/gi, REDACTED_CREDENTIAL)
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi, REDACTED_CREDENTIAL)
    .replace(
      /\b(api[_ -]?key|access[_ -]?token|auth(?:orization)?|password|secret)\s*[:=]\s*["']?[^\s"'`]+/gi,
      (_match, label: string) => `${label}: ${REDACTED_CREDENTIAL}`
    )
    .replace(/file:\/\/\/[A-Za-z]:\/[^\s)\]}]+/gi, REDACTED_PATH)
    .replace(/\b[A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\s\r\n]*/g, REDACTED_PATH)
    .replace(/\b[A-Za-z]:[/](?:[^/:*?"<>|\r\n]+[/])*[^/:*?"<>|\s\r\n]*/g, REDACTED_PATH)
    .replace(/\\\\[^\\\s]+\\[^\r\n]+/g, REDACTED_PATH)
    .replace(/\/(?:Users|home)\/[^/\s]+(?:\/[^\s)\]}]+)?/g, REDACTED_PATH)
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, REDACTED_CONTACT)
    .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g, REDACTED_CONTACT)
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, REDACTED_IDENTIFIER)
    .trim();
}

function sanitizeTableValue(value: string): string {
  return sanitizePublicIssueText(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/**
 * Formats the exact sanitized markdown shown to the user before GitHub opens.
 */
export function formatIssueBody(payload: BugReportPayload): string {
  const sections = [
    `## Description\n${sanitizePublicIssueText(payload.description)}`,
  ];

  if (payload.stepsToReproduce) {
    sections.push(`## Steps to Reproduce\n${sanitizePublicIssueText(payload.stepsToReproduce)}`);
  }

  if (payload.expectedBehavior) {
    sections.push(`## Expected Behavior\n${sanitizePublicIssueText(payload.expectedBehavior)}`);
  }

  if (payload.actualBehavior) {
    sections.push(`## Actual Behavior\n${sanitizePublicIssueText(payload.actualBehavior)}`);
  }

  sections.push(`## Severity\n${sanitizePublicIssueText(payload.severity)}`);
  sections.push(`## System Information
| Property | Value |
|----------|-------|
| App Version | ${sanitizeTableValue(payload.systemInfo.appVersion)} |
| Platform | ${sanitizeTableValue(payload.systemInfo.platform)} |
| User Agent | ${sanitizeTableValue(payload.systemInfo.userAgent)} |
| Timestamp | ${sanitizeTableValue(payload.systemInfo.timestamp)} |`);
  sections.push(
    '## Privacy\nThis report was prepared locally. No logs, database records, photos, documents, or credentials were attached automatically.'
  );

  return sections.join('\n\n');
}

/**
 * Creates a local draft and a fixed public GitHub destination. Report contents
 * are deliberately kept out of the URL. No network request or repository
 * credential is used by this function.
 */
export function createGitHubIssueDraft(payload: BugReportPayload): BugReportDraft {
  const title = sanitizePublicIssueText(`[Bug Report] ${payload.title}`);
  const body = formatIssueBody(payload);

  return {
    title,
    body,
    issueUrl: SUPPORT_ISSUE_URL,
  };
}

/** Copies the exact public issue draft after the user has reviewed it. */
export async function copyBugReportDraft(draft: BugReportDraft): Promise<void> {
  const text = `Title: ${draft.title}\n\n${draft.body}`;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('Could not copy the report to the clipboard.');
  }
}

/** Opens only the fixed, blank public GitHub issue page. */
export async function openGitHubIssue(draft: BugReportDraft): Promise<boolean> {
  const url = new URL(draft.issueUrl);
  const expectedPath = `/${GITHUB_REPO}/issues/new`;

  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'github.com' ||
    url.pathname !== expectedPath ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    throw new Error('Refusing to open an invalid bug report URL.');
  }

  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_support_issue_page');
    return true;
  }

  return window.open(draft.issueUrl, '_blank', 'noopener,noreferrer') !== null;
}

/** Collects the non-record system information included in the visible preview. */
export function collectSystemInfo(): SystemInfo {
  return {
    appVersion: VERSION,
    platform: typeof navigator === 'undefined' ? 'unknown' : navigator.platform,
    userAgent: typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}

export function isGitHubConfigured(): boolean {
  return true;
}
