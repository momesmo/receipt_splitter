from streamlit_domain.math_utils import dollars_to_cents
from streamlit_domain.models import CustomSplit, Item, Person
from streamlit_domain.splits import (
    allocate_tax_tip,
    compute_shares_for_item,
    compute_subtotals,
    compute_summary,
    count_invalid_custom_items,
    even_split_shares,
    get_custom_split_progress,
    is_custom_split_valid,
)


alice = Person(id="a", name="Alice")
bob = Person(id="b", name="Bob")
two_people = [alice, bob]


def test_even_split_shares_remainder_last_person() -> None:
    shares = even_split_shares(10.01, 2)
    assert round(shares[0] + shares[1], 5) == 10.01
    assert shares[0] == 5.00
    assert round(shares[1], 5) == 5.01


def test_compute_subtotals_custom_percent_valid() -> None:
    items = [
        Item(
            id="1",
            name="x",
            cost=100,
            payer="Custom",
            custom=CustomSplit(type="percent", values={"a": "60", "b": "40"}),
        )
    ]
    assert compute_subtotals(two_people, items) == [60.0, 40.0]


def test_compute_subtotals_omit_invalid_custom() -> None:
    items = [
        Item(
            id="1",
            name="x",
            cost=100,
            payer="Custom",
            custom=CustomSplit(type="percent", values={"a": "50", "b": "40"}),
        )
    ]
    assert compute_subtotals(two_people, items) == [0.0, 0.0]


def test_allocate_tax_tip_ratio_last_gets_remainder() -> None:
    tax_shares, tip_shares = allocate_tax_tip([30, 70], 10, 5)
    assert round(sum(tax_shares), 5) == 10
    assert round(sum(tip_shares), 5) == 5


def test_compute_summary_totals_balance() -> None:
    items = [Item(id="1", name="Food", cost=50, payer="Split", custom=CustomSplit(values={}))]
    summary = compute_summary(two_people, items, 5, 3)
    assert round(summary.totals[0] + summary.totals[1], 5) == 58


def test_custom_dollar_validation_off_by_one_cent_invalid() -> None:
    item = Item(
        id="1",
        name="x",
        cost=10,
        payer="Custom",
        custom=CustomSplit(type="dollar", values={"a": "5.00", "b": "4.99"}),
    )
    assert is_custom_split_valid(item, two_people, 10) is False


def test_count_invalid_custom_items() -> None:
    items = [
        Item(
            id="1",
            name="bad",
            cost=10,
            payer="Custom",
            custom=CustomSplit(type="percent", values={"a": "50", "b": "40"}),
        ),
        Item(
            id="2",
            name="ok",
            cost=10,
            payer="Custom",
            custom=CustomSplit(type="percent", values={"a": "50", "b": "50"}),
        ),
    ]
    assert count_invalid_custom_items(items, two_people) == 1


def test_compute_shares_for_item_invalid_custom_is_zero() -> None:
    item = Item(
        id="1",
        name="x",
        cost=10,
        payer="Custom",
        custom=CustomSplit(type="percent", values={"a": "10", "b": "10"}),
    )
    shares, _ = compute_shares_for_item(item, two_people)
    assert all(share == 0 for share in shares)


def test_get_custom_split_progress_percent() -> None:
    item = Item(
        id="1",
        name="x",
        cost=50,
        payer="Custom",
        custom=CustomSplit(type="percent", values={"a": "50", "b": "25"}),
    )
    progress = get_custom_split_progress(item, two_people, 50)
    assert progress is not None
    assert progress["mode"] == "percent"
    assert progress["current"] == 75
    assert progress["target"] == 100
    assert progress["ratio"] == 0.75


def test_custom_percent_validation_allows_high_precision_values() -> None:
    item = Item(
        id="1",
        name="x",
        cost=100,
        payer="Custom",
        custom=CustomSplit(
            type="percent",
            values={"a": "33.333333", "b": "66.666667"},
        ),
    )
    assert is_custom_split_valid(item, two_people, 100) is True


def test_dollars_to_cents_parity() -> None:
    assert dollars_to_cents(5.0) + dollars_to_cents(4.99) == 999
    assert dollars_to_cents(10.0) == 1000
