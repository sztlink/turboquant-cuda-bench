"""Evidence-Paged KV experimental vLLM hook package.

This package is intentionally observe-first. It does not replace vLLM attention
and does not claim serving speedups. The first milestone is to prove a stable
runtime insertion boundary for a future v4/v5-style selected-evidence path.
"""

from .hook import observe_decode

__all__ = ["observe_decode"]
