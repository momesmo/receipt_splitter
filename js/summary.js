import { people } from './people.js';

export function calculateSummary() {
    // Initialize subtotals for each person
    let subtotals = people.map(() => 0);
    const items = document.querySelectorAll('.input-row');
    items.forEach(item => {
        const cost = parseFloat(item.querySelector('.item-cost').value) || 0;
        const payer = item.querySelector('.item-payer').value;
        if (people.find(p => p.id === payer)) {
            // Assign full cost to selected person
            const idx = people.findIndex(p => p.id === payer);
            subtotals[idx] += cost;
        } else if (payer === 'Split') {
            // Split evenly among all people
            const evenShare = Math.floor((cost / people.length) * 100) / 100;
            let distributed = evenShare * people.length;
            let remainder = Math.round((cost - distributed) * 100) / 100;
            for (let i = 0; i < people.length; i++) {
                subtotals[i] += evenShare;
            }
            // Assign remainder to the last person
            if (remainder !== 0) {
                subtotals[people.length - 1] += remainder;
            }
        } else if (payer === 'Custom') {
            const row = item;
            const customCell = row.querySelector('.custom-split-cell');
            if (customCell) {
                const typeSel = customCell.querySelector('.custom-split-type');
                const customInputs = customCell.querySelectorAll('input');
                if (typeSel && customInputs.length === people.length) {
                    const type = typeSel.value;
                    let shares = Array.from(customInputs).map(input => parseFloat(input.value) || 0);
                    if (type === 'percent') {
                        const percentSum = shares.reduce((a, b) => a + b, 0);
                        if (Math.abs(percentSum - 100) < 0.01) {
                            for (let i = 0; i < people.length; i++) {
                                subtotals[i] += cost * (shares[i] / 100);
                            }
                        }
                    } else if (type === 'dollar') {
                        const dollarSum = shares.reduce((a, b) => a + b, 0);
                        if (Math.abs(dollarSum - cost) < 0.01) {
                            for (let i = 0; i < people.length; i++) {
                                subtotals[i] += shares[i];
                            }
                        }
                    }
                }
            }
        }
    });
    // Round subtotals
    subtotals = subtotals.map(x => Math.round(x * 100) / 100);
    const totalSubtotal = subtotals.reduce((a, b) => a + b, 0);
    const taxAmount = parseFloat(document.getElementById('tax-amount').value) || 0;
    const tipAmount = parseFloat(document.getElementById('tip-amount').value) || 0;
    // Calculate tax shares
    let taxShares = people.map(() => 0);
    let tipShares = people.map(() => 0);
    if (totalSubtotal > 0) {
        let distributed = 0;
        for (let i = 0; i < people.length - 1; i++) {
            taxShares[i] = Math.round((subtotals[i] / totalSubtotal * taxAmount) * 100) / 100;
            distributed += taxShares[i];
        }
        taxShares[people.length - 1] = Math.round((taxAmount - distributed) * 100) / 100;
    }
    if (totalSubtotal > 0) {
        let distributed = 0;
        for (let i = 0; i < people.length - 1; i++) {
            tipShares[i] = Math.round((subtotals[i] / totalSubtotal * tipAmount) * 100) / 100;
            distributed += tipShares[i];
        }
        tipShares[people.length - 1] = Math.round((tipAmount - distributed) * 100) / 100;
    }
    // Update summary section
    const summaryDiv = document.querySelector('.summary');
    summaryDiv.innerHTML = people.map((p, idx) => `
        <div class="person-summary">
            <h3 id="person${idx+1}-title">${p.name}</h3>
            <div class="summary-row">
                <span>Subtotal:</span>
                <span id="person${idx+1}-subtotal">$${subtotals[idx].toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Tax Share:</span>
                <span id="person${idx+1}-tax">$${taxShares[idx].toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Tip Share:</span>
                <span id="person${idx+1}-tip">$${tipShares[idx].toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total:</span>
                <span id="person${idx+1}-total">$${(subtotals[idx] + taxShares[idx] + tipShares[idx]).toFixed(2)}</span>
            </div>
        </div>
    `).join('');
    // Update running total
    updateRunningTotal(subtotals, taxShares, tipShares);
}

