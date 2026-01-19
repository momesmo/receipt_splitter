import { people } from './people.js';
import { calculateSummary } from './summary.js';

/**
 * Adds a new item row to the items table
 * @function addItem
 * @description Creates a new table row with input fields for item name, cost, expense assignment,
 * and custom split options. Generates dropdown options dynamically based on current people array.
 * Adds keyboard event listeners for Enter key navigation.
 */
export function addItem() {
    const container = document.getElementById('items-container');
    const newRow = document.createElement('tr');
    newRow.className = 'input-row';
    // Generate options for all people
    let optionsHtml = people.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    optionsHtml += `<option value="Split">Split Evenly</option><option value="Custom">Custom Split</option>`;
    newRow.innerHTML = `
        <td><input type="text" placeholder="Enter item name" class="item-name"></td>
        <td><input type="number" step="0.01" placeholder="0.00" class="item-cost" oninput="window.calculateSummary()"></td>
        <td>
            <select class="item-payer" onchange="window.handlePayerChange(this); window.calculateSummary(); window.validateCustomSplit(this)" oninput="window.resetPayerBorder(this)">
                ${optionsHtml}
            </select>
        </td>
        <td class="custom-split-cell"></td>
        <td><button onclick="window.removeItem(this)">Remove</button></td>
    `;
    container.appendChild(newRow);
    addEnterKeyListener(newRow);
}

/**
 * Removes an item row from the items table
 * @function removeItem
 * @param {HTMLElement} button - The remove button element that was clicked
 * @description Removes the parent table row of the clicked button and recalculates summaries
 * to update totals and running totals.
 */
export function removeItem(button) {
    button.closest('tr').remove();
    window.calculateSummary();
}

/**
 * Adds Enter key event listeners to a table row for quick item addition
 * @function addEnterKeyListener
 * @param {HTMLElement} row - The table row to add listeners to
 * @description Attaches keydown event listeners to all input and select elements in the row.
 * When Enter is pressed, adds a new item row and focuses the first input of the new row.
 */
export function addEnterKeyListener(row) {
    const inputs = row.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.addItem();
                // Focus the first input of the new row
                const allRows = document.querySelectorAll('.input-row');
                const lastRow = allRows[allRows.length - 1];
                if (lastRow) {
                    const firstInput = lastRow.querySelector('input');
                    if (firstInput) firstInput.focus();
                }
            }
        });
    });
}

/**
 * Handles changes to the expense assignment dropdown
 * @function handlePayerChange
 * @param {HTMLSelectElement} select - The select element that changed
 * @description When "Custom Split" is selected, generates input fields for each person
 * with percentage/dollar amount inputs and a type selector. Clears the custom split cell
 * for other selections. Updates person names to preserve any existing custom split values.
 */
export function handlePayerChange(select) {
    const row = select.closest('tr');
    const customCell = row.querySelector('.custom-split-cell');
    if (select.value === 'Custom') {
        let customInputsHtml = people.map((p, idx) =>
            `<input type="number" class="custom-split-person" data-person-idx="${idx}" data-person-id="${p.id}" placeholder="${p.name} % or $" min="0" style="width:${Math.max(100/people.length-2,20)}%; display:inline-block; margin-right:2px;" onchange="window.calculateSummary()" oninput="window.validateCustomSplit(this)">`
        ).join('');
        customInputsHtml += `<select class="custom-split-type" style="width:100%; margin-top:2px;" onchange="window.calculateSummary(); window.validateCustomSplit(this)">
            <option value="percent">%</option>
            <option value="dollar">$</option>
        </select>`;
        customCell.innerHTML = customInputsHtml;
        // Immediately call updatePersonNames to capture the new state for preservation
        window.updatePersonNames();
    } else {
        customCell.innerHTML = '';
    }
}

/**
 * Validates custom split inputs in real-time
 * @function validateCustomSplit
 * @param {HTMLElement} input - The input element that triggered validation
 * @description Validates that the sum of all custom split inputs equals the required total
 * (100% for percentage mode, item cost for dollar mode). Sets red border on all inputs
 * if validation fails, normal border if validation passes.
 */
export function validateCustomSplit(input) {
    const row = input.closest('tr');
    const customCell = row.querySelector('.custom-split-cell');
    const typeSel = customCell.querySelector('.custom-split-type');
    const customInputs = customCell.querySelectorAll('.custom-split-person');
    const cost = parseFloat(row.querySelector('.item-cost').value) || 0;
    if (typeSel && customInputs.length === people.length && cost > 0) {
        const type = typeSel.value;
        let values = Array.from(customInputs).map(inp => parseFloat(inp.value) || 0);
        let isValid = false;
        if (type === 'percent') {
            isValid = Math.abs(values.reduce((a, b) => a + b, 0) - 100) < 0.01;
        } else if (type === 'dollar') {
            isValid = Math.abs(values.reduce((a, b) => a + b, 0) - cost) < 0.01;
        }
        customInputs.forEach(inp => {
            inp.style.borderColor = isValid ? '#ddd' : 'red';
        });
    }
}

/**
 * Resets the border color of a select element to default
 * @function resetPayerBorder
 * @param {HTMLSelectElement} select - The select element to reset
 * @description Sets the border color back to the default gray color when the user
 * interacts with the select element, clearing any previous validation styling.
 */
export function resetPayerBorder(select) {
    select.style.borderColor = '#ddd';
} 