from streamlit_domain.models import CustomSplit, Item, Person, SummaryResult
from streamlit_domain.running import build_running_rows


def test_build_running_rows_includes_tax_tip_and_total() -> None:
    people = [Person(id="a", name="Alice"), Person(id="b", name="Bob")]
    items = [Item(id="1", name="Food", cost=10, payer="Split", custom=CustomSplit(values={}))]
    summary = SummaryResult(
        subtotals=[5.0, 5.0],
        tax_shares=[0.5, 0.5],
        tip_shares=[0.4, 0.4],
        totals=[5.9, 5.9],
    )

    rows = build_running_rows(people, items, summary, tax_amount=1.0, tip_amount=0.8)

    assert rows[0].name == "Food"
    assert rows[1].name == "Tax"
    assert rows[2].name == "Tip"
    assert rows[-1].name == "TOTAL"
    assert rows[-1].is_total is True
    assert rows[-1].cost == 11.8
