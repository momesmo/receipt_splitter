// people.js
import { generatePersonId } from './utils.js';

export let people = [
    { id: crypto.randomUUID ? crypto.randomUUID() : 'p1', name: 'Person 1' },
    { id: crypto.randomUUID ? crypto.randomUUID() : 'p2', name: 'Person 2' }
];



export function addPerson() {
    people.push({ id: generatePersonId(), name: `Person ${people.length + 1}` });
    rebuildPeopleConfigList();
    updatePersonNames();
}

export function deletePerson(idx) {
    if (people.length <= 2) return; // Always keep at least 2 people
    people.splice(idx, 1);
    rebuildPeopleConfigList();
    updatePersonNames();
}

export function rebuildPeopleConfigList() {
    const peopleConfigList = document.getElementById('people-config-list');
    peopleConfigList.innerHTML = '';
    for (let i = 0; i < people.length; i += 2) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'config-row';
        for (let j = 0; j < 2 && (i + j) < people.length; j++) {
            const idx = i + j;
            const inputDiv = document.createElement('div');
            inputDiv.className = 'config-input';
            inputDiv.innerHTML = `
                <div class="person-config-flex">
                    <label for="person-${idx}-name">Person ${idx+1} Name:</label>
                    <input type="text" id="person-${idx}-name" value="${people[idx].name}" onchange="window.updatePersonNames()">
                    <button type="button" class="delete-person-btn" style="${people.length > 2 ? '' : 'display:none'}; margin-left:8px;" onclick="window.deletePerson(${idx})">Delete</button>
                </div>
            `;
            rowDiv.appendChild(inputDiv);
        }
        peopleConfigList.appendChild(rowDiv);
    }
}

export function updatePersonNames() {
    // Preserve all current custom split values for each row and person id
    const customSplitPreserve = [];
    document.querySelectorAll('.input-row').forEach((row, rowIdx) => {
        const payerSelect = row.querySelector('.item-payer');
        if (payerSelect && payerSelect.value === 'Custom') {
            const customCell = row.querySelector('.custom-split-cell');
            if (customCell) {
                const oldInputs = customCell.querySelectorAll('.custom-split-person');
                const oldValues = {};
                oldInputs.forEach(inp => {
                    oldValues[inp.getAttribute('data-person-id')] = inp.value;
                });
                let typeSel = customCell.querySelector('.custom-split-type');
                let typeValue = typeSel ? typeSel.value : 'percent';
                customSplitPreserve[rowIdx] = { oldValues, typeValue };
            }
        }
    });

    // Update people array from config inputs
    const personInputs = document.querySelectorAll('[id^="person-"][id$="-name"]');
    people.forEach((p, i) => {
        p.name = personInputs[i] ? personInputs[i].value || personInputs[i].placeholder || "Person" : p.name;
    });

    // Show/hide delete buttons
    const deleteBtns = document.querySelectorAll('.delete-person-btn');
    if (people.length > 2) {
        deleteBtns.forEach(btn => btn.style.display = 'inline-block');
    } else {
        deleteBtns.forEach(btn => btn.style.display = 'none');
    }

    // Update summary titles
    people.forEach((p, idx) => {
        const title = document.getElementById(`person${idx+1}-title`);
        if (title) title.textContent = p.name;
    });

    // Update all select options, preserving selection by value only
    const selectElements = document.querySelectorAll('.item-payer');
    selectElements.forEach(select => {
        const prevValue = select.value;
        let optionsHtml = people.map((p, idx) => `<option value="${p.id}">${p.name}</option>`).join('');
        optionsHtml += `<option value="Split">Split Evenly</option><option value="Custom">Custom Split</option>`;
        select.innerHTML = optionsHtml;
        // Try to restore by value, fallback to error state if not found
        if ([...people.map(p => p.id), 'Split', 'Custom'].includes(prevValue)) {
            select.value = prevValue;
            select.style.borderColor = '#ddd';
        } else {
            select.selectedIndex = -1;
            select.style.borderColor = 'red';
        }
    });

    // For all rows with Custom Split, update the custom split UI and validation, preserving values for existing people
    document.querySelectorAll('.input-row').forEach((row, rowIdx) => {
        const payerSelect = row.querySelector('.item-payer');
        if (payerSelect && payerSelect.value === 'Custom') {
            const customCell = row.querySelector('.custom-split-cell');
            // Use preserved values if available
            let oldValues = {}, typeValue = 'percent';
            if (customSplitPreserve[rowIdx]) {
                oldValues = customSplitPreserve[rowIdx].oldValues;
                typeValue = customSplitPreserve[rowIdx].typeValue;
            }
            // Rebuild the custom split UI for all people
            let customInputsHtml = people.map((p, idx) =>
                `<input type="number" class="custom-split-person" data-person-idx="${idx}" data-person-id="${p.id}" placeholder="${p.name} % or $" min="0" style="width:${Math.max(100/people.length-2,20)}%; display:inline-block; margin-right:2px;" onchange="window.calculateSummary()" oninput="window.validateCustomSplit(this)" value="${oldValues[p.id] || ''}">`
            ).join('');
            customInputsHtml += `<select class="custom-split-type" style="width:100%; margin-top:2px;" onchange="window.calculateSummary(); window.validateCustomSplit(this)">
                <option value="percent"${typeValue==='percent'?' selected':''}>%</option>
                <option value="dollar"${typeValue==='dollar'?' selected':''}>$</option>
            </select>`;
            if (customCell) customCell.innerHTML = customInputsHtml;
            // Validate all custom split inputs in this row
            const customInputs = row.querySelectorAll('.custom-split-person');
            customInputs.forEach(input => window.validateCustomSplit(input));
        }
    });

    window.calculateSummary();
} 