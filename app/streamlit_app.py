from __future__ import annotations

from dataclasses import replace

import streamlit as st

from streamlit_domain import (
    CustomSplit,
    Item,
    Person,
    build_csv_content,
    build_running_rows,
    compute_summary,
    count_invalid_custom_items,
    create_default_people,
    create_empty_item,
    generate_person_id,
    get_custom_split_progress,
    is_custom_split_valid,
    is_payer_valid,
    sync_all_items_people,
    sync_custom_values_with_people,
)


def format_currency(value: float) -> str:
    return f"${value:.2f}"


def init_state() -> None:
    if "people" not in st.session_state:
        st.session_state.people = create_default_people()
    if "items" not in st.session_state:
        st.session_state.items = [create_empty_item()]
    if "tax_amount" not in st.session_state:
        st.session_state.tax_amount = 0.0
    if "tip_amount" not in st.session_state:
        st.session_state.tip_amount = 0.0
    if "people_ids_key" not in st.session_state:
        st.session_state.people_ids_key = "|".join(person.id for person in st.session_state.people)


def sync_items_with_people_if_needed() -> None:
    next_key = "|".join(person.id for person in st.session_state.people)
    if next_key != st.session_state.people_ids_key:
        st.session_state.items = sync_all_items_people(st.session_state.items, st.session_state.people)
        st.session_state.people_ids_key = next_key


def add_person() -> None:
    next_idx = len(st.session_state.people) + 1
    new_people = [*st.session_state.people, Person(id=generate_person_id(), name=f"Person {next_idx}")]
    st.session_state.people = new_people
    sync_items_with_people_if_needed()


def delete_person(person_id: str) -> None:
    if len(st.session_state.people) <= 2:
        return
    st.session_state.people = [person for person in st.session_state.people if person.id != person_id]
    st.session_state.items = [
        replace(item, payer="" if item.payer == person_id else item.payer) for item in st.session_state.items
    ]
    sync_items_with_people_if_needed()


def add_item() -> None:
    st.session_state.items = [*st.session_state.items, create_empty_item()]


def remove_item(item_id: str) -> None:
    st.session_state.items = [item for item in st.session_state.items if item.id != item_id]
    if not st.session_state.items:
        st.session_state.items = [create_empty_item()]


def render_people_section() -> None:
    left, right = st.columns([3, 1])
    left.subheader("Configuration")
    if right.button("+ Add Person", use_container_width=True):
        add_person()
        st.rerun()

    for idx, person in enumerate(st.session_state.people):
        cols = st.columns([5, 1])
        new_name = cols[0].text_input(
            f"Person {idx + 1} Name",
            value=person.name,
            key=f"person-name-{person.id}",
            placeholder=f"Person {idx + 1}",
        )
        if new_name != person.name:
            st.session_state.people[idx] = replace(person, name=new_name)

        can_delete = len(st.session_state.people) > 2
        if cols[1].button("Delete", key=f"delete-person-{person.id}", disabled=not can_delete):
            delete_person(person.id)
            st.rerun()


def _payer_options(people: list[Person]) -> list[tuple[str, str]]:
    options = [("", "Select...")]
    options.extend((person.id, person.name) for person in people)
    options.extend([("Split", "Split Evenly"), ("Custom", "Custom Split")])
    return options


