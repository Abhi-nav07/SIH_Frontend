import asyncio

from app.copilot.brief import generate_brief
from app.copilot.engine import answer_query
from app.copilot.llm_provider import MockLLMProvider
from app.explainability.plan_change import explain_plan_change
from app.schemas.outputs import WhatIfChange, WhatIfChangeType
from app.simulator.whatif import apply_change


def run(coro):
    return asyncio.run(coro)


# 11. plan-change explanation references actual changed facts
def test_plan_change_explanation_references_changed_facts(baseline_snapshot):
    new_snapshot, _ = apply_change(baseline_snapshot, WhatIfChange(type=WhatIfChangeType.BRIDGE_FAILURE, target_id="bridge-3"))
    result = explain_plan_change(baseline_snapshot, new_snapshot)
    assert any("Bridge-3" in t for t in result.trigger)
    assert result.new_recommendation is not None


# 12. 30-second brief includes top actions
def test_brief_includes_top_actions(baseline_snapshot):
    brief = generate_brief(baseline_snapshot)
    assert len(brief.top_actions) > 0
    assert brief.top_actions[0] != "No active recommendations."


# 13. copilot cannot answer unsupported facts
def test_copilot_refuses_unsupported_question(baseline_snapshot):
    response = run(answer_query(baseline_snapshot, "What is the president's opinion on this disaster?"))
    assert response.intent == "UNSUPPORTED"
    assert response.confidence == 0.0
    assert "outside what the copilot can answer" in response.answer


def test_copilot_priority_question(baseline_snapshot):
    response = run(answer_query(baseline_snapshot, "Which village should be evacuated first and why?"))
    assert response.intent == "PRIORITY"
    assert "Village Alpha" in response.answer
    assert len(response.evidence) > 0


# 14. mock provider works without API key
def test_mock_provider_requires_no_api_key():
    provider = MockLLMProvider()
    result = run(provider.generate("system", {"answer_template": "hello"}, "question"))
    assert result == "hello"
