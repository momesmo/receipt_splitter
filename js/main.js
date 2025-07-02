// main.js
import { people, updatePersonNames, addPerson, deletePerson, rebuildPeopleConfigList } from './people.js';
import { addItem, removeItem, addEnterKeyListener, handlePayerChange, validateCustomSplit, resetPayerBorder } from './items.js';
import { calculateSummary } from './summary.js';
import { exportToCSV } from './export.js';
import { generatePersonId } from './utils.js';

window.people = people;
window.updatePersonNames = updatePersonNames;
window.addPerson = addPerson;
window.deletePerson = deletePerson;
window.rebuildPeopleConfigList = rebuildPeopleConfigList;
window.addItem = addItem;
window.removeItem = removeItem;
window.addEnterKeyListener = addEnterKeyListener;
window.handlePayerChange = handlePayerChange;
window.validateCustomSplit = validateCustomSplit;
window.resetPayerBorder = resetPayerBorder;
window.calculateSummary = calculateSummary;
window.exportToCSV = exportToCSV;
window.generatePersonId = generatePersonId;

window.addEventListener('DOMContentLoaded', () => {
    rebuildPeopleConfigList();
    updatePersonNames();
    addItem();
}); 