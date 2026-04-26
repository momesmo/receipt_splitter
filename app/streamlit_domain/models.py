from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

CustomSplitType = Literal["percent", "dollar"]


@dataclass
class Person:
    id: str
    name: str


@dataclass
class CustomSplit:
    type: CustomSplitType = "percent"
    values: dict[str, str] = field(default_factory=dict)


@dataclass
class Item:
    id: str
    name: str = ""
    cost: float | None = None
    payer: str = ""
    custom: CustomSplit = field(default_factory=CustomSplit)


@dataclass
class SummaryResult:
    subtotals: list[float]
    tax_shares: list[float]
    tip_shares: list[float]
    totals: list[float]


@dataclass
class RunningRowShare:
    name: str
    amount: float


@dataclass
class RunningRow:
    name: str
    cost: float
    payer: str
    shares: list[RunningRowShare]
    is_total: bool = False
