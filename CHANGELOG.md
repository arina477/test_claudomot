# Changelog

All notable changes to StudyHall are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Foundation release: the StudyHall app now installs, runs, and deploys end-to-end as a monorepo with a live dark study workspace shell. (#1)
- Dark three-column app shell — server rail, channel sidebar, and main column on layered zinc surfaces — with a reusable connection-state indicator (online / reconnecting / offline).
- Backend API with a `GET /health` endpoint reporting service status and version.
- Shared types package so the web app and API validate the same data shapes.
- Continuous integration on every pull request: lint, typecheck, test, build, and secret scan.
- Live hosted environment on Railway: web app and API health check both serving in production.
