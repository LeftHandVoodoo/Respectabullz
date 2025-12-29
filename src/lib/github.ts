import { VERSION } from './version';
import type { BugReportPayload, SystemInfo, GitHubIssueResponse } from '@/types';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || '';

interface GitHubErrorResponse {
  message: string;
  documentation_url?: string;
}

/**
 * Formats the bug report payload into GitHub issue markdown body
 */
function formatIssueBody(payload: BugReportPayload): string {
  const sections = [`## Description\n${payload.description}`];

  if (payload.stepsToReproduce) {
    sections.push(`## Steps to Reproduce\n${payload.stepsToReproduce}`);
  }

  if (payload.expectedBehavior) {
    sections.push(`## Expected Behavior\n${payload.expectedBehavior}`);
  }

  if (payload.actualBehavior) {
    sections.push(`## Actual Behavior\n${payload.actualBehavior}`);
  }

  sections.push(`## System Information
| Property | Value |
|----------|-------|
| App Version | ${payload.systemInfo.appVersion} |
| Platform | ${payload.systemInfo.platform} |
| User Agent | ${payload.systemInfo.userAgent} |
| Timestamp | ${payload.systemInfo.timestamp} |`);

  return sections.join('\n\n');
}

/**
 * Maps severity to GitHub label
 */
function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    critical: 'priority: critical',
    high: 'priority: high',
    medium: 'priority: medium',
    low: 'priority: low',
  };
  return labels[severity] || 'bug';
}

/**
 * Creates a GitHub issue for a bug report
 */
export async function createGitHubIssue(
  payload: BugReportPayload
): Promise<GitHubIssueResponse> {
  const [owner, repoName] = GITHUB_REPO.split('/');
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repoName}/issues`;

  const issueBody = formatIssueBody(payload);
  const labels = ['bug', getSeverityLabel(payload.severity)];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `[Bug Report] ${payload.title}`,
      body: issueBody,
      labels,
    }),
  });

  if (!response.ok) {
    const errorData: GitHubErrorResponse = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(errorData.message || 'Failed to create GitHub issue');
  }

  return response.json();
}

/**
 * Collects system information for bug reports
 */
export function collectSystemInfo(): SystemInfo {
  return {
    appVersion: VERSION,
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Checks if GitHub bug reporting is properly configured
 */
export function isGitHubConfigured(): boolean {
  return !!(GITHUB_TOKEN && GITHUB_REPO);
}
