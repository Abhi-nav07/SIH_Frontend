"""Operational confidence score (V0.3 spec item 16 — "HIGH-VALUE FEATURE").

Deterministic and explainable, NOT ML. Combines four named, weighted
factors so any score can be justified line-by-line in a demo:

  confidence = w1*source_reliability + w2*freshness_factor
             + w3*manual_verification_bonus + w4*agreement_factor

Weights are configured in app/core/config.py and must sum to 1.0.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.core.config import Settings
from app.services.freshness_service import Freshness


@dataclass(frozen=True)
class ConfidenceBreakdown:
    score: float  # 0-100
    source_reliability: float  # 0-1 input
    freshness_factor: float  # 0-1
    manual_verification_bonus: float  # 0-1
    agreement_factor: float  # 0-1
    reason: str


_FRESHNESS_FACTOR = {
    Freshness.FRESH: 1.0,
    Freshness.STALE: 0.5,
    Freshness.EXPIRED: 0.15,
    Freshness.UNKNOWN: 0.2,
}


def compute_confidence(
    *,
    source_reliability: float,
    freshness: Freshness,
    manually_verified: bool,
    has_conflict: bool,
    settings: Settings,
) -> ConfidenceBreakdown:
    source_reliability = max(0.0, min(1.0, source_reliability))
    freshness_factor = _FRESHNESS_FACTOR[freshness]
    manual_bonus = 1.0 if manually_verified else 0.3
    agreement_factor = 0.2 if has_conflict else 1.0

    raw = (
        settings.confidence_weight_source_reliability * source_reliability
        + settings.confidence_weight_freshness * freshness_factor
        + settings.confidence_weight_manual_verification * manual_bonus
        + settings.confidence_weight_source_agreement * agreement_factor
    )
    score = round(max(0.0, min(1.0, raw)) * 100)

    reasons = []
    if has_conflict:
        reasons.append("conflicting sources")
    if freshness in (Freshness.STALE, Freshness.EXPIRED, Freshness.UNKNOWN):
        reasons.append(f"data {freshness.value.lower()}")
    if manually_verified:
        reasons.append("manually field-verified")
    reason = ", ".join(reasons) if reasons else "fresh, single-source, unverified"

    return ConfidenceBreakdown(
        score=score,
        source_reliability=source_reliability,
        freshness_factor=freshness_factor,
        manual_verification_bonus=manual_bonus,
        agreement_factor=agreement_factor,
        reason=reason,
    )
