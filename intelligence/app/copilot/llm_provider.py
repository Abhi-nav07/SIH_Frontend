"""
LLM provider abstraction (V0.4 prompt §12).

The copilot core reasoning is deterministic (intent parser -> tools ->
structured evidence). An LLMProvider is only ever used to *verbalize*
already-computed structured results into fluent language -- never to
originate facts. MockLLMProvider requires no API key and is the default,
so the SIH demo never depends on external AI availability (prompt §18).
"""

from __future__ import annotations

from typing import Protocol


class LLMProvider(Protocol):
    async def generate(self, system_prompt: str, structured_context: dict, question: str) -> str:
        ...


class MockLLMProvider:
    """Deterministic templated 'verbalizer'. No network calls, no API key."""

    async def generate(self, system_prompt: str, structured_context: dict, question: str) -> str:
        # Purely template-based: turns structured_context['answer_template']
        # (already fully computed by deterministic tools) into a sentence.
        # This keeps behavior identical with or without a real LLM behind it.
        template = structured_context.get("answer_template")
        if template:
            return template
        return "No structured answer template was provided; unable to verbalize a grounded response."


class AnthropicProvider:
    """Optional. Only used if explicitly configured with an API key.
    Not wired to any network call in this repo -- placeholder so the
    provider abstraction is real and swappable without hardcoding a vendor.
    """

    def __init__(self, api_key: str | None = None, model: str = "claude-sonnet-4-6"):
        self.api_key = api_key
        self.model = model

    async def generate(self, system_prompt: str, structured_context: dict, question: str) -> str:
        if not self.api_key:
            raise RuntimeError("AnthropicProvider requires an API key; falling back to MockLLMProvider is recommended.")
        raise NotImplementedError(
            "Real Anthropic API call intentionally not implemented in this prototype; "
            "wire this up with the official SDK when an API key is available."
        )


class OpenAICompatibleProvider:
    """Optional, same non-networked placeholder shape as AnthropicProvider."""

    def __init__(self, api_key: str | None = None, base_url: str | None = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model

    async def generate(self, system_prompt: str, structured_context: dict, question: str) -> str:
        if not self.api_key:
            raise RuntimeError("OpenAICompatibleProvider requires an API key; falling back to MockLLMProvider is recommended.")
        raise NotImplementedError("Real API call intentionally not implemented in this prototype.")


class GeminiProvider:
    """Optional, same non-networked placeholder shape as AnthropicProvider."""

    def __init__(self, api_key: str | None = None, model: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model = model

    async def generate(self, system_prompt: str, structured_context: dict, question: str) -> str:
        if not self.api_key:
            raise RuntimeError("GeminiProvider requires an API key; falling back to MockLLMProvider is recommended.")
        raise NotImplementedError("Real API call intentionally not implemented in this prototype.")


def get_default_provider() -> LLMProvider:
    """No secrets committed to repo; always default to the mock provider unless
    the caller explicitly supplies a configured provider instance."""
    return MockLLMProvider()