def render_items_section() -> None:
    st.subheader("Add Items")

    for index, item in enumerate(st.session_state.items, start=1):
        with st.container(border=True):
            st.markdown(f"**Item {index}**")
            row1 = st.columns([3, 1.2, 1.5, 1])
            name = row1[0].text_input(
                "Item Description",
                value=item.name,
                key=f"item-name-{item.id}",
                label_visibility="collapsed",
                placeholder="Enter item name",
            )
            cost = row1[1].number_input(
                "Cost ($)",
                value=float(item.cost) if item.cost is not None else 0.0,
                min_value=0.0,
                step=0.01,
                format="%.2f",
                key=f"item-cost-{item.id}",
                label_visibility="collapsed",
            )

            options = _payer_options(st.session_state.people)
            option_values = [opt[0] for opt in options]
            option_labels = {value: label for value, label in options}
            current_payer = item.payer if item.payer in option_values else ""
            payer = row1[2].selectbox(
                "Expense To",
                options=option_values,
                index=option_values.index(current_payer),
                format_func=lambda v: option_labels[v],
                key=f"item-payer-{item.id}",
                label_visibility="collapsed",
            )
            if row1[3].button("Remove", key=f"remove-item-{item.id}"):
                remove_item(item.id)
                st.rerun()

            updated = replace(item, name=name, cost=cost)
            if payer != item.payer:
                if payer == "Custom":
                    updated = sync_custom_values_with_people(replace(updated, payer=payer), st.session_state.people)
                else:
                    updated = replace(updated, payer=payer, custom=CustomSplit(type="percent", values={}))
            else:
                updated = replace(updated, payer=payer)

            payer_invalid = bool(updated.payer) and not is_payer_valid(updated, st.session_state.people)
            if payer_invalid:
                st.caption("Select a valid person or split option.")

            if updated.payer == "Custom":
                custom_values = dict(updated.custom.values)
                custom_cols = st.columns(len(st.session_state.people))
                for col, person in zip(custom_cols, st.session_state.people):
                    custom_values[person.id] = col.text_input(
                        f"{person.name} % or $",
                        value=custom_values.get(person.id, ""),
                        key=f"custom-value-{item.id}-{person.id}",
                    )
                custom_type = st.selectbox(
                    "Custom split type",
                    options=["percent", "dollar"],
                    index=0 if updated.custom.type == "percent" else 1,
                    key=f"custom-type-{item.id}",
                )
                updated = replace(updated, custom=CustomSplit(type=custom_type, values=custom_values))

                progress = get_custom_split_progress(updated, st.session_state.people, updated.cost or 0.0)
                if progress:
                    if progress["mode"] == "percent":
                        st.caption(f'{progress["current"]:.1f}% of 100%')
                    else:
                        if progress["target"] <= 0:
                            st.caption("Enter line cost to track dollar split")
                        else:
                            st.caption(f'${progress["current"]:.2f} of ${progress["target"]:.2f}')
                    st.progress(min(max(float(progress["ratio"]), 0.0), 1.0))

                custom_invalid = (
                    updated.payer == "Custom"
                    and (updated.cost or 0.0) > 0
                    and not is_custom_split_valid(updated, st.session_state.people, updated.cost or 0.0)
                )
                if custom_invalid:
                    st.caption("Custom split must total 100% or match item cost.")

            st.session_state.items[index - 1] = updated

    if st.button("+ Add Another Item"):
        add_item()
        st.rerun()


def render_tax_tip_section() -> None:
    st.subheader("Tax and Tip")
    col1, col2 = st.columns(2)
    st.session_state.tax_amount = col1.number_input(
        "Total Tax Amount ($)",
        value=float(st.session_state.tax_amount),
        min_value=0.0,
        step=0.01,
        format="%.2f",
    )
    st.session_state.tip_amount = col2.number_input(
        "Total Tip Amount ($)",
        value=float(st.session_state.tip_amount),
        min_value=0.0,
        step=0.01,
        format="%.2f",
    )


def render_summary(summary) -> None:
    st.subheader("Summary")
    for idx, person in enumerate(st.session_state.people):
        with st.container(border=True):
            st.markdown(f"**{person.name}**")
            st.write(f"Subtotal: {format_currency(summary.subtotals[idx])}")
            st.write(f"Tax Share: {format_currency(summary.tax_shares[idx])}")
            st.write(f"Tip Share: {format_currency(summary.tip_shares[idx])}")
            st.write(f"Total: {format_currency(summary.totals[idx])}")


def render_running_total(summary) -> None:
    rows = build_running_rows(
        st.session_state.people,
        st.session_state.items,
        summary,
        st.session_state.tax_amount,
        st.session_state.tip_amount,
    )
    st.subheader("Running Total")
    for row in rows:
        shares_text = "\n".join(f"{share.name}: {format_currency(share.amount)}" for share in row.shares)
        st.markdown(
            f"**{row.name}** | {format_currency(row.cost)} | {row.payer or '-'}\n\n{shares_text}"
        )


def render_export(invalid_custom_count: int) -> None:
    st.subheader("Export")
    if invalid_custom_count > 0:
        st.warning(
            "Fix invalid custom splits to include those items in totals. CSV export is disabled until all custom splits are valid."
        )

    csv_content = build_csv_content(
        st.session_state.people,
        st.session_state.items,
        st.session_state.tax_amount,
        st.session_state.tip_amount,
    )
    st.download_button(
        "Export to CSV",
        data=csv_content,
        file_name="grocery_split.csv",
        mime="text/csv",
        disabled=invalid_custom_count > 0,
    )


def main() -> None:
    st.set_page_config(page_title="Receipt Cost Splitter", layout="wide")
    st.title("Receipt Cost Splitter")
    init_state()
    sync_items_with_people_if_needed()

    render_people_section()
    render_items_section()
    render_tax_tip_section()

    invalid_custom_count = count_invalid_custom_items(st.session_state.items, st.session_state.people)
    if invalid_custom_count > 0:
        label = "item has" if invalid_custom_count == 1 else "items have"
        st.error(
            f"{invalid_custom_count} {label} invalid custom splits. Fix them to include them in totals. "
            "CSV export is disabled until all custom splits are valid."
        )

    summary = compute_summary(
        st.session_state.people,
        st.session_state.items,
        st.session_state.tax_amount,
        st.session_state.tip_amount,
    )
    render_summary(summary)
    render_running_total(summary)
    render_export(invalid_custom_count)


if __name__ == "__main__":
    main()
