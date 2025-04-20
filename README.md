# Warehouse Picking Dashboard

A real-time dashboard for monitoring warehouse picker performance and productivity. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Real-time performance tracking
- Race track visualization of picker progress
- End of shift projections with gap analysis
- Fullscreen mode for components
- Interactive data visualization
- Responsive design

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/warehouse-picking-dashboard.git
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your environment variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/
│   ├── api/         # API routes
│   ├── components/  # React components
│   └── lib/        # Utilities, hooks, and contexts
├── styles/         # Global styles
└── types/         # TypeScript type definitions
```

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Firebase](https://firebase.google.com/) - Backend services
- [Recharts](https://recharts.org/) - Charting library

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.