# Claude API Example

A minimal Python program that queries the Claude API with the official [`anthropic`](https://github.com/anthropics/anthropic-sdk-python) SDK — one non-streaming request and one streaming request.

## Prerequisites

- Python 3.10+
- [uv](https://docs.astral.sh/uv/)
- An Anthropic API key

## Setup

```bash
cp .env.example .env   # then paste your key into ANTHROPIC_API_KEY
uv sync
```

`.env` is gitignored. If `ANTHROPIC_API_KEY` is already exported in your shell, you can skip the `.env` entirely — the SDK client reads it from the environment.

## Run

```bash
uv run main.py "Why is the sky blue?"
uv run main.py --stream "Write a haiku about countdown timers."
```

Token usage and the stop reason are printed to stderr, so `uv run main.py "..." 2>/dev/null` gives you just the answer.

## What the code shows

| Concept | Where |
|---|---|
| Client picks up credentials from the environment | `anthropic.Anthropic()` — no key in code |
| One-shot request | `ask()` → `client.messages.create(...)` |
| Streaming responses | `ask_streaming()` → `client.messages.stream(...)` + `stream.text_stream` |
| Content is a list of *blocks*, not a string | the `block.type == "text"` loop |
| Usage / stop reason | `response.usage`, `response.stop_reason` |
| Typed error handling | the `except anthropic.*` chain in `main()` |

## Notes

- Model defaults to `claude-opus-5` and is overridable via `CLAUDE_MODEL` in `.env`, e.g.:

  ```
  CLAUDE_MODEL="claude-opus-5"      # most capable general model  ($5 / $25 per 1M tokens)
  CLAUDE_MODEL="claude-sonnet-5"    # balanced, high-volume       ($2 / $10)
  CLAUDE_MODEL="claude-haiku-4-5"   # fastest/cheapest, simple    ($1 / $5)
  ```

  Use the exact ID with no date suffix. Or override for one run: `CLAUDE_MODEL=claude-haiku-4-5 uv run main.py "hi"`.
- No `thinking` parameter is passed: Claude Opus 5 uses adaptive thinking by default. To see a summary of the reasoning, pass `thinking={"type": "adaptive", "display": "summarized"}` — the default is `"omitted"`, which returns empty thinking text.
- `max_tokens` is higher for the streaming path (64k vs 16k). Large values need streaming to avoid HTTP timeouts.
- The API is **stateless** — to hold a conversation you resend the whole message history each turn.
