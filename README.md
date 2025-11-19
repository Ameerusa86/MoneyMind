# WalletWave

A comprehensive Next.js application for tracking personal finances including income, expenses, credit cards, loans, and payments. Built with a feature-branch workflow to systematically implement each capability.

## 📖 Documentation

- **[Feature Roadmap](./docs/feature-plan.md)** - Complete list of planned features with tickets, tasks, and acceptance criteria
- **[Branching Workflow](./docs/branching.md)** - Git workflow, branch naming conventions, and PR guidelines
- **[Pull Request Template](./.github/pull_request_template.md)** - Standard template for all PRs

## Development Approach

This project follows a structured feature-branch workflow:

1. Each feature gets its own branch (e.g., `feature/income-schedule`)
2. Features are built incrementally with clear acceptance criteria
3. Pull requests are opened after local testing
4. Code is reviewed and merged to `master` after approval

See [docs/feature-plan.md](./docs/feature-plan.md) for the complete roadmap and [docs/branching.md](./docs/branching.md) for workflow details.

## Features

### 📊 Dashboard

- Overview of financial status with key metrics
- Total income and expenses tracking
- Credit card debt monitoring
- Loan balance overview
- Savings and net worth display
- Interactive charts showing income vs expenses
- Expense breakdown by category
- Recent transactions list

### 💰 Income Tracking

- Add and categorize income sources
- Track one-time and recurring income
- View total and monthly recurring income
- Detailed transaction history

### 💸 Expenses Management

- Track and categorize all expenses
- Multiple expense categories (Food, Transportation, Utilities, Shopping, Healthcare, Entertainment)
- Visual expense breakdown
- Category-wise spending analysis

### 💳 Credit Cards

- Manage multiple credit cards
- Track balances and credit limits
- Monitor credit utilization rates
- Payment due dates and reminders
- Interest rates and rewards tracking
- Visual card displays with detailed information

### 🏦 Loans

- Track mortgages, auto loans, student loans, and personal loans
- Monitor principal balance and payments
- View payment schedules
- Track interest rates
- Progress visualization for each loan
- Upcoming payment reminders

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies

```bash
npm install
```

2. Run the development server

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```plaintext
wallet-wave/
├── app/
│   ├── page.tsx              # Dashboard page
│   ├── income/
│   │   └── page.tsx          # Income schedule & tracking
│   ├── expenses/
│   │   └── page.tsx          # Expenses page
│   ├── credit-cards/
│   │   └── page.tsx          # Credit cards page
│   ├── loans/
│   │   └── page.tsx          # Loans page
│   ├── layout.tsx            # Root layout with navigation
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── navbar.tsx            # Navigation component
│   ├── recent-transactions.tsx
│   ├── monthly-chart.tsx
│   └── expense-breakdown.tsx
├── lib/
│   ├── types.ts              # TypeScript type definitions
│   ├── storage.ts            # Client-side storage abstraction
│   └── utils.ts              # Utility functions
├── docs/
│   ├── feature-plan.md       # Feature roadmap and tickets
│   └── branching.md          # Git workflow documentation
├── .github/
│   └── pull_request_template.md
└── package.json
```

## Usage

### Setting Up Income Schedule

1. Navigate to **Income** page
2. Configure your pay frequency (weekly, bi-weekly, etc.)
3. Set your next pay date and typical net amount
4. Save to see upcoming pay dates and track your income schedule

### Adding Transactions

1. Navigate to the relevant page (Income, Expenses, Credit Cards, or Loans)
2. Click the "Add" button
3. Fill in the transaction details
4. Submit to persist to local storage

### Viewing Analytics

- Visit the Dashboard to see an overview of all your finances
- Use the tabs to switch between different chart views
- Check individual pages for category-specific insights

## Data Persistence

The application uses **localStorage** for client-side persistence. All data (pay schedules, accounts, bills, expenses) is stored locally in your browser. Future versions will add backend integration for cloud sync.

## Future Enhancements

- Database integration for persistent data storage
- User authentication and multi-user support
- Export data to CSV/PDF
- Budget planning and alerts
- Bill reminders and notifications
- Mobile responsive enhancements
- Dark mode support
- Advanced filtering and search
- Financial goals tracking
- Investment portfolio tracking

## License

This project is open source and available under the MIT License.
