# Decision: BET-059 Dry-run criteria metrics before bet ships

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — a broken Amplitude/BigQuery source mapping in `criteria.yaml` is currently only discovered at `oprim:review` time, potentially after the bet has already shipped
- **Usability risk**: Low-Medium — a save-time dry-run is a natural checkpoint, but must not block saving on a transient API/network failure
- **Feasibility risk**: High — depends on unverified hooks system; also requires live Amplitude/BigQuery credentials to be available at hook time, which may not always be true in a dev session
- **Business viability risk**: Low-Medium — touches live measurement infrastructure (`lib/measure.ts`), so a misfiring dry-run hook could burn API quota if triggered too frequently

## Why now
- A broken metric source mapping in `criteria.yaml` is currently only discovered at `oprim:review` time, after the bet has already shipped and the review window opened — too late to fix cheaply
- `lib/measure.ts` already has the Amplitude/BigQuery fetch logic to reuse for a dry-run

## Alternatives considered
- Status quo: broken metric mapping discovered at review time
- A `oprim criteria --check` CLI subcommand instead of a hook — same value, no dependency on the unverified hooks system, but requires the user to remember to run it

## Expected outcomes
- Broken metric source mappings caught: review time → `criteria.yaml` save time

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill and consider the CLI-subcommand alternative instead
- If dry-running on every save proves too costly or rate-limited against Amplitude/BigQuery, kill or debounce

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
