# Algorithm Marketplace: Security Considerations

## Design Choices

1. **Native-token tips only**: No ERC20, ERC721, or other token transfers. This eliminates complex token logic vulnerabilities.

2. **No owner/admin/upgradeability**: Once deployed, contracts cannot be modified. This removes rug-pull risk but means bugs cannot be patched.

3. **Pull payments**: Tips accumulate in `_pending` balances; users must call `withdraw()` to receive funds. This avoids reentrancy during tip processing.

4. **Reentrancy-protected withdraw**: `nonReentrant` modifier uses Checks-Effects-Interactions pattern. Effects (balance zeroing) happen before the external `call`.

5. **Weights must sum to exactly 10,000 basis points**: Prevents ranking algorithm manipulation.

6. **Immutable rules**: Once published, rules cannot be modified. Only new rules can be added.

## Accepted Limitations

1. **No anti-Sybil for rule backers**: `backerCount` counts unique tippers, but a single address can tip multiple times to game ranking. Frontend must enforce anti-Sybil rules.

2. **No pausability**: No `pause()` function. Critical bugs require deploying new contracts.

3. **Tip rounding**: 10% rule share rounded down; for tips < 10 wei, rule author receives 0.

4. **No protection against very small tips**: 0 wei tips revert intentionally.

5. **No zero-address checks for posters/tippers**: Deliberate gas efficiency choice.

6. **Permanent contracts**: No `selfdestruct` support.

## Tools Run

- `forge build` - Compile with solc 0.8.30, optimizer on (200 runs)
- `forge test -vv` - 26 tests passing, 100% branch coverage on src/
- `forge fmt` - Solidty formatting
- `forge coverage` - 100% coverage on src/RuleRegistry.sol and src/Feed.sol
- `slither .` - 2 informational findings (expected low-level calls, false positive missing inheritance)