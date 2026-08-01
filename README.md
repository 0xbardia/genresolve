# GenResolve

**GenResolve** is a GenLayer dApp: a public on-chain ledger where natural-language claims are judged by decentralized AI validators and permanently recorded as **True**, **False**, or **Unverifiable** — with short reasoning and confidence.

- **Intelligent Contract:** Python (GenLayer / GenVM)
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + genlayer-js
- **Networks:** GenLayer Studionet (61999) and Bradbury testnet (4221)

> Testnet MVP — not production mainnet software.

## Repository layout

```
contracts/          # GenLayer Intelligent Contract (truth_ledger.py)
frontend/           # Next.js dApp (GenResolve UI)
skill/              # Optional UI design skill notes for contributors/agents
```

## Quick start (frontend)

```bash
cd frontend
cp .env.example .env.local
# Set contract addresses after Studio deploy (see below)
npm install
npm run lint
npm run build
npm run dev
# → http://localhost:9056
```

### Environment variables

Copy `frontend/.env.example` → `frontend/.env.local` (never commit `.env.local`):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS_STUDIONET` | Deployed contract on Studionet |
| `NEXT_PUBLIC_CONTRACT_ADDRESS_BRADBURY` | Deployed contract on Bradbury |
| `NEXT_PUBLIC_DEFAULT_NETWORK` | `studionet` or `bradbury` |

| Network | Chain ID | RPC |
|---------|----------|-----|
| Studionet | 61999 | `https://studio.genlayer.com/api` |
| Bradbury | 4221 | `https://rpc-bradbury.genlayer.com` |

## Deploy the Intelligent Contract (GenLayer Studio)

1. Open [GenLayer Studio](https://studio.genlayer.com/contracts).
2. Create a new contract and paste `contracts/truth_ledger.py` (keep the first-line `Depends` comment).
3. Deploy (constructor has no args). Note the contract address.
4. Put the address in `frontend/.env.local` for the matching network.
5. Restart the frontend (`npm run dev` or rebuild for production).

**Compatibility note:** The on-chain Python class is still named `TruthLedger` so existing deployments remain stable. Product name and UI are **GenResolve**. Methods: `create_claim`, `judge_claim`, `get_claim`, `get_claims`, `get_claim_count`, `get_owner`.

Official docs: [docs.genlayer.com](https://docs.genlayer.com/) · [skills.genlayer.com](https://skills.genlayer.com/) · [genlayer-js](https://github.com/genlayerlabs/genlayer-js)

## Production (PM2)

```bash
cd frontend
npm run build
PORT=9056 pm2 start npm --name "genresolve" -- start
pm2 save
```

## Scripts (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port **9056** |
| `npm run lint` | Typecheck (`tsc --noEmit`) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |

## MVP limitations (read carefully)

- **Testnet only** — Studionet / Bradbury; not mainnet-hardened.
- **Stake is non-refundable** — GEN sent with `create_claim` is locked in the contract; no withdraw in this MVP.
- **`judge_claim` is public** — anyone can trigger judgment on a Pending claim.
- **Verdicts are permanent** — once Judged, status is not reverted; no appeal flow yet.
- **AI consensus** — outcomes depend on validator models and evidence; not legal/financial advice.
- **No automated test suite** in this repository yet.

## Naming

| Context | Name |
|---------|------|
| Product / UI | **GenResolve** |
| npm package | `genresolve-frontend` |
| PM2 process | `genresolve` |
| On-chain Python class | `TruthLedger` (compatibility leftover) |
| Contract file | `contracts/truth_ledger.py` |

## License

MIT — see [LICENSE](./LICENSE). Copyright © 2026 **bardia**.

GenLayer, GenVM, and related trademarks belong to their respective owners. This project is an independent application built on GenLayer.

---

Built and maintained by **bardia**.
