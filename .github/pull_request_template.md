## Summary

Describe the user-visible or operational outcome of this change.

## Risk and rollback

- Risk level: Low / Medium / High
- Primary failure mode:
- Rollback or recovery path:

## Verification evidence

- [ ] Installed dependencies from the lockfile with \`npm ci\`
- [ ] Version consistency passes with \`npm run check:versions\`
- [ ] Lint passes with \`npm run lint\`
- [ ] Type-check passes with \`npm run typecheck\`
- [ ] Tests pass with \`npm run test:ci\`
- [ ] Coverage baseline passes with \`npm run test:coverage\`
- [ ] Web build passes with \`npm run build:web\`
- [ ] Windows Rust/Tauri checks were run when native code or packaging changed

Commands, results, and relevant artifact links:

## Release discipline

- [ ] \`CHANGELOG.md\` was updated, or the change is not meaningful to users
- [ ] User-facing documentation was updated, or no operating behavior changed
- [ ] Version fields remain synchronized, or the release version was intentionally bumped

## Security and privacy

- [ ] No credentials, personal data, or production database contents are included
- [ ] Built artifacts were scanned for GitHub-token-shaped values and \`VITE_GITHUB_TOKEN\`
- [ ] New dependencies and permissions are justified

## Residual risk

List known gaps, deferred work, or explicitly accepted risk. Write "None" when empty.
