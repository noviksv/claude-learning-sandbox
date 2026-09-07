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

A simple, kid-friendly countdown timer website. See [`kids-timer/README.md`](kids-timer/README.md).

## Subagents

Benefits of using subagents (e.g. Claude Code's `Task`/agent tool) instead of doing everything in the main conversation:

- **Context isolation** — a subagent does its work (searching, reading files, multi-step tasks) in its own context window, so noisy intermediate output (grep results, file dumps, tool traces) doesn't pollute the main conversation. You get back a distilled summary instead of everything it looked at.
- **Parallelism** — multiple subagents can run at once to explore different parts of a codebase or investigate independent questions simultaneously, rather than working serially.
- **Specialization** — agents with a narrower tool set and purpose (e.g. an explore-only agent, or a project-specific tester agent) are faster and more focused for that kind of work than a general-purpose pass.
- **Non-blocking work (forks)** — a forked subagent can run in the background while the main conversation continues, useful for research or long tasks whose raw output isn't needed directly.

Tradeoff: each fresh (non-fork) subagent starts with zero context, so spawning one for a trivial task costs more than it saves — best reserved for genuinely complex, multi-step, or context-heavy work.

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
