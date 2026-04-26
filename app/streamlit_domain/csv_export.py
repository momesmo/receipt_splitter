from __future__ import annotations

import csv
import io

from .models import Item, Person
from .splits import compute_shares_for_item, compute_summary


def _expense_to_label(item: Item, people: list[Person]) -> str:
    payer_idx = next((i for i, person in enumerate(people) if person.id == item.payer), -1)
    if payer_idx >= 0:
        return people[payer_idx].name
    if item.payer == "Split":
        return "Split Evenly"
    if item.payer == "Custom":
        return "Custom Split"
    return item.payer or ""


def build_csv_content(
    people: list[Person], items: list[Item], tax_amount: float, tip_amount: float
) -> str:
    summary = compute_summary(people, items, tax_amount, tip_amount)

    buffer = io.StringIO()
    writer = csv.writer(buffer, quoting=csv.QUOTE_ALL, lineterminator="\n")

    writer.writerow(["Item", "Cost", "Expense To", *[f"{person.name} Share" for person in people]])

    for item in items:
        cost = item.cost or 0.0
        shares, _ = compute_shares_for_item(item, people)
        writer.writerow(
            [
                item.name.strip() or "Unnamed Item",
                f"{cost:.2f}",
                _expense_to_label(item, people),
                *[f"{share:.2f}" for share in shares],
            ]
        )

    writer.writerow(["Tax", f"{tax_amount:.2f}", "Split by ratio", *[f"{v:.2f}" for v in summary.tax_shares]])
    writer.writerow(["Tip", f"{tip_amount:.2f}", "Split by ratio", *[f"{v:.2f}" for v in summary.tip_shares]])
    writer.writerow([])
    writer.writerow(["TOTALS", "", "", *[f"${total:.2f}" for total in summary.totals]])

    return buffer.getvalue()
