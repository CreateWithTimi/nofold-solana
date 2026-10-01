# M01 — PLAYER PASSPORT

## Goal

Give NO FOLD players a persistent identity that follows them
between tables without requiring them to understand wallets or Web3.

## Product principle

Players should experience NO FOLD, not blockchain.

## Flow

Guest
→ Scan QR
→ Enter name
→ Play normally
→ "Save your NO FOLD profile"
→ Sign in with Google / Email
→ Privy provisions Solana wallet
→ Player Passport created
→ Identity persists across tables

## M01.1 — Privy Foundation

- Add Privy authentication
- Configure Solana embedded wallets
- Email / Google authentication
- Login and logout
- Existing gameplay unchanged

## M01.2 — Save My Player

- Allow guest-first gameplay
- Offer account creation after joining/playing
- Link existing guest display name to authenticated user
- Do not force wallet onboarding before gameplay

## M01.3 — Player Passport

- Persistent NO FOLD player ID
- Display name
- Embedded Solana wallet address
- Tables played
- CALL count
- Wins / achievements

## M01.4 — Cross-Table Identity

- Leave one room
- Join another room
- Authenticate
- Restore Player Passport

## Not in M01

- Tokens
- NFTs
- Marketplace
- Paid transactions
- On-chain room state
- On-chain CALL/FOLD actions
- Venue reward economy
