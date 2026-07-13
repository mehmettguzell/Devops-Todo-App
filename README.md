# Devops-Todo-App

See [todo-api/README.md](todo-api/README.md) for the application itself (setup, usage).

## CI/CD

| Workflow | Trigger | Purpose |
|---|---|---|
| [test.yml](.github/workflows/test.yml) | PR to `main`, push to `main` | Path-filtered backend pytest / frontend lint |
| [release-please.yml](.github/workflows/release-please.yml) | push to `main` | Maintains a release PR from Conventional Commits; merging it cuts a GitHub Release + `vX.Y.Z` tag |
| [build-push.yml](.github/workflows/build-push.yml) | tag push `v*` | Builds and pushes changed backend/frontend images to GHCR |
| [close-stale-issues-and-prs.yml](.github/workflows/close-stale-issues-and-prs.yml) | daily cron | Labels and closes stale issues/PRs |
