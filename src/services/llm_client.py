"""LLM client abstraction — Anthropic preferred, OpenAI fallback."""

from __future__ import annotations

import os
from typing import Optional


class LLMClient:
    def __init__(self) -> None:
        self._anthropic = None
        self._openai = None
        self._provider = self._detect_provider()

    def _detect_provider(self) -> str:
        if os.getenv("ANTHROPIC_API_KEY"):
            return "anthropic"
        if os.getenv("OPENAI_API_KEY"):
            return "openai"
        return "mock"

    def _get_anthropic(self):
        if self._anthropic is None:
            import anthropic
            self._anthropic = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        return self._anthropic

    def _get_openai(self):
        if self._openai is None:
            from openai import OpenAI
            self._openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        return self._openai

    def complete(
        self,
        system: str,
        user: str,
        max_tokens: int = 2000,
        temperature: float = 0.3,
    ) -> str:
        if self._provider == "anthropic":
            model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022")
            client = self._get_anthropic()
            resp = client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            return resp.content[0].text

        if self._provider == "openai":
            model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            client = self._get_openai()
            resp = client.chat.completions.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
            return resp.choices[0].message.content or ""

        # Mock provider for testing without API keys
        return '{"error": "No LLM API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY."}'


_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    global _client
    if _client is None:
        _client = LLMClient()
    return _client
