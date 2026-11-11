# RubyMarket Employee Portal — demo MVP

This folder contains a responsive, modular browser prototype based on the approved functional description.

## Run locally

Requires Node.js 20 or newer. No packages are needed.

```powershell
node server.mjs
```

Open `http://127.0.0.1:4173`. Sign-in is a demo flow and accepts no credentials. Demo settings and sample activity are stored in the browser's local storage.

## Implemented in this prototype

- Responsive RubyMarket employee portal styled with a dark graphite and glass surface, subtle burgundy lighting and the reference site's `#800020` accent.
- Demo sign-in screen shaped for a corporate SSO hand-off; no local password is collected.
- Employee profile, avatar picker, tenure, learning assignments, company news and information library.
- Course routes with progress and a sample test completion flow.
- Test administration: attempt limit, scoring rule, pass threshold, bonus condition, result review, correction, logical exclusion, audit trail and CSV export.
- Motivation demo: versioned point rules, awards for completed courses and first-try test passes, event-trigger simulation, point history, reward catalog with stock and redemption, and auctions with bidding and winner settlement.
- Demo organizational groups and role configuration screens.
- Hierarchical sample reports and report export.
- In-portal and push notification preferences.
- Integration status panel and adapter boundaries for identity, employee data and a secure integration gateway.
- Future module placeholders for leave and assigned assets.

## Production boundary

This is a front-end demonstration, not a production service. It uses sample data, browser local storage and a simulated sign-in. Motivation operations and inventory are local to this browser; the demo does not process real goods, payments, 1C/KEDO events, employee accounts or cross-user auction balances. It does not authenticate company accounts, persist records on a server, send push messages, or enforce access permissions on a trusted server. Before using real employee data or prizes, replace demo adapters with IT-approved SSO and gateway services, move points, inventory, bids and redemption records to a transactional authenticated server API, add server-side authorization, idempotent event processing and audit, and have IT/security approve hosting and data handling.

The client intentionally contains no credentials and no direct database connections. Integrations are designed to pass through the approved intermediary layer.
