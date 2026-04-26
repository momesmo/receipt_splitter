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


def inject_styles() -> None:
    st.markdown(
        """
        <style>
        :root {
            --rs-text: #1f2937;
            --rs-muted: #4b5563;
            --rs-config-bg: #e3f2fd;
            --rs-items-bg: #f8f9fa;
            --rs-tax-bg: #e9ecef;
            --rs-running-bg: #fff3cd;
            --rs-banner-bg: #fff3cd;
            --rs-banner-border: #ffc107;
            --rs-banner-text: #856404;
            --rs-summary-bg: #f8f9fa;
            --rs-summary-accent: #007bff;
            --rs-running-head-bg: #ffe08a;
            --rs-running-head-text: #856404;
            --rs-total-bg: #f1f5f9;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --rs-text: #e5e7eb;
                --rs-muted: #cbd5e1;
                --rs-config-bg: #132a3a;
                --rs-items-bg: #1f2937;
                --rs-tax-bg: #2d3748;
                --rs-running-bg: #3b2f13;
                --rs-banner-bg: #4b3b14;
                --rs-banner-border: #d9a300;
                --rs-banner-text: #fde68a;
                --rs-summary-bg: #1f2937;
                --rs-summary-accent: #60a5fa;
                --rs-running-head-bg: #5a4718;
                --rs-running-head-text: #fde68a;
                --rs-total-bg: #374151;
            }
        }
        .rs-shell {
            max-width: 1400px;
            margin: 0 auto;
            padding: 8px;
            color: var(--rs-text);
        }
        [class*="st-key-rs-shell"] {
            max-width: 1400px;
            margin: 0 auto;
            padding: 8px;
            color: var(--rs-text);
        }
        .rs-section {
            border-radius: 8px;
            padding: 14px 16px;
            margin: 12px 0;
            border-left: 4px solid transparent;
            color: var(--rs-text);
        }
        [class*="st-key-rs-config-section"],
        [class*="st-key-rs-items-section"],
        [class*="st-key-rs-tax-section"],
        [class*="st-key-rs-running-section"],
        [class*="st-key-rs-export-section"] {
            border-radius: 8px;
            padding: 14px 16px;
            margin: 12px 0;
            border-left: 4px solid transparent;
            color: var(--rs-text);
        }
        .rs-config {
            background: var(--rs-config-bg);
            border-left-color: #2196f3;
        }
        [class*="st-key-rs-config-section"] {
            background: var(--rs-config-bg);
            border-left-color: #2196f3;
        }
        .rs-items {
            background: var(--rs-items-bg);
        }
        [class*="st-key-rs-items-section"] {
            background: var(--rs-items-bg);
        }
        .rs-tax {
            background: var(--rs-tax-bg);
        }
        [class*="st-key-rs-tax-section"] {
            background: var(--rs-tax-bg);
        }
        .rs-running {
            background: var(--rs-running-bg);
            border-left-color: #ffc107;
        }
        [class*="st-key-rs-running-section"] {
            background: var(--rs-running-bg);
            border-left-color: #ffc107;
        }
        .rs-export {
            text-align: center;
        }
        [class*="st-key-rs-export-section"] {
            text-align: center;
        }
        .rs-invalid-banner {
            background: var(--rs-banner-bg);
            border: 1px solid var(--rs-banner-border);
            color: var(--rs-banner-text);
            padding: 10px 12px;
            border-radius: 8px;
            margin: 6px 0 14px 0;
            font-size: 14px;
        }
        .rs-summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 16px;
            margin-top: 16px;
        }
        .rs-summary-card {
            background: var(--rs-summary-bg);
            border-left: 4px solid var(--rs-summary-accent);
            border-radius: 8px;
            padding: 14px;
            color: var(--rs-text);
        }
        .rs-summary-card h4 {
            margin: 0 0 10px 0;
            color: var(--rs-summary-accent);
            font-size: 18px;
        }
        .rs-summary-row {
            display: flex;
            justify-content: space-between;
            margin: 6px 0;
            font-size: 14px;
            color: var(--rs-text);
        }
        .rs-summary-row-total {
            border-top: 2px solid var(--rs-summary-accent);
            margin-top: 10px;
            padding-top: 8px;
            font-weight: bold;
            color: var(--rs-summary-accent);
            font-size: 17px;
        }
        .rs-running-table-head {
            font-weight: 600;
            color: var(--rs-running-head-text);
            background: var(--rs-running-head-bg);
            border-radius: 6px;
            padding: 6px 8px;
            margin-bottom: 6px;
        }
        .rs-running-total-row {
            background: var(--rs-total-bg);
            border-radius: 6px;
            padding: 6px 8px;
            font-weight: 700;
            color: var(--rs-text);
        }
        .rs-export-help {
            color: var(--rs-muted);
            font-size: 12px;
            margin-top: 8px;
        }
        [class*="st-key-person-enter-submit-"] button,
        [class*="st-key-item-enter-submit-"] button {
            display: none !important;
            height: 0 !important;
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: 0 !important;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def apply_pending_focus() -> None:
    focus_key = st.session_state.get("pending_focus_key", "")
    focus_mode = st.session_state.get("pending_focus_mode", "")
    if not focus_key and not focus_mode:
        return
    script_html = f"""
        <script>
        (function() {{
          const focusKey = {focus_key!r};
          const focusMode = {focus_mode!r};
          const rootDoc = (window.parent && window.parent.document) ? window.parent.document : document;
          let tries = 0;
          const maxTries = 36;

          function pickTarget() {{
            if (focusMode === "person") {{
              const people = Array.from(
                rootDoc.querySelectorAll('input[aria-label^="Person "], [class*="st-key-person-name-"] input')
              );
              if (people.length > 0) return people[people.length - 1];
            }}
            if (focusMode === "item") {{
              const items = Array.from(
                rootDoc.querySelectorAll('input[placeholder="Enter item name"], [class*="st-key-item-name-"] input')
              );
              if (items.length > 0) return items[items.length - 1];
            }}
            if (focusKey) {{
              const keyed = rootDoc.querySelector('.st-key-' + focusKey + ' input');
              if (keyed) return keyed;
            }}
            return null;
          }}

          const timer = setInterval(() => {{
            const target = pickTarget();
            if (target) {{
              if (rootDoc.activeElement && rootDoc.activeElement !== target) {{
                rootDoc.activeElement.blur?.();
              }}
              target.focus();
              target.select?.();
              clearInterval(timer);
              return;
            }}
            tries += 1;
            if (tries >= maxTries) {{
              clearInterval(timer);
            }}
          }}, 60);
        }})();
        </script>
        """
    html = getattr(st, "html", None)
    if callable(html):
        try:
            html(script_html, unsafe_allow_javascript=True)
        except TypeError:
            html(script_html)
    else:
        try:
            import streamlit.components.v1 as components

            components.html(script_html, height=0)
        except Exception:
            pass
    st.session_state["pending_focus_key"] = ""
    st.session_state["pending_focus_mode"] = ""


def inject_item_enter_add_bridge() -> None:
    script_html = """
        <script>
        (function() {
          const rootDoc = (window.parent && window.parent.document) ? window.parent.document : document;
          if (rootDoc.__rsItemEnterBridgeInstalled) return;
          rootDoc.__rsItemEnterBridgeInstalled = true;

          function findAddItemButton() {
            const buttons = Array.from(rootDoc.querySelectorAll('button'));
            return buttons.find((btn) => (btn.textContent || '').trim() === '+ Add Another Item');
          }

          rootDoc.addEventListener('keydown', function(e) {
            if (e.key !== 'Enter') return;
            const target = e.target;
            if (!(target instanceof HTMLInputElement)) return;

            const placeholder = target.getAttribute('placeholder') || '';
            if (placeholder !== 'Enter item name') return;

            e.preventDefault();
            const addBtn = findAddItemButton();
            if (addBtn) addBtn.click();
          }, true);
        })();
        </script>
    """
    html = getattr(st, "html", None)
    if callable(html):
        try:
            html(script_html, unsafe_allow_javascript=True)
        except TypeError:
            html(script_html)


def inject_person_enter_add_bridge() -> None:
    script_html = """
        <script>
        (function() {
          const rootDoc = (window.parent && window.parent.document) ? window.parent.document : document;
          if (rootDoc.__rsPersonEnterBridgeInstalled) return;
          rootDoc.__rsPersonEnterBridgeInstalled = true;

          function findAddPersonButton() {
            const buttons = Array.from(rootDoc.querySelectorAll('button'));
            return buttons.find((btn) => (btn.textContent || '').trim() === '+ Add Person');
          }

          rootDoc.addEventListener('keydown', function(e) {
            if (e.key !== 'Enter') return;
            const target = e.target;
            if (!(target instanceof HTMLInputElement)) return;

            const aria = target.getAttribute('aria-label') || '';
            if (!/^Person \\d+ Name$/.test(aria)) return;

            e.preventDefault();
            const addBtn = findAddPersonButton();
            if (addBtn) addBtn.click();
          }, true);
        })();
        </script>
    """
    html = getattr(st, "html", None)
    if callable(html):
        try:
            html(script_html, unsafe_allow_javascript=True)
        except TypeError:
            html(script_html)


def init_state() -> None:
    if "people" not in st.session_state:
        st.session_state.people = create_default_people()
    if "items" not in st.session_state:
        st.session_state["items"] = [create_empty_item()]
    if "tax_amount" not in st.session_state:
        st.session_state.tax_amount = 0.0
    if "tip_amount" not in st.session_state:
        st.session_state.tip_amount = 0.0
    if "pending_focus_key" not in st.session_state:
        st.session_state["pending_focus_key"] = ""
    if "pending_focus_mode" not in st.session_state:
        st.session_state["pending_focus_mode"] = ""


def sync_items_after_people_change() -> None:
    """Sync custom split maps when people are added/removed."""
    st.session_state["items"] = sync_all_items_people(st.session_state["items"], st.session_state.people)


def add_person() -> str:
    next_idx = len(st.session_state.people) + 1
    person_id = generate_person_id()
    new_people = [*st.session_state.people, Person(id=person_id, name=f"Person {next_idx}")]
    st.session_state.people = new_people
    sync_items_after_people_change()
    return person_id


def delete_person(person_id: str) -> None:
    if len(st.session_state.people) <= 2:
        return
    st.session_state.people = [person for person in st.session_state.people if person.id != person_id]
    st.session_state["items"] = [
        replace(item, payer="" if item.payer == person_id else item.payer) for item in st.session_state["items"]
    ]
    sync_items_after_people_change()


def add_item() -> str:
    item = create_empty_item()
    st.session_state["items"] = [*st.session_state["items"], item]
    return item.id


def _person_name_changed(person_id: str, idx: int) -> None:
    widget_key = f"person-name-{person_id}"
    name = st.session_state.get(widget_key, "")
    st.session_state.people[idx] = replace(st.session_state.people[idx], name=name)


def _item_name_changed(item_id: str, idx: int) -> None:
    widget_key = f"item-name-{item_id}"
    name = st.session_state.get(widget_key, "")
    current = st.session_state["items"][idx]
    st.session_state["items"][idx] = replace(current, name=name)


def remove_item(item_id: str) -> None:
    st.session_state["items"] = [item for item in st.session_state["items"] if item.id != item_id]
    if not st.session_state["items"]:
        st.session_state["items"] = [create_empty_item()]


def render_people_section() -> None:
    left, right = st.columns([3, 1])
    left.subheader("Configuration")
    if right.button("+ Add Person", use_container_width=True):
        add_person()
        st.rerun()

    people = st.session_state.people
    for row_start in range(0, len(people), 2):
        row_people = people[row_start : row_start + 2]
        row_cols = st.columns(2)
        for offset, person in enumerate(row_people):
            global_idx = row_start + offset
            with row_cols[offset]:
                cols = st.columns([5, 1.4])
                widget_key = f"person-name-{person.id}"
                if widget_key not in st.session_state:
                    st.session_state[widget_key] = person.name
                cols[0].text_input(
                    f"Person {global_idx + 1} Name",
                    key=widget_key,
                    placeholder=f"Person {global_idx + 1}",
                    on_change=_person_name_changed,
                    args=(person.id, global_idx),
                )

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
    header = st.columns([2.8, 1.0, 1.4, 2.2, 0.8])
    header[0].markdown("**Item Description**")
    header[1].markdown("**Cost ($)**")
    header[2].markdown("**Expense To**")
    header[3].markdown("**Custom Split**")
    header[4].markdown("**Action**")

    for index, item in enumerate(st.session_state["items"], start=1):
        with st.container(border=True):
            row1 = st.columns([2.8, 1.0, 1.4, 2.2, 0.8])
            name_key = f"item-name-{item.id}"
            if name_key not in st.session_state:
                st.session_state[name_key] = item.name
            row1[0].text_input(
                "Item Description",
                key=name_key,
                label_visibility="collapsed",
                placeholder="Enter item name",
                on_change=_item_name_changed,
                args=(item.id, index - 1),
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
            if row1[4].button("Remove", key=f"remove-item-{item.id}"):
                remove_item(item.id)
                st.rerun()

            updated = replace(item, name=st.session_state.get(name_key, item.name), cost=cost)
            if payer != item.payer:
                if payer == "Custom":
                    updated = sync_custom_values_with_people(replace(updated, payer=payer), st.session_state.people)
                else:
                    updated = replace(updated, payer=payer, custom=CustomSplit(type="percent", values={}))
            else:
                updated = replace(updated, payer=payer)

            payer_invalid = bool(updated.payer) and not is_payer_valid(updated, st.session_state.people)
            with row1[2]:
                if payer_invalid:
                    st.caption("Select a valid person or split option.")

            if updated.payer == "Custom":
                custom_values = dict(updated.custom.values)
                with row1[3]:
                    custom_cols = st.columns(len(st.session_state.people))
                    for col, person in zip(custom_cols, st.session_state.people):
                        raw_value = custom_values.get(person.id, "")
                        try:
                            numeric_value = float(raw_value) if raw_value != "" else 0.0
                        except ValueError:
                            numeric_value = 0.0
                        entered_value = col.number_input(
                            f"{person.name} % or $",
                            value=numeric_value,
                            key=f"custom-value-{item.id}-{person.id}",
                            label_visibility="collapsed",
                            min_value=0.0,
                            step=0.01,
                            format="%.2f",
                        )
                        custom_values[person.id] = f"{entered_value:.2f}"
                    custom_type = st.selectbox(
                        "Custom split type",
                        options=["percent", "dollar"],
                        index=0 if updated.custom.type == "percent" else 1,
                        key=f"custom-type-{item.id}",
                        label_visibility="collapsed",
                    )
                    updated = replace(updated, custom=CustomSplit(type=custom_type, values=custom_values))

                    progress = get_custom_split_progress(updated, st.session_state.people, updated.cost or 0.0)
                    if progress:
                        if progress["mode"] == "percent":
                            st.caption(f'Progress: {progress["current"]:.2f}% of 100%')
                        else:
                            if progress["target"] <= 0:
                                st.caption("Enter line cost to track dollar split")
                            else:
                                st.caption(
                                    f'Progress: \\${progress["current"]:.2f} of \\${progress["target"]:.2f}'
                                )
                        ratio = float(progress["ratio"])
                        clamped = min(max(ratio, 0.0), 1.0)
                        st.progress(clamped)
                        if ratio > 1:
                            st.caption(f"Over-allocated by {(ratio - 1) * 100:.2f}%")
                        elif ratio == 1:
                            st.caption("Split complete")
                        else:
                            st.caption(f"{(1 - ratio) * 100:.2f}% remaining")

                    custom_invalid = (
                        updated.payer == "Custom"
                        and (updated.cost or 0.0) > 0
                        and not is_custom_split_valid(updated, st.session_state.people, updated.cost or 0.0)
                    )
                    if custom_invalid:
                        st.caption("Custom split must total 100% or match item cost.")

            st.session_state["items"][index - 1] = updated

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
    st.markdown('<div class="rs-summary-grid">', unsafe_allow_html=True)
    for idx, person in enumerate(st.session_state.people):
        st.markdown(
            (
                '<div class="rs-summary-card">'
                f"<h4>{person.name}</h4>"
                '<div class="rs-summary-row"><span>Subtotal:</span>'
                f"<span>{format_currency(summary.subtotals[idx])}</span></div>"
                '<div class="rs-summary-row"><span>Tax Share:</span>'
                f"<span>{format_currency(summary.tax_shares[idx])}</span></div>"
                '<div class="rs-summary-row"><span>Tip Share:</span>'
                f"<span>{format_currency(summary.tip_shares[idx])}</span></div>"
                '<div class="rs-summary-row rs-summary-row-total"><span>Total:</span>'
                f"<span>{format_currency(summary.totals[idx])}</span></div>"
                "</div>"
            ),
            unsafe_allow_html=True,
        )
    st.markdown("</div>", unsafe_allow_html=True)


def render_running_total(summary) -> None:
    rows = build_running_rows(
        st.session_state.people,
        st.session_state["items"],
        summary,
        st.session_state.tax_amount,
        st.session_state.tip_amount,
    )
    st.subheader("Running Total")
    header = st.columns([2.5, 1, 1.5, 3])
    header[0].markdown('<div class="rs-running-table-head">Item Description</div>', unsafe_allow_html=True)
    header[1].markdown('<div class="rs-running-table-head">Cost ($)</div>', unsafe_allow_html=True)
    header[2].markdown('<div class="rs-running-table-head">Expense To</div>', unsafe_allow_html=True)
    header[3].markdown('<div class="rs-running-table-head">Share</div>', unsafe_allow_html=True)
    st.divider()
    for row in rows:
        cols = st.columns([2.5, 1, 1.5, 3])
        if row.is_total:
            cols[0].markdown(f'<div class="rs-running-total-row">{row.name}</div>', unsafe_allow_html=True)
            cols[1].markdown(
                f'<div class="rs-running-total-row">{format_currency(row.cost)}</div>', unsafe_allow_html=True
            )
            cols[2].markdown('<div class="rs-running-total-row">-</div>', unsafe_allow_html=True)
        else:
            cols[0].write(row.name)
            cols[1].write(format_currency(row.cost))
            cols[2].write(row.payer or "-")
        shares_text = "\n".join(f"{share.name}: {format_currency(share.amount)}" for share in row.shares)
        if row.is_total:
            cols[3].markdown(f'<div class="rs-running-total-row">{shares_text}</div>', unsafe_allow_html=True)
        else:
            cols[3].text(shares_text)


def render_export(invalid_custom_count: int) -> None:
    st.subheader("Export")
    if invalid_custom_count > 0:
        st.warning(
            "Fix invalid custom splits to include those items in totals. CSV export is disabled until all custom splits are valid."
        )

    csv_content = build_csv_content(
        st.session_state.people,
        st.session_state["items"],
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
    if invalid_custom_count > 0:
        st.markdown('<div class="rs-export-help">Fix invalid custom splits to enable download.</div>', unsafe_allow_html=True)
    else:
        st.markdown(
            '<div class="rs-export-help">Click to download a CSV file that you can open in Excel</div>',
            unsafe_allow_html=True,
        )


def main() -> None:
    st.set_page_config(page_title="Receipt Cost Splitter", layout="wide")
    inject_styles()
    inject_person_enter_add_bridge()
    inject_item_enter_add_bridge()
    with st.container(key="rs-shell"):
        st.title("Receipt Cost Splitter")
        init_state()

        with st.container(key="rs-config-section"):
            render_people_section()

        with st.container(key="rs-items-section"):
            render_items_section()

        with st.container(key="rs-tax-section"):
            render_tax_tip_section()

        invalid_custom_count = count_invalid_custom_items(st.session_state["items"], st.session_state.people)
        if invalid_custom_count > 0:
            label = "item has" if invalid_custom_count == 1 else "items have"
            st.markdown(
                (
                    '<div class="rs-invalid-banner">'
                    f"{invalid_custom_count} {label} invalid custom splits. Fix them to include them in totals. "
                    "CSV export is disabled until all custom splits are valid."
                    "</div>"
                ),
                unsafe_allow_html=True,
            )

        summary = compute_summary(
            st.session_state.people,
            st.session_state["items"],
            st.session_state.tax_amount,
            st.session_state.tip_amount,
        )
        render_summary(summary)
        with st.container(key="rs-running-section"):
            render_running_total(summary)
        with st.container(key="rs-export-section"):
            render_export(invalid_custom_count)
        apply_pending_focus()


if __name__ == "__main__":
    main()
