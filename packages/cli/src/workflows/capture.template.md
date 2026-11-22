---
name: oprim-capture
description: Append a timestamped item to inbox.md — capture now, triage later
---

Append one item to `inbox.md` at the project root. Capture is meant to take seconds: do not ask follow-up questions, do not classify, do not route. Routing happens later in `/oprim:triage`.

## Steps

### 1. Get the text
Use the text the user passed (e.g. `oprim-capture "checkout latency complaints from sales"`). Only if no text was given at all, ask once: "What do you want to capture?"

### 2. Append the item
Append exactly one line to the end of `inbox.md`:
```
- [ ] <YYYY-MM-DD HH:MM> <text>
```
Use the current local date and time. Keep the text as given, on one line (replace line breaks with spaces). If `inbox.md` does not exist, create it with a `# Inbox` heading, a blank line, then the item. Never edit or reorder existing lines; if the file's last line is the empty placeholder `-`, leave it and append after it.

### 3. Confirm in one line
Reply with the line you appended and nothing else — no suggestions about where it belongs.
