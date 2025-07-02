import { people } from './people.js';
import { calculateSummary } from './summary.js';

export function addItem() {
    const container = document.getElementById('items-container');
    const newRow = document.createElement('tr');
    newRow.className = 'input-row';
    // Generate options for all people
    let optionsHtml = people.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    optionsHtml += `<option value="Split">Split Evenly</option><option value="Custom">Custom Split</option>`;
    newRow.innerHTML = `
        <td><input type="text" placeholder="Enter item name" class="item-name"></td>
        <td><input type="number" step="0.01" placeholder="0.00" class="item-cost" oninput="window.calculateSummary()" onchange="window.validateCustomSplit(this)"></td>
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

export function removeItem(button) {
    button.closest('tr').remove();
    window.calculateSummary();
}

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

export function resetPayerBorder(select) {
    select.style.borderColor = '#ddd';
} 