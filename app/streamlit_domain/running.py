from __future__ import annotations

from .math_utils import round2
from .models import Item, Person, RunningRow, RunningRowShare, SummaryResult
from .splits import compute_shares_for_item


def build_running_rows(
    people: list[Person],
    items: list[Item],
    summary: SummaryResult,
    tax_amount: float,
    tip_amount: float,
) -> list[RunningRow]:
    rows: list[RunningRow] = []

    for item in items:
        cost = item.cost or 0.0
        if cost <= 0:
            continue
        shares, payer_display = compute_shares_for_item(item, people)
        rows.append(
            RunningRow(
                name=item.name.strip() or "Unnamed Item",
                cost=cost,
                payer=payer_display,
                shares=[
                    RunningRowShare(name=person.name, amount=shares[idx])
                    for idx, person in enumerate(people)
                ],
            )
        )

    if tax_amount > 0:
        rows.append(
            RunningRow(
                name="Tax",
                cost=tax_amount,
                payer="Split by ratio",
                shares=[
                    RunningRowShare(name=person.name, amount=summary.tax_shares[idx])
                    for idx, person in enumerate(people)
                ],
            )
        )

    if tip_amount > 0:
        rows.append(
            RunningRow(
                name="Tip",
                cost=tip_amount,
                payer="Split by ratio",
                shares=[
                    RunningRowShare(name=person.name, amount=summary.tip_shares[idx])
                    for idx, person in enumerate(people)
                ],
            )
        )

    grand_total = round2(sum(summary.totals))
    rows.append(
        RunningRow(
            name="TOTAL",
            cost=grand_total,
            payer="",
            shares=[
                RunningRowShare(name=person.name, amount=summary.totals[idx])
                for idx, person in enumerate(people)
            ],
            is_total=True,
        )
    )

    return rows
