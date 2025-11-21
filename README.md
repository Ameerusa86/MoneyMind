# 💰 MoneyMind

A modern, full-stack personal finance management application built with Next.js 16, TypeScript, and MongoDB. Track your income, expenses, bills, credit cards, loans, and more with an intuitive interface and powerful analytics.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)

## ✨ Features

### 📊 Dashboard & Analytics

- Real-time overview of your financial status
- Interactive charts for income vs expenses
- Expense breakdown by category
- Recent transaction history
- Net worth and savings tracking

### 💸 Comprehensive Financial Management

- **Income Tracking**: Multiple income streams with pay schedule automation
- **Expense Management**: Categorized expense tracking with visual breakdowns
- **Bill Tracking**: Never miss a payment with due date reminders
- **Credit Cards**: Monitor balances, credit limits, and utilization rates
- **Loans**: Track mortgages, auto loans, student loans, and personal loans
- **Accounts**: Manage checking, savings, and investment accounts

### 🔐 Authentication & Security

- Secure authentication with Better Auth
- Email/password and social login (Google, GitHub)
- Session management with automatic refresh
- Protected API routes with middleware

### 📈 Advanced Features

- **Payment Planner**: Strategic bill payment scheduling
- **Pay Period Management**: Automatic pay period generation
- **Balance Tracking**: Real-time account balance updates
- **Transaction History**: Complete audit trail of all financial activities
- **Reports**: Generate insights on spending patterns

### 🎨 Modern UI/UX

- Responsive design for mobile, tablet, and desktop
- Dark/light theme support
- Beautiful components from shadcn/ui
- Smooth animations and transitions
- Intuitive navigation

## 🚀 Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation

### Backend

- **Database**: MongoDB 7.0 with Mongoose ODM
- **Authentication**: Better Auth 1.3
- **API Routes**: Next.js API Routes
- **Session Management**: Cookie-based sessions

### DevOps

- **Hosting**: Vercel (recommended)
- **Version Control**: Git + GitHub
- **Package Manager**: npm

## 📦 Installation

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier available)
- Git installed

### Local Development Setup

1. **Clone the repository**

```bash
   git clone https://github.com/yourusername/finance-tracker.git
   cd finance-tracker
```

2. **Install dependencies**

```bash
   npm install
```

3. **Set up environment variables**

   Copy .env.example to .env.local:

```bash
   cp .env.example .env.local
```

Update .env.local with your credentials

4. **Generate authentication secret**

```bash
   openssl rand -base64 32
```

Copy the output to BETTER_AUTH_SECRET in .env.local

5. **Run the development server**

```bash
   npm run dev
```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### 🎭 Try the Demo

Want to test the app without setting up a database? Use the demo account:

- **Email**: `test@test.com`
- **Password**: `Test123456`

The demo account uses local storage only and comes pre-populated with sample data. Perfect for exploring features!

## 🌐 Deployment to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/finance-tracker)

### Manual Deployment

1. **Install Vercel CLI** (optional)

```bash
   npm install -g vercel
```

2. **Connect to Vercel**

```bash
   vercel login
```

3. **Deploy**

```bash
   vercel
```

4. **Configure Environment Variables**

   In your Vercel dashboard (Project Settings → Environment Variables), add:
   - MONGODB_URI
   - BETTER_AUTH_SECRET
   - BETTER_AUTH_URL (set to your production URL)
   - OAuth credentials (optional)

5. **Redeploy**

```bash
   vercel --prod
```

### Important Notes for Production

- Update BETTER_AUTH_URL to match your production domain
- Ensure MongoDB Atlas allows connections from Vercel IPs
- Add your production domain to OAuth provider redirect URIs
- Enable MongoDB connection pooling for better performance

## 🗂️ Project Structure

```
finance-tracker/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   ├── (pages)/                  # Application pages
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
├── lib/                          # Utilities and models
├── docs/                         # Project documentation
├── public/                       # Static assets
└── .env.example                  # Environment variable template
```

## 🔒 Security & Best Practices

- ✅ Environment variables properly secured with .env.local (gitignored)
- ✅ Authentication tokens stored in HTTP-only cookies
- ✅ API routes protected with session middleware
- ✅ MongoDB connection pooling for efficiency
- ✅ Input validation with Zod schemas
- ✅ XSS protection via React's built-in escaping

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Git Workflow

This project follows a feature-branch workflow:

1. Create feature branch: git checkout -b feature/your-feature
2. Make changes and commit: git commit -m "feat: add feature"
3. Push branch: git push origin feature/your-feature
4. Open Pull Request
5. Merge to master after review

See [docs/branching.md](./docs/branching.md) for detailed workflow.

## 📚 Documentation

- **[Feature Roadmap](./docs/feature-plan.md)** - Complete feature list and tickets
- **[Branching Workflow](./docs/branching.md)** - Git conventions and PR process

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Your Name**

- GitHub: [@Ameerusa86](https://github.com/Ameerusa86)
- Portfolio: [Your Portfolio URL]

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful components
- [Better Auth](https://better-auth.com/) - Authentication solution
- [Recharts](https://recharts.org/) - Charting library

---

**⭐ If you find this project useful, please consider giving it a star on GitHub!**
