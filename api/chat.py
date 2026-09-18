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

def add_user_message(messages, content):
    """Add a user message to the messages list."""
    messages.append({"role": "user", "content": content})

def add_assistant_message(messages, content):
    """Add a assistant message to the messages list."""
    messages.append({"role": "assistant", "content": content})

def chat(messages, **kwargs):
    message = client.messages.create(
        model=MODEL,
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=messages,
        **kwargs,
    )
    return message.content[0].text 


def chat_with_stop_sequences(messages, prompt):
    """Demonstrate JSON output using assistant prefilling and a stop sequence."""

    add_user_message(
        messages,
        prompt + "\nReturn only JSON with the keys summary and sentiment.",
    )

    # Prefill the assistant response to guide Claude into a JSON code block.
    # Assistant-prefill content cannot end with trailing whitespace.
    prefill = "```json"
    add_assistant_message(messages, prefill)
    response = chat(messages, stop_sequences=["```"])

    # The API returns text after the prefill; return just the clean JSON content.
    return response


def main() -> int:
    args = sys.argv[1:]
    stream = "--stream" in args
    prompt = " ".join(a for a in args if a != "--stream")

    if not prompt:
        messages = []
        while True:
            prompt = input("Prompt: ")
            add_user_message(messages, prompt)
            response = chat_with_stop_sequences(messages, prompt)
            print(response)
            add_assistant_message(messages, response)
    else:
        try:
            ask(prompt)
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
