# Design: Clickable sequencing board entries via OSC 8 hyperlinks

## Approach
OSC 8 is a standard terminal escape sequence (`\e]8;;<uri>\e\\<text>\e]8;;\e\\`) supported by iTerm2, modern VS Code integrated terminal, and other common emulators. `oprim ovw` is the command that actually renders the sequencing board (id + title per lane, via `renderLane()`) — `oprim doctor`/`oprim validate` only print pass/fail check lines, not board entries, so they're out of scope here. Wrap each rendered bet entry in `renderLane()` with an OSC 8 link pointing at a `file://` URI for that bet's `bet-decision.md` (resolved via the same `resolveBetDirectory()` helper `spec-delta.ts` already uses, via a new shared `lib/hyperlink.ts`).

The escape sequence is emitted unconditionally rather than gated behind terminal-capability detection — unsupported terminals either strip it silently or display it as a no-op, and detecting OSC 8 support reliably across terminals is not worth the complexity for a purely cosmetic enhancement.

`sequence.yaml` itself is untouched; the hyperlink is a render-time transform applied only when printing board output, not part of the persisted data model.

## Alternatives considered
- **Print the file path as plain text next to each entry**: works everywhere but adds visual clutter and requires manual copy/open. Rejected — OSC 8 gives a strictly better experience on supporting terminals with no downside on non-supporting ones.
- **Detect OSC 8 support and conditionally apply**: adds complexity (env var sniffing is unreliable) for marginal benefit, since unsupported terminals already degrade gracefully by ignoring the escape sequence.

## Risks
- Low risk: purely additive to terminal output formatting. Main risk is a malformed escape sequence corrupting output in some terminals — mitigated by using the well-established, minimal OSC 8 format and testing against common emulators (iTerm2, VS Code terminal, plain Terminal.app) before shipping.