export function updateRunningTotal(subtotals, taxShares, tipShares) {
    const container = document.getElementById('running-total-container');
    container.innerHTML = '';
    const items = document.querySelectorAll('.input-row');
    let totalCost = 0;
    items.forEach(item => {
        const name = item.querySelector('.item-name').value || 'Unnamed Item';
        const cost = parseFloat(item.querySelector('.item-cost').value) || 0;
        const payer = item.querySelector('.item-payer').value;
        let shares = people.map(() => 0);
        let shareText = '';
        let payerDisplay = payer;
        if (cost > 0) {
            totalCost += cost;
            if (people.find(p => p.id === payer)) {
                shares[people.findIndex(p => p.id === payer)] = cost;
                payerDisplay = people.find(p => p.id === payer).name;
            } else if (payer === 'Split') {
                const evenShare = Math.floor((cost / people.length) * 100) / 100;
                let distributed = evenShare * people.length;
                let remainder = Math.round((cost - distributed) * 100) / 100;
                for (let i = 0; i < people.length; i++) {
                    shares[i] = evenShare;
                }
                if (remainder !== 0) {
                    shares[people.length - 1] += remainder;
                }
                payerDisplay = 'Split Evenly';
            } else if (payer === 'Custom') {
                const row = item;
                const customCell = row.querySelector('.custom-split-cell');
                if (customCell) {
                    const typeSel = customCell.querySelector('.custom-split-type');
                    const customInputs = customCell.querySelectorAll('input');
                    if (typeSel && customInputs.length === people.length) {
                        const type = typeSel.value;
                        let inputVals = Array.from(customInputs).map(input => parseFloat(input.value) || 0);
                        if (type === 'percent') {
                            const percentSum = inputVals.reduce((a, b) => a + b, 0);
                            if (Math.abs(percentSum - 100) < 0.01) {
                                for (let i = 0; i < people.length; i++) {
                                    shares[i] = cost * (inputVals[i] / 100);
                                }
                            }
                        } else if (type === 'dollar') {
                            const dollarSum = inputVals.reduce((a, b) => a + b, 0);
                            if (Math.abs(dollarSum - cost) < 0.01) {
                                for (let i = 0; i < people.length; i++) {
                                    shares[i] = inputVals[i];
                                }
                            }
                        }
                    }
                }
                payerDisplay = 'Custom Split';
            }
            shareText = people.map((p, idx) => `${p.name}: $${shares[idx].toFixed(2)}`).join('<br/>');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="item-name">${name}</td>
                <td class="item-cost">$${cost.toFixed(2)}</td>
                <td class="item-payer">${payerDisplay}</td>
                <td class="item-share">${shareText}</td>
            `;
            container.appendChild(row);
        }
    });
    // Add tax row if there's tax
    const taxAmount = parseFloat(document.getElementById('tax-amount').value) || 0;
    if (taxAmount > 0) {
        const totalSubtotal = subtotals.reduce((a, b) => a + b, 0);
        let taxShareText = people.map((p, idx) => `${p.name}: $${taxShares[idx].toFixed(2)}`).join('<br/>');
        const taxRow = document.createElement('tr');
        taxRow.innerHTML = `
            <td class="item-name">Tax</td>
            <td class="item-cost">$${taxAmount.toFixed(2)}</td>
            <td class="item-payer">Split by ratio</td>
            <td class="item-share">${taxShareText}</td>
        `;
        container.appendChild(taxRow);
    }
    // Add tip row if there's tip
    const tipAmount = parseFloat(document.getElementById('tip-amount').value) || 0;
    if (tipAmount > 0) {
        const totalSubtotal = subtotals.reduce((a, b) => a + b, 0);
        let tipShareText = people.map((p, idx) => `${p.name}: $${tipShares[idx].toFixed(2)}`).join('<br/>');
        const tipRow = document.createElement('tr');
        tipRow.innerHTML = `
            <td class="item-name">Tip</td>
            <td class="item-cost">$${tipAmount.toFixed(2)}</td>
            <td class="item-payer">Split by ratio</td>
            <td class="item-share">${tipShareText}</td>
        `;
        container.appendChild(tipRow);
    }
    // Add total row
    const totals = subtotals.map((s, i) => s + taxShares[i] + tipShares[i]);
    const grandTotal = totals.reduce((a, b) => a + b, 0);
    const totalText = people.map((p, idx) => `${p.name}: $${totals[idx].toFixed(2)}`).join('<br/>');
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td class="item-name">TOTAL</td>
        <td class="item-cost">$${grandTotal.toFixed(2)}</td>
        <td class="item-payer"></td>
        <td class="item-share">${totalText}</td>
    `;
    container.appendChild(totalRow);
} 