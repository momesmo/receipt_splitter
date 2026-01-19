// main.js
import { people, updatePersonNames, addPerson, deletePerson, rebuildPeopleConfigList } from './people.js';
import { addItem, removeItem, addEnterKeyListener, handlePayerChange, validateCustomSplit, resetPayerBorder } from './items.js';
import { calculateSummary } from './summary.js';
import { exportToCSV } from './export.js';
import { generatePersonId } from './utils.js';

/**
 * Application entry point and module wiring
 * @module main
 * @description Main module that imports all other modules and exposes their functions
 * to the global scope for use by HTML event handlers. Initializes the application
 * when the DOM is loaded.
 */

/**
 * Exposes all module functions to the global window object
 * @description Makes all imported functions available globally so they can be
 * referenced by HTML event attributes (onclick, onchange, etc.). This is necessary
 * because ES6 modules don't automatically expose functions to the global scope.
 * 
 * Functions exposed:
 * - People management: addPerson, deletePerson, updatePersonNames, rebuildPeopleConfigList
 * - Item management: addItem, removeItem, handlePayerChange, validateCustomSplit, resetPayerBorder
 * - Calculations: calculateSummary
 * - Export: exportToCSV
 * - Utilities: generatePersonId
 */
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

/**
 * Initializes the application when the DOM is fully loaded
 * @description Sets up the initial state of the application by:
 * 1. Building the people configuration list
 * 2. Updating person names and UI
 * 3. Adding the first item row
 * 
 * This ensures the application starts with a usable state and proper UI elements.
 */
window.addEventListener('DOMContentLoaded', () => {
    rebuildPeopleConfigList();
    updatePersonNames();
    addItem();
}); 