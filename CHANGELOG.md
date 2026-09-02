# Changelog

All notable changes to Floating Scrolls will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Expand automated unit, integration, and end-to-end test coverage.
- Continue migrating the complete game flow to the React client.

## [0.1.0] - 2026-09-02

### Added

- AI-assisted character extraction and branching interactive narrative APIs.
- A built-in catalog of 23 literary characters and 31 legendary items.
- Character growth, equipment, story saves, battle records, and leaderboards backed by SQLite.
- Real-time player matching and battle communication over WebSocket, including bot opponents.
- Multi-provider LLM configuration, including OpenAI-compatible and Anthropic-native endpoints.
- React 19, Vite, TypeScript, Zustand, and Tailwind CSS migration preview.
- Contributor guide, deployment guide, release notes, MIT license, and baseline GitHub Actions CI.

### Changed

- Production configuration now requires an explicit JWT secret and restricts CORS to same-origin unless an allowlist is configured.
- React API requests can use the `VITE_API_BASE_URL` environment variable.
- Repository-generated Playwright output, local tool state, and operating-system artifacts are excluded from version control.

### Security

- Removed the public static JWT default; development sessions now generate an ephemeral secret and production startup fails without `JWT_SECRET`.

[Unreleased]: https://github.com/fengjiehzi/floating-scrolls/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/fengjiehzi/floating-scrolls/releases/tag/v0.1.0
