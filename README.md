# Grocery Receipt Cost Splitter

## User Guide

This web app helps you split grocery receipts among multiple people, including tax and tip, with flexible split options.

### Features
- **Add/Edit People:**
  - Add as many people as you want using the "+ Add Person" button in the configuration section.
  - Edit each person's name directly in the configuration.
  - Remove people (minimum of two must remain).

- **Add Items:**
  - Add grocery items with a description and cost.
  - For each item, select who the expense is for:
    - Assign to a single person
    - Split Evenly among all people
    - Custom Split: specify a percentage or dollar amount for each person
  - Remove items as needed.

- **Tax and Tip:**
  - Enter the total tax and tip amounts for the receipt.
  - Both are split among people in proportion to their subtotal.

- **Summary:**
  - See each person's subtotal, tax share, tip share, and total owed.

- **Running Total:**
  - See a breakdown of each item, who it is expensed to, and each person's share.
  - Tax and tip rows show how those are split.
  - The final row shows the grand total and each person's total.

- **CSV Export:**
  - Download a CSV file of the split for use in Excel or other tools.

- **Keyboard Shortcuts:**
  - Press Enter in any item input to quickly add a new item row.

### How to Use
1. Set up the people in the configuration section.
2. Add each item from your receipt, entering the cost and selecting how to split it.
3. Enter the total tax and tip amounts (if any).
4. Review the summary and running total.
5. Export to CSV if needed.

---

## Developer Notes

### Debugging Tips
- **People Array:**
  - Each person has a unique `id` and a `name`. The `id` is used for all internal logic and select values.
- **Custom Split:**
  - When people are added/removed, the app preserves custom split values for existing people by matching on `id`.
  - If you see issues with custom split values not persisting, check the logic in `updatePersonNames` and `handlePayerChange`.
- **Dynamic UI:**
  - Most UI is generated dynamically from the `people` array. If you add new features, update all relevant render and calculation functions.
- **CSV Export:**
  - The CSV export is also dynamic and supports any number of people.
- **Styling:**
  - The app uses flexbox and shared CSS classes for layout. Use shared classes for new UI elements to keep the code DRY.
- **Validation:**
  - Custom split inputs are validated for sum (percent or dollar) and show a red border if invalid.

### Extending the App
- To add new features (e.g., more advanced split logic, receipt image upload), follow the DRY principle and use the existing dynamic patterns.
- For debugging, use browser dev tools and add `console.log` statements as needed. The code is written in vanilla JS and is easy to step through.
- If you refactor, keep the separation between UI rendering, calculation, and event handling for maintainability.
