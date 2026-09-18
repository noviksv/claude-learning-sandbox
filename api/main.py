"""Minimal examples of querying the Claude API with the official Anthropic SDK.

Usage:
    uv run main.py "Why is the sky blue?"
    uv run main.py --stream "Write a haiku about countdown timers."
"""

import os
import sys

import anthropic
from dotenv import load_dotenv

load_dotenv()

# Claude Opus 5 thinks adaptively by default, so no `thinking` parameter is needed.
MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5")
SYSTEM_PROMPT = "You are a concise assistant. Answer in at most three sentences."

# The client reads ANTHROPIC_API_KEY from the environment - never hardcode a key.
client = anthropic.Anthropic()


def ask(prompt: str) -> None:
    """Single request, single response - the simplest way to query Claude."""
    response = client.messages.create(
        model=MODEL,
        max_tokens=16000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    # response.content is a list of blocks (text, thinking, tool_use, ...),
    # so check .type before reading .text.
    for block in response.content:
        if block.type == "text":
            print(block.text)

    usage = response.usage
    print(
        f"\n[{response.model}] in={usage.input_tokens} out={usage.output_tokens} "
        f"stop={response.stop_reason}",
        file=sys.stderr,
    )


def ask_streaming(prompt: str) -> None:
    """Same query, streamed token by token - what you want for a chat UI."""
    with client.messages.stream(
        model=MODEL,
        max_tokens=64000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
        print()

        final = stream.get_final_message()
        print(f"\n[{final.model}] out={final.usage.output_tokens}", file=sys.stderr)


def main() -> int:
    args = sys.argv[1:]
    stream = "--stream" in args
    prompt = " ".join(a for a in args if a != "--stream")

    if not prompt:
        print(f"usage: {sys.argv[0]} [--stream] <prompt>", file=sys.stderr)
        return 2

    try:
        ask_streaming(prompt) if stream else ask(prompt)
    except anthropic.AuthenticationError:
        print("Invalid or missing ANTHROPIC_API_KEY (see .env.example).", file=sys.stderr)
        return 1
    except anthropic.RateLimitError as e:
        retry_after = e.response.headers.get("retry-after", "60")
        print(f"Rate limited - retry after {retry_after}s.", file=sys.stderr)
        return 1
    except anthropic.APIStatusError as e:
        print(f"API error {e.status_code}: {e.message}", file=sys.stderr)
        return 1
    except anthropic.APIConnectionError:
        print("Network error - could not reach the API.", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
