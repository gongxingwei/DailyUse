# Commit & PR Style Guide

This short guide describes the project's preferred commit message format, branch naming rules, and a minimal PR checklist to keep commits and reviews consistent.

## Commit message format

Use Conventional Commits-style messages. Format:

`type(scope): short summary`

Optional detailed body separated by a blank line.

Examples:

- `feat(auth): add logout endpoint`
- `fix(api): handle null session in session repository`
- `docs: add Corepack pnpm setup guide`

Recommended types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.

Keep the short summary under 72 characters.

## Branch naming

Use dashes and be descriptive. Examples:

- `feat/auth-add-logout`
- `fix/prune-unused-deps`
- `docs/add-corepack-guide`

Prefix for hotfixes: `hotfix/`

Prefix for experiments: `wip/`

## PR checklist

- [ ] Title follows commit guidelines (use a descriptive title)
- [ ] Link to relevant issue or docs when applicable
- [ ] Tests added/updated for new behavior
- [ ] TypeScript types updated (if public API changed)
- [ ] Lint and typecheck pass locally
- [ ] CI passes on push

## Commit signing and authoring

- Prefer signed commits when possible (GPG or SSH signing in Git)
- Set correct author email and name in Git config

## Rebase vs Merge

- Prefer rebasing feature branches onto `main` before merging to keep history linear
- When merging, use `Squash and merge` for small feature branches to keep history tidy

---

Small, clear PRs and good commit messages speed up review and make changelogs easier to generate.
