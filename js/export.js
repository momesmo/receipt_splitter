import { people } from './people.js';

export function exportToCSV() {
    let csv = `Item,Cost,Expense To,${people.map(p => p.name + ' Share').join(',')}` + '\n';
    const items = document.querySelectorAll('.input-row');
    items.forEach(item => {
        const name = item.querySelector('.item-name').value || 'Unnamed Item';
        const cost = parseFloat(item.querySelector('.item-cost').value) || 0;
        const payer = item.querySelector('.item-payer').value;
        let shares = people.map(() => 0);
        if (people.find(p => p.id === payer)) {
            shares[people.findIndex(p => p.id === payer)] = cost;
        } else if (payer === 'Split') {
            const evenShare = Math.floor((cost / people.length) * 100) / 100;
            let distributed = evenShare * people.length;
            let remainder = Math.round((cost - distributed) * 100) / 100;
            for (let i = 0; i < people.length; i++) shares[i] = evenShare;
            if (remainder !== 0) shares[people.length - 1] += remainder;
        } else if (payer === 'Custom') {
            const row = item;
            const customCell = row.querySelector('.custom-split-cell');
            if (customCell) {
                const typeSel = customCell.querySelector('.custom-split-type');
                const customInputs = customCell.querySelectorAll('input');
                if (typeSel && customInputs.length === people.length) {
                    const type = typeSel.value;
                    let vals = Array.from(customInputs).map(inp => parseFloat(inp.value) || 0);
                    if (type === 'percent') {
                        const percentSum = vals.reduce((a, b) => a + b, 0);
                        if (Math.abs(percentSum - 100) < 0.01) {
                            for (let i = 0; i < people.length; i++) shares[i] = cost * (vals[i] / 100);
                        }
                    } else if (type === 'dollar') {
                        const dollarSum = vals.reduce((a, b) => a + b, 0);
                        if (Math.abs(dollarSum - cost) < 0.01) {
                            for (let i = 0; i < people.length; i++) shares[i] = vals[i];
                        }
                    }
                }
            }
        }
        csv += `"${name}",${cost.toFixed(2)},"${people.find(p => p.id === payer)?.name || payer}",${shares.map(s => s.toFixed(2)).join(',')}` + '\n';
    });
    // Add tax row
    const taxAmount = parseFloat(document.getElementById('tax-amount').value) || 0;
    const subtotals = people.map((_, idx) => parseFloat(document.getElementById(`person${idx+1}-subtotal`)?.textContent?.replace('$', '') || 0));
    const totalSubtotal = subtotals.reduce((a, b) => a + b, 0);
    let taxShares = people.map(() => 0);
    if (totalSubtotal > 0) {
        let distributed = 0;
        for (let i = 0; i < people.length - 1; i++) {
            taxShares[i] = Math.round((subtotals[i] / totalSubtotal * taxAmount) * 100) / 100;
            distributed += taxShares[i];
        }
        taxShares[people.length - 1] = Math.round((taxAmount - distributed) * 100) / 100;
    }
    csv += `"Tax",${taxAmount.toFixed(2)},"Split by ratio",${taxShares.map(s => s.toFixed(2)).join(',')}` + '\n';
    // Add tip row
    const tipAmount = parseFloat(document.getElementById('tip-amount').value) || 0;
    let tipShares = people.map(() => 0);
    if (totalSubtotal > 0) {
        let distributed = 0;
        for (let i = 0; i < people.length - 1; i++) {
            tipShares[i] = Math.round((subtotals[i] / totalSubtotal * tipAmount) * 100) / 100;
            distributed += tipShares[i];
        }
        tipShares[people.length - 1] = Math.round((tipAmount - distributed) * 100) / 100;
    }
    csv += `"Tip",${tipAmount.toFixed(2)},"Split by ratio",${tipShares.map(s => s.toFixed(2)).join(',')}` + '\n';
    // Add totals
    csv += '\n';
    const totals = people.map((_, idx) => parseFloat(document.getElementById(`person${idx+1}-total`)?.textContent?.replace('$', '') || 0));
    csv += `"TOTALS",,,${totals.map(t => '"$' + t.toFixed(2) + '"').join(',')}` + '\n';
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grocery_split.csv';
    a.click();
    window.URL.revokeObjectURL(url);
} 