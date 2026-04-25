from __future__ import annotations

from .math_utils import dollars_to_cents, round2
from .models import Item, Person, SummaryResult


def _parse_custom_values(item: Item, people: list[Person]) -> list[float]:
    parsed: list[float] = []
    for person in people:
        raw = item.custom.values.get(person.id, "")
        try:
            parsed.append(float(raw) if raw != "" else 0.0)
        except ValueError:
            parsed.append(0.0)
    return parsed


def _sum_custom_dollar_inputs_cents(values: list[float]) -> int:
    return sum(dollars_to_cents(v) for v in values)


def _sum_custom_percent_basis_points(values: list[float]) -> int:
    return round(sum(values) * 100)


def even_split_shares(cost: float, n_people: int) -> list[float]:
    if n_people <= 0:
        return []
    even_share = (cost / n_people * 100 // 1) / 100
    distributed = even_share * n_people
    remainder = round2(cost - distributed)
    shares = [even_share for _ in range(n_people)]
    if remainder != 0:
        shares[-1] = round2(shares[-1] + remainder)
    return shares


def get_custom_split_progress(item: Item, people: list[Person], cost: float) -> dict | None:
    if item.payer != "Custom":
        return None
    values = _parse_custom_values(item, people)
    if item.custom.type == "percent":
        current = sum(values)
        return {"current": current, "target": 100.0, "mode": "percent", "ratio": current / 100.0}
    if item.custom.type == "dollar":
        sum_cents = _sum_custom_dollar_inputs_cents(values)
        sum_dollars = sum_cents / 100
        if cost <= 0:
            return {"current": sum_dollars, "target": 0.0, "mode": "dollar", "ratio": 0.0}
        cost_cents = dollars_to_cents(cost)
        ratio = (sum_cents / cost_cents) if cost_cents > 0 else 0.0
        return {"current": sum_dollars, "target": cost, "mode": "dollar", "ratio": ratio}
    return None


def is_custom_split_valid(item: Item, people: list[Person], cost: float) -> bool:
    if item.payer != "Custom":
        return True
    if cost <= 0:
        return True
    values = _parse_custom_values(item, people)
    if item.custom.type == "percent":
        return _sum_custom_percent_basis_points(values) == 10_000
    if item.custom.type == "dollar":
        return _sum_custom_dollar_inputs_cents(values) == dollars_to_cents(cost)
    return True


def is_payer_valid(item: Item, people: list[Person]) -> bool:
    if not item.payer:
        return False
    ids = {person.id for person in people}
    return item.payer in ids or item.payer in {"Split", "Custom"}


def compute_subtotals(people: list[Person], items: list[Item]) -> list[float]:
    subtotals = [0.0 for _ in people]

    for item in items:
        cost = item.cost or 0.0
        if not item.payer:
            continue

        payer_idx = next((i for i, person in enumerate(people) if person.id == item.payer), -1)
        if payer_idx >= 0:
            subtotals[payer_idx] += cost
        elif item.payer == "Split":
            shares = even_split_shares(cost, len(people))
            for i in range(len(people)):
                subtotals[i] += shares[i]
        elif item.payer == "Custom" and is_custom_split_valid(item, people, cost):
            values = _parse_custom_values(item, people)
            if item.custom.type == "percent":
                for i in range(len(people)):
                    subtotals[i] += cost * (values[i] / 100)
            elif item.custom.type == "dollar":
                for i in range(len(people)):
                    subtotals[i] += values[i]

    return [round2(value) for value in subtotals]


def allocate_tax_tip(
    rounded_subtotals: list[float], tax_amount: float, tip_amount: float
) -> tuple[list[float], list[float]]:
    n_people = len(rounded_subtotals)
    tax_shares = [0.0 for _ in range(n_people)]
    tip_shares = [0.0 for _ in range(n_people)]
    total_subtotal = sum(rounded_subtotals)

    if total_subtotal > 0 and n_people > 0:
        distributed = 0.0
        for i in range(n_people - 1):
            tax_shares[i] = round2((rounded_subtotals[i] / total_subtotal) * tax_amount)
            distributed += tax_shares[i]
        tax_shares[-1] = round2(tax_amount - distributed)

        distributed = 0.0
        for i in range(n_people - 1):
            tip_shares[i] = round2((rounded_subtotals[i] / total_subtotal) * tip_amount)
            distributed += tip_shares[i]
        tip_shares[-1] = round2(tip_amount - distributed)

    return tax_shares, tip_shares


def compute_summary(
    people: list[Person], items: list[Item], tax_amount_raw: float, tip_amount_raw: float
) -> SummaryResult:
    rounded_subtotals = compute_subtotals(people, items)
    tax_amount = tax_amount_raw or 0.0
    tip_amount = tip_amount_raw or 0.0
    tax_shares, tip_shares = allocate_tax_tip(rounded_subtotals, tax_amount, tip_amount)
    totals = [
        round2(subtotal + tax_shares[idx] + tip_shares[idx])
        for idx, subtotal in enumerate(rounded_subtotals)
    ]
    return SummaryResult(
        subtotals=rounded_subtotals,
        tax_shares=tax_shares,
        tip_shares=tip_shares,
        totals=totals,
    )


def compute_shares_for_item(item: Item, people: list[Person]) -> tuple[list[float], str]:
    cost = item.cost or 0.0
    shares = [0.0 for _ in people]
    payer_display = ""

    payer_idx = next((i for i, person in enumerate(people) if person.id == item.payer), -1)
    if payer_idx >= 0:
        shares[payer_idx] = cost
        payer_display = people[payer_idx].name
    elif item.payer == "Split":
        even_shares = even_split_shares(cost, len(people))
        for i in range(len(people)):
            shares[i] = even_shares[i]
        payer_display = "Split Evenly"
    elif item.payer == "Custom":
        payer_display = "Custom Split"
        if is_custom_split_valid(item, people, cost):
            values = _parse_custom_values(item, people)
            if item.custom.type == "percent":
                for i in range(len(people)):
                    shares[i] = cost * (values[i] / 100)
            elif item.custom.type == "dollar":
                for i in range(len(people)):
                    shares[i] = values[i]
    else:
        payer_display = item.payer or ""

    return shares, payer_display


def count_invalid_custom_items(items: list[Item], people: list[Person]) -> int:
    total = 0
    for item in items:
        if item.payer != "Custom":
            continue
        cost = item.cost or 0.0
        if cost <= 0:
            continue
        if not is_custom_split_valid(item, people, cost):
            total += 1
    return total
