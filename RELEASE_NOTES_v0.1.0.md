# Floating Scrolls v0.1.0

**Floating Scrolls v0.1.0 — First Public Preview**

This release is an early public preview of 万卷浮生, an AI-native interactive fiction and multiplayer game built around characters from classic literature. It is intended for evaluation, experimentation, and contributor onboarding rather than production-critical use.

## Highlights

- Turn classic-literature characters and settings into interactive narrative sessions.
- Carry structured character, item, progression, and story state in SQLite.
- Match players and run cross-work battles through a shared HTTP/WebSocket service.
- Choose from multiple LLM providers, including an actual OpenAI API integration.

## Features

- 23 built-in character definitions and 31 item definitions with stats, skills, forms, and literary sources.
- Registration and login with bcrypt password hashing and JWT authentication.
- AI character extraction, dialogue, battle narration, and branching story endpoints.
- Story DAGs, saves, equipment, battle history, rankings, online presence, matchmaking, and bot opponents.
- A complete native JavaScript client and an in-progress React 19/Vite/TypeScript migration client.

## Developer Experience

- Reproducible npm installs through committed lockfiles.
- MIT licensing and project-specific contribution guidance.
- GitHub Actions validation for server syntax/startup, REST/WebSocket smoke checks, frontend lint, and production build.
- Render Blueprint plus a deployment guide for a same-origin Node/WebSocket service with persistent SQLite storage.
- Environment templates containing placeholders only.

## Known Limitations

- This is an early public preview; APIs, data structures, and battle mechanics may change.
- Automated unit and end-to-end coverage is still limited to baseline CI and smoke checks.
- The React client is a migration preview; some story and battle views use deterministic local demo state instead of the complete server flow.
- SQLite is designed for a single service instance and requires persistent disk storage in production.
- AI features require users to configure their own authorized model API credentials.
- No hosted Live Demo URL is included in this release candidate yet.

## What's Next

- Add public-domain literature datasets with provenance and contribution rules.
- Improve multiplayer balance, reconnect behavior, and integration tests.
- Add automated narrative quality evaluation and community-created character packs.
- Complete the React client integration with authenticated story and multiplayer APIs.
