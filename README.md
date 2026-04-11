# Grocery Receipt Cost Splitter

A web application for splitting grocery receipts among multiple people with flexible split options, tax/tip handling, and CSV export.

## Features

### Core functionality
- **Multi-person support**: Add people to split receipts among
- **Flexible splitting**:
  - Assign items to individual people
  - Split items evenly among all people
  - Custom percentage or dollar amount splits
- **Tax and tip**: Split proportionally by subtotal share
- **Real-time calculations** as you edit items or people
- **CSV export** for Excel or accounting tools

### User experience
- **Dynamic UI** for any number of people
- **Custom split values** preserved when people are added or removed
- **Validation** with clear feedback; invalid custom splits are called out in a banner and block CSV export until fixed
- **Responsive layout** for desktop and mobile

## Project structure

```
receipt_splitter/
├── app/
│   ├── web/                 # Vite + React + TypeScript source
│   │   ├── src/
│   │   │   ├── components/  # UI sections
│   │   │   ├── lib/         # Pure calculation + CSV logic (unit-tested)
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   └── package.json
│   ├── ec2/                 # Production static output (`npm run build` writes here)
│   └── lambda/              # AWS Lambda helper (Terraform)
├── tf/                      # Terraform (EC2, S3 assets, Lambda)
├── README.md
└── TECHNICAL_DOCS.md
```

## Technology stack

- **Frontend**: React 19, TypeScript
- **Build**: Vite 8
- **Tests**: Vitest (core math and CSV in `app/web/src/lib/`)
- **Styling**: CSS (see `app/web/src/style.css`)
- **Deploy**: Static files under `app/ec2/` are zipped by Terraform and served from EC2 via Python’s `http.server`

## User guide

### Getting started
1. **Configure people** with the "+ Add Person" button
2. **Add items** with description and cost
3. **Expense To**: choose a person, "Split Evenly", or "Custom Split"
4. **Tax / Tip**: enter totals (allocated by subtotal ratio)
5. **Review** the summary and running total, then **Export to CSV** if needed

### Custom split
- **Percent**: entries must total 100%
- **Dollar**: entries must total the line cost
- Invalid lines are excluded from group totals until fixed; export stays disabled until all custom splits are valid

### Keyboard
- **Enter** on the **item description** field adds another item row (other fields do not)
- **Tab** moves between fields as usual

## Developer guide

### Local development

```bash
cd app/web
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Tests

```bash
cd app/web
npm run test
```

### Production build

The build writes into `app/ec2/` (used by Terraform’s `archive_file` for the EC2 static bundle):

```bash
cd app/web
npm run build
```

Then apply infrastructure as needed:

```bash
cd tf
terraform apply
```

Always run `npm run build` in `app/web` before `terraform apply` if the UI changed, so `ec2_assets.zip` includes the latest assets.

## Documentation

- **README.md** (this file): overview and workflows
- **TECHNICAL_DOCS.md**: architecture and module layout

## License

This project is open source and available under the MIT License.
