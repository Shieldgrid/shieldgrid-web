# Shieldgrid Web

The operator dashboard for **Shieldgrid** — the frontend analysts use to view alerts, manage cases, and configure connectors.

## Status

🚧 Phase 0 — foundation. Talks to [shieldgrid-core](https://github.com/Shieldgrid/shieldgrid-core) over REST.

## Stack

- **Framework:** React + TypeScript
- **API client:** typed client generated from / matching shieldgrid-core's `/api/v1` contract

## Design principle

The UI mirrors the core data model, not the other way around: Dashboard → Alerts → Cases → Connectors → Admin. Connector metadata (name, icon, status) is data-driven from the API — adding a new connector on the backend should never require a frontend release.

## Getting Started

```bash
git clone https://github.com/Shieldgrid/shieldgrid-web.git
cd shieldgrid-web

npm install

# point at your local shieldgrid-core instance
cp .env.example .env

npm run dev
```

Requires a running `shieldgrid-core` instance (see that repo's README) for the app to have data to display.

## Roadmap

Tracks the phases in [shieldgrid-core](https://github.com/Shieldgrid/shieldgrid-core#roadmap):

- Phase 0: read-only alert view
- Phase 1: case management UI, login/auth
- Phase 2: connector configuration screens
- Phase 3: response-action UI (block IP, isolate host, etc.)

## License

[AGPL-3.0](LICENSE)

## Contributing

Issues and PRs welcome. Please open an issue before large UI changes so we can align on design direction first.
