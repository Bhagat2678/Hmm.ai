"""
Unit and integration tests for graph neighborhood and failure scan interfaces.
"""

import pytest
from ai_ml.interfaces.graph_interface import get_graph_neighborhood, run_failure_scan


def test_get_graph_neighborhood_success():
    res = get_graph_neighborhood("PUMP-101A", depth=1)

    assert "nodes" in res
    assert "edges" in res
    assert isinstance(res["nodes"], list)
    assert isinstance(res["edges"], list)


def test_get_graph_neighborhood_empty():
    res = get_graph_neighborhood("")
    assert "nodes" in res
    assert "edges" in res
    assert isinstance(res["nodes"], list)
    assert isinstance(res["edges"], list)


def test_run_failure_scan_success():
    res = run_failure_scan("PUMP-101A")

    assert "risk_level" in res
    assert res["risk_level"] in ["high", "medium", "low"]
    assert "potential_failures" in res
    assert "recommendations" in res
    assert "alerts" in res
