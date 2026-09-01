import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest

from app.fixtures.uk_ff_001 import build_baseline_snapshot


@pytest.fixture
def baseline_snapshot():
    return build_baseline_snapshot()
