# Versioning

Respectabullz follows [Semantic Versioning 2.0.0](https://semver.org/).

## Version Format

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Incompatible changes (database schema changes requiring migration, major UI overhauls)
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes and minor improvements

## Version Locations

Version is tracked in multiple files and must stay synchronized:

| File | Purpose |
|------|---------|
| `VERSION` | Single source of truth |
| `package.json` | npm package version |
| `src-tauri/tauri.conf.json` | Tauri app version |
| `src-tauri/Cargo.toml` | Rust crate version |

## Updating Version

Use the version bump script:

```bash
# Bump patch version (0.1.0 -> 0.1.1)
node scripts/bump-version.js patch

# Bump minor version (0.1.0 -> 0.2.0)
node scripts/bump-version.js minor

# Bump major version (0.1.0 -> 1.0.0)
node scripts/bump-version.js major

# Set specific version
node scripts/bump-version.js 1.2.3

# Check current version
node scripts/bump-version.js
```

## Release Checklist

1. **Update Version**
   ```bash
   node scripts/bump-version.js [type]
   ```

2. **Update CHANGELOG.md**
   - Add new version section with date
   - List all changes under Added/Changed/Fixed/Removed

3. **Commit**
   ```bash
   git add .
   git commit -m "1.2.3 Release description"
   ```

4. **Tag**
   ```bash
   git tag v1.2.3
   git push && git push --tags
   ```

5. **Build**
   ```bash
   npm run tauri:build
   ```

6. **Create GitHub Release**
   - Upload installers
   - Copy changelog section to release notes

## Pre-release Versions

For testing releases:

```
1.0.0-alpha.1
1.0.0-beta.1
1.0.0-rc.1
```

## Version History

See [CHANGELOG.md](../CHANGELOG.md) for complete version history.

## Database Migrations

When changing the database schema:

1. Bump MINOR or MAJOR version
2. Create migration in `prisma/migrations/`
3. Document migration steps in changelog
4. Test migration with existing data

## Breaking Changes

Breaking changes require:

1. MAJOR version bump
2. Migration guide in changelog
3. Deprecation notices in previous release (if possible)

