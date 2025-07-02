# Technical Documentation - Grocery Receipt Cost Splitter

## Overview
The Grocery Receipt Cost Splitter is a client-side web application that helps users split grocery receipts among multiple people. It supports various splitting methods including individual assignment, even splits, and custom percentage/dollar amount splits.

## Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Styling**: CSS3
- **Markup**: HTML5
- **Build**: No build process required (runs directly in browser)

### Module Structure
```
js/
├── main.js          # Application entry point and module wiring
├── people.js        # People management and configuration
├── items.js         # Item row management and validation
├── summary.js       # Calculation and summary display logic
├── export.js        # CSV export functionality
└── utils.js         # Utility functions
```

## Module Documentation

### main.js
**Purpose**: Application entry point that wires together all modules and exposes functions to the global scope.

**Key Functions**:
- Imports all module functions
- Exposes functions to `window` object for HTML event handlers
- Initializes application on DOMContentLoaded

**Dependencies**: All other modules

### people.js
**Purpose**: Manages the people participating in the receipt split.

**Key Exports**:
- `people` (Array): List of people with id and name
- `addPerson()`: Adds a new person to the list
- `deletePerson(idx)`: Removes a person (maintains minimum of 2)
- `rebuildPeopleConfigList()`: Updates the configuration UI
- `updatePersonNames()`: Syncs names and preserves custom splits

**Data Structure**:
```javascript
{
  id: string,    // Unique identifier
  name: string   // Display name
}
```

### items.js
**Purpose**: Manages individual item rows and their splitting logic.

**Key Exports**:
- `addItem()`: Creates a new item row
- `removeItem(button)`: Removes an item row
- `handlePayerChange(select)`: Handles expense assignment changes
- `validateCustomSplit(input)`: Validates custom split inputs
- `addEnterKeyListener(row)`: Adds keyboard navigation

**Splitting Methods**:
1. **Individual**: Assigns full cost to one person
2. **Split Evenly**: Divides cost equally among all people
3. **Custom Split**: Allows percentage or dollar amount splits

### summary.js
**Purpose**: Calculates and displays cost summaries for each person.

**Key Exports**:
- `calculateSummary()`: Main calculation function
- `updateRunningTotal()`: Updates the running total table

**Calculation Logic**:
- Subtotal: Sum of assigned items per person
- Tax Share: Proportional to subtotal ratio
- Tip Share: Proportional to subtotal ratio
- Total: Subtotal + Tax + Tip

### export.js
**Purpose**: Generates and downloads CSV files of the split data.

**Key Exports**:
- `exportToCSV()`: Creates and downloads CSV file

**CSV Structure**:
- Headers: Item, Cost, Expense To, [Person Shares]
- Rows: Individual items, tax, tip, totals

### utils.js
**Purpose**: Provides utility functions used across modules.

**Key Exports**:
- `generatePersonId()`: Creates unique person identifiers
- `splitAmount(amount)`: Legacy function (unused)

## Data Flow

### 1. Initialization
```
DOMContentLoaded → main.js → rebuildPeopleConfigList() → addItem()
```

### 2. Adding People
```
addPerson() → people.push() → rebuildPeopleConfigList() → updatePersonNames()
```

### 3. Adding Items
```
addItem() → create row → addEnterKeyListener() → calculateSummary()
```

### 4. Cost Calculation
```
calculateSummary() → process items → calculate shares → updateRunningTotal()
```

### 5. Export
```
exportToCSV() → gather data → create CSV → download file
```

## Key Algorithms

### Even Split Algorithm
```javascript
const evenShare = Math.floor((cost / people.length) * 100) / 100;
let distributed = evenShare * people.length;
let remainder = Math.round((cost - distributed) * 100) / 100;
// Assign remainder to last person
```

### Custom Split Validation
```javascript
// Percentage validation
isValid = Math.abs(values.reduce((a, b) => a + b, 0) - 100) < 0.01;

// Dollar validation
isValid = Math.abs(values.reduce((a, b) => a + b, 0) - cost) < 0.01;
```

### Tax/Tip Distribution
```javascript
// Proportional to subtotal ratio
share = Math.round((personSubtotal / totalSubtotal * amount) * 100) / 100;
// Assign remainder to last person
```

## State Management

### Global State
- `people` array: Managed in people.js
- DOM elements: Referenced by ID throughout modules

### State Preservation
- Custom split values preserved when people added/removed
- Dropdown selections maintained by value matching
- Form inputs synchronized with people array

## Error Handling

### Validation
- Custom split inputs validated in real-time
- Invalid splits highlighted with red borders
- Minimum 2 people enforced

### Edge Cases
- Empty item names default to "Unnamed Item"
- Zero costs handled gracefully
- Missing DOM elements checked before access

## Performance Considerations

### DOM Manipulation
- Batch DOM updates where possible
- Use querySelector caching for repeated access
- Minimize reflows by grouping style changes

### Memory Management
- Event listeners properly attached/detached
- No memory leaks from closures
- Efficient array operations

## Browser Compatibility

### Supported Features
- ES6 Modules (modern browsers)
- Template literals
- Arrow functions
- Array methods (map, reduce, filter)

### Fallbacks
- crypto.randomUUID() with fallback to custom generator
- CSS Grid/Flexbox with fallback layouts

## Testing Strategy

### Manual Testing
- Add/remove people
- Add/remove items
- Test all splitting methods
- Validate calculations
- Test CSV export

### Automated Testing (Future)
- Unit tests for calculation functions
- Integration tests for module interactions
- E2E tests for user workflows

## Deployment

### Requirements
- Web server (local or hosted)
- Modern browser with ES6 support
- No build process required

### File Structure
```
receipt_splitter/
├── index.html
├── style.css
├── js/
│   ├── main.js
│   ├── people.js
│   ├── items.js
│   ├── summary.js
│   ├── export.js
│   └── utils.js
└── README.md
```

## Future Enhancements

### Potential Features
- Save/load receipt data
- Multiple receipt support
- Receipt image upload/OCR
- Mobile app version
- Backend API for data persistence

### Technical Improvements
- TypeScript migration
- Unit test coverage
- Build process with bundling
- Progressive Web App features
- Accessibility improvements 