# Contributing to GenResolve

Thanks for your interest in improving GenResolve.

## Development setup

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_CONTRACT_ADDRESS_STUDIONET / BRADBURY after Studio deploy
npm install
npm run dev
```

App default: [http://localhost:9056](http://localhost:9056).

### Quality checks before a PR

```bash
cd frontend
npm run lint
npm run build
```

There is **no automated test suite** yet. Prefer small, focused PRs.

## Project layout

| Path | Purpose |
|------|---------|
| `contracts/` | GenLayer Intelligent Contract (Python) |
| `frontend/` | Next.js App Router dApp |
| `skill/` | Optional design skill notes for agents / contributors |

## Contract notes

- On-chain Python class is still named `TruthLedger` for **deploy compatibility**.
- Public methods (`create_claim`, `judge_claim`, views) must stay stable unless you document a breaking change.
- Product / UI name is **GenResolve**.

## Code of conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions are licensed under the MIT License (see [LICENSE](./LICENSE)).
