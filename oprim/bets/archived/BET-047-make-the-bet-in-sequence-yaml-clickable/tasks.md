# Tasks: Clickable sequencing board entries via OSC 8 hyperlinks

## 1. Hyperlink rendering helper
- [x] 1.1 Add a shared helper that wraps a display string in an OSC 8 escape sequence given a `file://` URI
- [x] 1.2 Resolve each bet entry's `bet-decision.md` path via `resolveBetDirectory()`

## 2. Wire into existing output
- [x] 2.1 Apply the hyperlink helper to sequencing board entries printed by `oprim ovw`'s `renderLane()` (the actual board renderer — `oprim doctor`/`oprim validate` print check pass/fail lines, not board entries, so they're out of scope)

## 3. Verification
- [ ] 3.1 Manually verify clickable links open the correct file in iTerm2 and VS Code's integrated terminal
- [ ] 3.2 Verify output remains readable (no stray escape characters) in a terminal without OSC 8 support
