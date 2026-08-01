# GenResolve Frontend

Next.js (App Router) frontend for **GenResolve** (GenLayer dApp) — premium dark UI for AI-judged claims.

Routes: `/` landing · `/home` app dashboard · `/create` · `/claims`

Package name: `genresolve-frontend`. PM2 process name: **`genresolve`** (port **9056**).

## Features

- Wallet connect / disconnect (MetaMask, Rabby, other injected wallets)
- Network switcher: **Studionet** ↔ **Bradbury Testnet**
- List claims, claim detail, create claim (with optional GEN stake)
- Trigger `judge_claim` on Pending claims
- Per-network contract addresses via env
- Premium dark theme (violet / gold / cyan accents), glass cards, status & verdict badges
- Intentional judgment waiting state, empty states, loading & errors
- Input limits: claim text ≤ 2,000 chars; evidence ≤ 8,000 chars (enforced on-chain and in the form)
- Optional stake is **non-refundable** in this MVP (permanently locked in the contract)

## Stake (MVP)

Any GEN sent with `create_claim` is recorded on the claim and **cannot be withdrawn** yet. Leave stake at `0` unless you intentionally want to bond value. Do not treat stake as escrow or a deposit you can reclaim.

## Quick start

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your deployed contract addresses

npm install
npm run dev
```

Open [http://localhost:9056](http://localhost:9056).

## Production (PM2)

```bash
pm2 delete truthledger 2>/dev/null || true
cd frontend   # or: cd ~/truthledger/frontend
npm run build
PORT=9056 pm2 start npm --name "genresolve" -- start
pm2 save
```

## Configure contract addresses

In `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS_STUDIONET=0xYourStudionetAddress
NEXT_PUBLIC_CONTRACT_ADDRESS_BRADBURY=0xYourBradburyAddress
NEXT_PUBLIC_DEFAULT_NETWORK=studionet
```

| Network   | Chain ID | RPC                                      | Env key                                   |
|-----------|----------|------------------------------------------|-------------------------------------------|
| Studionet | 61999    | https://studio.genlayer.com/api          | `NEXT_PUBLIC_CONTRACT_ADDRESS_STUDIONET`  |
| Bradbury  | 4221     | https://rpc-bradbury.genlayer.com        | `NEXT_PUBLIC_CONTRACT_ADDRESS_BRADBURY`   |

Restart `npm run dev` after changing env vars.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Development server       |
| `npm run build`| Production build         |
| `npm run start`| Serve production build   |
| `npm run lint` | Typecheck (`tsc`)        |

## Deploy Intelligent Contract (GenLayer Studio)

1. Open [GenLayer Studio](https://studio.genlayer.com/contracts).
2. Paste `../contracts/truth_ledger.py` (keep the first-line `Depends` pin).
3. Deploy with no constructor args; copy the address into `.env.local`.
4. Restart `npm run dev` or rebuild for production.

## MVP limitations

- **Testnet only** (Studionet / Bradbury).
- **Stake is non-refundable** (locked in contract; no withdraw).
- **`judge_claim` is public** (anyone may trigger).
- **Verdicts are permanent** after Judged (no appeal in this MVP).
- AI consensus is not absolute truth / legal advice.

## Project layout

See the [root README](../README.md) for full monorepo docs.

---

Built and maintained by **bardia**.
