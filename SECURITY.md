# Security Policy

## Supported versions

This project is an **MVP / testnet** dApp. Only the latest `main` branch is considered for security fixes.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security-sensitive reports.

Email or message the maintainer (**bardia**) privately with:

- Description of the issue
- Steps to reproduce
- Impact assessment (if known)
- Whether any real funds or keys are involved

You should receive an acknowledgment when the maintainer is available. Please allow reasonable time for assessment before public disclosure.

## Scope notes

- GenResolve is intended for **GenLayer test networks** (Studionet / Bradbury). Do not treat it as production mainnet software.
- Optional GEN stake is **non-refundable** by design in this MVP.
- Intelligent Contract judgment uses AI consensus; verdicts are not a guarantee of absolute truth.
- Never commit private keys, mnemonics, or production API credentials. Use `.env.local` (gitignored) for local config.
