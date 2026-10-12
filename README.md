# Algorithm Marketplace: Contracts

Two contracts, no admin keys, no upgrade path, native-token tips only.

| Contract | Purpose |
|---|---|
| `RuleRegistry` | Stores ranking rules as weights in basis points (recency / tips / backers, must sum to 10,000). |
| `Feed` | Posts and tips. 90% of each tip is credited to the post author, 10% to the author of the rule used. Pull payments via `withdraw()`. |

Ids are 1-based. Id 0 is never valid.

## Setup

```bash
# Install forge-std (once)
forge install foundry-rs/forge-std --no-commit   # drop --no-commit on newer forge versions

# Build
forge build

# Test
forge test -vv

# Format
forge fmt

# Coverage
forge coverage

# Slither analysis
slither .

# Export ABIs
./script/export-abi.sh
```

## Deploy to Monad testnet (chain 10143)

```bash
# One-time: import the deployer keystore (never store keys in .env or shell history)
cast wallet import deployer --interactive

# Fund it from the Monad testnet faucet first

# Dry run (simulation only, does not write deployments)
FOUNDRY_ACCOUNT=deployer forge script script/Deploy.s.sol:Deploy --rpc-url monad_testnet --account deployer --broadcast --skip

# Real deploy; writes deployments/10143.json
FOUNDRY_ACCOUNT=deployer forge script script/Deploy.s.sol:Deploy --rpc-url monad_testnet --account deployer --broadcast

# Seed demo data
FOUNDRY_ACCOUNT=deployer forge script script/Seed.s.sol:Seed --rpc-url monad_testnet --account deployer --broadcast
```

## Verify (Sourcify):

```bash
forge verify-contract <ADDRESS> src/Feed.sol:Feed --chain 10143 \
  --verifier sourcify --verifier-url "https://sourcify-api-monad.blockvision.org/" \
  --constructor-args $(cast abi-encode "constructor(address)" <REGISTRY_ADDRESS>)
```

## Frontend handoff

- `abi/RuleRegistry.json`, `abi/Feed.json`
- `deployments/10143.json` (chain id, RPC URL, both addresses)
- Ranking inputs per post come straight from `getPost`: `createdAt` (recency), `totalTips` (wei), `backerCount` (unique tippers).
- Monad charges by gas **limit**, not gas used, so avoid hard-coding very high gas limits in wagmi/viem calls; let estimation run.

## AI disclosure

Add the AI tools you used (for example Claude) here before submitting; the hackathon requires it.

---

## Security Design Choices & Limitations

This section documents the accepted security limitations of the Algorithm Marketplace contracts.

### Design choices

1. **Native-token tips only**: The contract only accepts native ETH/Monad tokens. No ERC20, ERC721, or other token transfers are supported. This eliminates complex token logic and potential vulnerabilities.

2. **No owner/admin/upgradeability**: There is no owner, admin key, or proxy pattern. Once deployed, the contracts cannot be modified. This removes the risk of rug pulls or unilateral changes but means bugs cannot be patched.

3. **No fees to deployer**: The deployer receives no special fees. All tips are split between the post author and the rule author as specified by the weights.

4. **Pull payments**: Tips are not sent directly to users. Instead, accumulated earnings are stored in `_pending` balances and can be withdrawn by the user via `withdraw()`. This avoids reentrancy issues during tip processing but requires users to actively withdraw their funds.

5. **Reentrancy protected withdraw**: The `withdraw()` function uses a `nonReentrant` modifier (based on the Checks-Effects-Interactions pattern) to prevent reentrancy attacks. The effects (zeroing the balance) happen before the external call (low-level `call`).

6. **Weights must sum to exactly 10,000**: Rule weights are stored as basis points (1/10,000) and must sum to exactly 10,000. This prevents manipulation of the ranking algorithm.

7. **Immutable rules**: Once a rule is published, it cannot be modified. New rules can be published, but existing rules remain unchanged forever.

### Accepted limitations

1. **No protection against zero-tips**: If a tipper sends 0 wei, the transactionreverts. This is intentional but means there is no dust protection.

2. **No anti-Sybil mechanism for rule backers**: The `backerCount` counts unique tippers, but there is no mechanism to prevent a single address from tipping multiple times to game the ranking. The frontend is responsible for enforcing anti-Sybil rules.

3. **No pausability**: There is no `pause()` function. If a critical bug is found, the only recourse is to deploy new contracts.

4. **Tip rounding**: The 10% rule share is rounded down, and the post author receives the remainder. This means for very small tips (< 10 wei), the rule author receives 0 wei.

5. **No zero-address check for posters/tippers**: The contract does not check that poster or tipper addresses are non-zero. This is a deliberate design choice for gas efficiency.

6. **Contract self-destruct not supported**: The contracts do not implement `selfdestruct`. Once deployed, they are permanent.

### Tools run

- `forge build` - Compile contracts with solc 0.8.30, optimizer on (200 runs)
- `forge test -vv` - Run 26 tests (9 RuleRegistry + 17 Feed) with 100% branch coverage on src/
- `forge fmt` - Format Solidity files
- `forge coverage` - Report coverage for src/ (100% on both RuleRegistry and Feed)
- `slither .` - Run static analysis (2 informational findings: expected low-level calls in withdraw, and a false positive for missing inheritance)
- No OpenZeppelin dependencies (as per spec: install forge-std only)