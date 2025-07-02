# Grocery Receipt Cost Splitter

A modern, modular web application for splitting grocery receipts among multiple people with flexible split options, tax/tip handling, and CSV export functionality.

## 🚀 Features

### Core Functionality
- **Multi-Person Support**: Add unlimited people to split receipts among
- **Flexible Splitting Options**:
  - Assign items to individual people
  - Split items evenly among all people
  - Custom percentage or dollar amount splits
- **Tax & Tip Handling**: Automatically split tax and tip proportionally based on subtotals
- **Real-Time Calculations**: Instant updates as you modify items or people
- **CSV Export**: Download detailed breakdowns for Excel or accounting software
- **Keyboard Navigation**: Press Enter to quickly add new items

### User Experience
- **Dynamic UI**: Automatically adapts to any number of people
- **State Preservation**: Custom split values persist when adding/removing people
- **Validation**: Real-time validation with visual feedback for invalid splits
- **Responsive Design**: Works on desktop and mobile devices

## 📁 Project Structure

```
receipt_splitter/
├── index.html              # Main HTML file
├── style.css               # Stylesheet
├── js/
│   ├── main.js            # Application entry point
│   ├── people.js          # People management
│   ├── items.js           # Item row management
│   ├── summary.js         # Calculation logic
│   ├── export.js          # CSV export functionality
│   └── utils.js           # Utility functions
├── README.md              # This file
└── TECHNICAL_DOCS.md      # Detailed technical documentation
```

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Styling**: CSS3 with Flexbox/Grid
- **Build**: No build process required - runs directly in modern browsers
- **Documentation**: JSDoc comments + Markdown documentation

## 📖 User Guide

### Getting Started
1. **Configure People**: Use the "+ Add Person" button to add participants
2. **Add Items**: Enter each grocery item with description and cost
3. **Choose Split Method**: For each item, select how to split:
   - **Individual**: Assign to one person
   - **Split Evenly**: Divide equally among all
   - **Custom Split**: Specify percentages or dollar amounts
4. **Add Tax/Tip**: Enter total amounts (split proportionally)
5. **Review & Export**: Check summaries and export to CSV if needed

### Splitting Methods Explained

#### Individual Assignment
- Assigns the full cost to one person
- Use when someone bought something just for themselves

#### Even Split
- Divides cost equally among all people
- Handles rounding by assigning remainder to the last person
- Perfect for shared items like appetizers

#### Custom Split
- **Percentage Mode**: Enter percentages that must total 100%
- **Dollar Mode**: Enter dollar amounts that must total the item cost
- Real-time validation with red border for invalid totals

### Keyboard Shortcuts
- **Enter**: Add a new item row (when focused on any item input)
- **Tab**: Navigate between form fields

## 🔧 Developer Guide

### Architecture Overview

The application uses a modular ES6 architecture with clear separation of concerns:

- **`main.js`**: Entry point that wires all modules together
- **`people.js`**: Manages people array and configuration UI
- **`items.js`**: Handles item rows, validation, and splitting logic
- **`summary.js`**: Performs calculations and updates displays
- **`export.js`**: Generates and downloads CSV files
- **`utils.js`**: Provides utility functions

### Key Design Patterns

#### State Management
- Centralized `people` array in `people.js`
- DOM state synchronized with data state
- Custom split values preserved across UI updates

#### Event Handling
- Functions exposed to global scope via `window` object
- HTML event attributes reference global functions
- Module functions call each other through global scope

#### Validation
- Real-time validation for custom splits
- Visual feedback with red borders for invalid inputs
- Graceful handling of edge cases

### Debugging Tips

#### Common Issues
1. **Custom Split Values Not Persisting**:
   - Check `updatePersonNames()` in `people.js`
   - Verify `data-person-id` attributes are preserved

2. **Calculations Seem Wrong**:
   - Review `calculateSummary()` in `summary.js`
   - Check rounding logic for even splits

3. **UI Not Updating**:
   - Ensure `window.calculateSummary()` is called after changes
   - Verify DOM element IDs match expectations

#### Development Workflow
1. Use browser dev tools for debugging
2. Add `console.log()` statements in module functions
3. Check the browser console for any module loading errors
4. Verify all functions are properly exposed to `window` in `main.js`

### Extending the Application

#### Adding New Features
1. **New Splitting Methods**: Extend the logic in `items.js` and `summary.js`
2. **Data Persistence**: Add localStorage or backend API integration
3. **Receipt Image Upload**: Add OCR functionality with new modules
4. **Multiple Receipts**: Extend data structures to support receipt collections

#### Code Organization Principles
- **Single Responsibility**: Each module has one clear purpose
- **DRY**: Avoid code duplication, use shared functions
- **Separation of Concerns**: UI, logic, and data management are separate
- **Modularity**: Functions are small, focused, and testable

### Testing Strategy

#### Manual Testing Checklist
- [ ] Add/remove people (minimum 2 enforced)
- [ ] Add/remove items
- [ ] Test all three splitting methods
- [ ] Validate custom split calculations
- [ ] Test tax/tip proportional splitting
- [ ] Verify CSV export format
- [ ] Test keyboard navigation
- [ ] Check mobile responsiveness

#### Future Testing Improvements
- Unit tests for calculation functions
- Integration tests for module interactions
- E2E tests for complete user workflows
- Automated testing with Jest or similar

## 🚀 Deployment

### Requirements
- Modern web browser with ES6 module support
- Web server (local development or hosted)
- No build process or dependencies required

### Local Development
```bash
# Start a local server
python3 -m http.server 8000
# or
npx serve .

# Open in browser
open http://localhost:8000
```

### Production Deployment
- Upload all files to any web hosting service
- Ensure server supports ES6 modules
- No special configuration required

## 📚 Documentation

- **README.md**: User and developer guides (this file)
- **TECHNICAL_DOCS.md**: Detailed technical documentation
- **JSDoc Comments**: Inline documentation in all JavaScript files

## 🔮 Future Enhancements

### Planned Features
- Save/load receipt data (localStorage or backend)
- Multiple receipt support
- Receipt image upload with OCR
- Mobile app version
- Backend API for data persistence

### Technical Improvements
- TypeScript migration for better type safety
- Unit test coverage
- Build process with bundling
- Progressive Web App features
- Accessibility improvements (ARIA labels, screen reader support)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style and patterns
4. Add tests for new functionality
5. Update documentation as needed
6. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.
