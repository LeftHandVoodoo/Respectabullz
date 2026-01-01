# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.10.x  | :white_check_mark: |
| < 1.10  | :x:                |

## Security Features

### Application Security (v1.10.0+)

Respectabullz implements multiple layers of security:

#### Content Security Policy (CSP)
- Enabled CSP in Tauri configuration
- Restricts resource loading to prevent XSS attacks
- Policy: `default-src 'self'; img-src 'self' data: asset: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; connect-src 'self' https:`

#### File System Access Restrictions
- Asset protocol scope restricted to app-specific directory: `$APPDATA/com.respectabullz.app/**`
- Filesystem capabilities limited to:
  - `$APPDATA/com.respectabullz.app/**` (app data)
  - `$DOCUMENT/**` (user documents)
  - `$PICTURE/**` (user pictures)
  - `$DOWNLOAD/**` (downloads)
  - `$DESKTOP/**` (desktop)
- No wildcard access to entire filesystem

#### Path Traversal Protection
- Filename validation before file operations (`isValidStoredFilename()`)
- Blocks path traversal sequences (`..`, `/`, `\`)
- Validates UUID v4 or legacy timestamp filename formats
- Restricts to allowed file extensions only
- Applied before `shellOpen()` operations

#### Capability Restrictions
- Shell plugin limited to `shell:allow-open` only
- SQL plugin scoped to: `load`, `execute`, `select`, `close`
- No overly permissive wildcards in capabilities

#### Data Integrity
- Backup metadata validated with Zod schemas
- JSON parsing wrapped in error handling
- File write operations verified post-write
- Photo restore operations track and report failures

#### Filename Security
- UUID v4 filenames for photos and documents (prevents collisions and predictable paths)
- Legacy timestamp format still supported for backward compatibility
- Filename validation enforces allowed patterns

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **Do NOT** open a public GitHub issue
2. Email security details to: [Your security email or GitHub security advisory]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity (see CVSS rating)

### Severity Levels

We use CVSS v3.0 to assess vulnerability severity:

- **Critical (9.0-10.0)**: Immediate fix, hotfix release
- **High (7.0-8.9)**: Fix in next patch release
- **Medium (4.0-6.9)**: Fix in next minor or patch release
- **Low (0.1-3.9)**: Fix in next planned release

## Security Best Practices for Contributors

When contributing code:

1. **Never commit secrets**: API keys, tokens, passwords, or credentials
2. **Validate user input**: Always validate and sanitize user-provided data
3. **Use parameterized queries**: For any database operations
4. **Follow principle of least privilege**: Request only necessary permissions
5. **Validate file paths**: Check for path traversal before file operations
6. **Use structured logging**: Never log sensitive data (passwords, tokens, PII)
7. **Review security implications**: Consider security impact of new features

### Code Review Checklist

- [ ] No hardcoded secrets or credentials
- [ ] User input validated and sanitized
- [ ] File operations validate paths
- [ ] Error messages don't leak sensitive information
- [ ] Logging doesn't expose sensitive data
- [ ] Permissions requested are minimal and necessary
- [ ] Security-related changes documented

## Security Audit Status

As of 2026-01-01:
- ✅ All Critical issues resolved (C-1, C-2)
- ✅ All High issues resolved (H-1 through H-5)
- ✅ All Medium issues resolved (M-1 through M-8)
- ✅ All Low issues resolved (L-1 through L-4)
- ✅ 0 known security vulnerabilities

See [ISSUE_AUDIT.md](ISSUE_AUDIT.md) for detailed security audit results.

## Data Privacy

- **Local Storage Only**: All data stored locally on user's machine
- **No External Transmission**: No data sent to external servers
- **No Telemetry**: No usage tracking or analytics
- **Backup Encryption**: Users are responsible for encrypting backup files if needed

## Dependencies

We regularly audit dependencies for vulnerabilities:

- Run `npm audit` to check for known vulnerabilities
- Update dependencies regularly
- Review security advisories for critical dependencies

Current status: ✅ 0 vulnerabilities (as of 2026-01-01)
