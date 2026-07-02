<!--
SYNC IMPACT REPORT
==================
Version change: [TEMPLATE] → 1.0.0
Ratification: Initial adoption 2026-07-02

Modified principles: N/A (initial ratification)

Added sections:
  - Core Principles (12 principles)
  - Infrastructure & Operations
  - Development Standards
  - Governance

Removed sections: N/A (initial ratification)

Templates reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check section present; aligns with principles
  ✅ .specify/templates/spec-template.md — No principle-breaking constraints found
  ✅ .specify/templates/tasks-template.md — Tests noted as OPTIONAL; aligns with Principle 7
  ✅ No commands/*.md files found to review

Follow-up TODOs: None — all placeholders resolved.
-->

# TodoApp API Constitution

## Core Principles

### I. Python (FastAPI) Backend

The backend MUST be implemented in Python using FastAPI as the web framework.
No alternative backend languages or frameworks may be introduced without amending this constitution.
FastAPI is chosen for its performance, built-in OpenAPI support, and idiomatic async Python.

### II. Simple, Clean, and Modular Architecture

The codebase MUST be organized into clearly separated modules (e.g., routes, models, services).
Each module MUST have a single, well-defined responsibility.
Horizontal layers (e.g., adding a new endpoint) MUST not require changes across unrelated modules.
Over-engineering, premature abstractions, and speculative structure are prohibited.

### III. Clean Code and Meaningful Naming

All identifiers (variables, functions, classes, modules) MUST be named to communicate intent without
requiring comments to explain the what.
Functions MUST be short and do one thing. Long functions MUST be refactored.
Code MUST read like prose — a future maintainer MUST understand a module's purpose within seconds of
opening it.

### IV. RESTful API Design

All external interfaces MUST be exposed as RESTful HTTP endpoints.
Resources MUST be named as nouns (e.g., `/todos`, `/users`). Actions MUST be expressed via HTTP
verbs (GET, POST, PUT, PATCH, DELETE).
HTTP status codes MUST be used semantically (200 OK, 201 Created, 404 Not Found, 422 Unprocessable
Entity, etc.).
API responses MUST be JSON.

### V. Minimal Dependencies

Third-party packages MUST only be added when they provide clear, non-trivial value that cannot be
achieved with the standard library or FastAPI's built-ins in a reasonable number of lines.
Every dependency added MUST be justified. Unused dependencies MUST be removed.
Prefer well-maintained packages with small transitive dependency footprints.

## Infrastructure & Operations

### VI. Simple Docker for Local Development Only

Docker configuration MUST be limited to local development use (e.g., `docker-compose.yml` for
spinning up the app and any required services locally).
Multi-stage builds, production Docker hardening, and advanced Docker optimizations MUST NOT be
introduced unless explicitly requested.
The Docker setup MUST remain minimal and readable — a developer MUST be able to understand it in
under five minutes.

### VII. No Tests Unless Explicitly Requested

Unit tests, integration tests, and end-to-end tests MUST NOT be written unless explicitly requested.
When tests are requested, they MUST be scoped to the request — no speculative test coverage.
This principle exists to avoid maintenance burden on a rapidly evolving codebase during early
development.

### VIII. No CI/CD Unless Explicitly Requested

CI/CD pipelines (GitHub Actions, GitLab CI, etc.) MUST NOT be configured unless explicitly
requested.
Build automation, deployment scripts, and release workflows are out of scope until requested.

### IX. Environment Variables for Configuration

All configuration that varies between environments (database URLs, secret keys, ports, feature flags)
MUST be stored in environment variables.
A `.env.example` file MUST document all required variables with placeholder values.
No hardcoded configuration values are permitted in source code.

### X. No Secrets or Credentials in Version Control

Secrets, credentials, API keys, tokens, and passwords MUST NEVER be committed to the repository.
`.env` files containing real values MUST be listed in `.gitignore`.
If a secret is accidentally committed, it MUST be treated as compromised and rotated immediately.

## Development Standards

### XI. Concise Documentation

Documentation MUST cover setup and usage and nothing more unless explicitly requested.
A `README.md` MUST include: prerequisites, local setup steps, how to run the app, and how to use the
API.
Documentation MUST be kept in sync with the code — stale documentation is worse than no
documentation.

### XII. Readability Over Cleverness

When two implementations achieve the same result, the more readable one MUST be chosen.
Clever one-liners, obscure language features, and non-obvious optimizations are prohibited unless
they address a measured performance problem.
Three clear lines beat one cryptic line. Maintainability is a feature.

## Governance

This constitution supersedes all other practices, conventions, and tooling defaults in this project.
Any deviation from these principles MUST be documented and justified in the relevant PR description.

**Amendment procedure**: Amendments require updating this file with a version bump, a rationale in
the Sync Impact Report comment, and consensus between active contributors. Amendments MUST NOT
silently remove principles — removal requires explicit justification.

**Versioning policy**:
- MAJOR: Backward-incompatible governance changes, principle removal, or redefinition.
- MINOR: New principle added or materially expanded guidance.
- PATCH: Clarifications, wording fixes, non-semantic refinements.

**Compliance**: All code reviews MUST verify that changes comply with the active principles.
Complexity that violates a principle MUST be flagged for justification before merge.

**Version**: 1.0.0 | **Ratified**: 2026-07-02 | **Last Amended**: 2026-07-02
