# claude-learning-sandbox

A personal sandbox for learning and experimenting with Claude Code, MCP, agent skills, subagents, and the Claude API.

## Plan

### Minimal criteria

1. Pass courses:
   - Claude Code in Action
   - Introduction to Model Context Protocol
   - Model Context Protocol: Advanced Topics
   - Introduction to agent skills
   - Introduction to subagents
   - Building with the Claude API
2. Pass the [Mock Exam (CCA-F)](https://godelonline.sharepoint.com/Divisions/DeliveryDivisions/AI_Engineering/SitePages/Claude-Learning---Mock-Exam-(CCA-F).aspx)
3. Practical work: build a reliable agentic workflow with Claude Code (idea TBD)

### Optional

- Anthropic Claude certification (details TBD)

## Kids Timer

A simple, kid-friendly countdown timer website: pick a preset or custom duration, watch a circular countdown, and get an audio alert when time is up.

Plain HTML/CSS/JS, no build step or dependencies.

Lives in [`kids-timer/`](kids-timer).

**Run it:**
- Open `kids-timer/index.html` directly in a browser, or
- Serve it locally, e.g. `cd kids-timer && python3 -m http.server` and visit `http://localhost:8000`

**Files:**
- `kids-timer/index.html` — page structure and controls
- `kids-timer/styles.css` — styling
- `kids-timer/script.js` — timer logic (countdown, presets, custom duration, pause/reset, alarm sound)

## Claude Code Shortcuts Cheatsheet

A few keyboard shortcuts worth remembering while using Claude Code (exact keys vary a bit by platform/terminal — press `?` on an empty prompt for the live list):

| Shortcut | Action |
|---|---|
| `Esc` | Interrupt Claude's current response |
| `Esc` `Esc` | Clear input draft / open rewind menu (when input is empty) |
| `Ctrl+C` | Clear prompt (1st press) / exit (2nd press) |
| `Ctrl+D` | Exit session |
| `Ctrl+L` | Redraw a garbled screen |
| `Ctrl+R` | Reverse search command history |
| `Up` / `Down` | Navigate command history |
| `Ctrl+A` / `Ctrl+E` | Jump to start / end of line |
| `Ctrl+U` / `Ctrl+K` | Delete to start / end of line |
| `\` + `Enter` or `Shift+Enter` | Insert a newline (multiline prompt) |
| `Tab` | Accept autocomplete suggestion |
| `@` | Mention a file path |
| `/` | Open the slash command menu |
| `!` | Run a shell command directly |
| `Shift+Tab` | Cycle permission mode (manual / accept-edits / plan / bypass / auto) |
| `Ctrl+O` | Toggle the transcript viewer |
| `Ctrl+V` | Paste an image from clipboard |
| `Ctrl+B` | Background the running task |
| `/btw` | Ask a side question without adding it to conversation history |

Full reference: [Claude Code interactive mode docs](https://code.claude.com/docs/en/interactive-mode.md)
