# Partners Dashboard

A partner dashboard for monitoring cross-chain swap metrics, transactions, and analytics.

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd partners-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Neon database URL:
   ```env
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   SESSION_SECRET=<generate-a-random-secret>
   NODE_ENV=development
   PORT=5000
   ```

4. **Run database migrations**
   - Use Neon SQL Editor to run `migrations/0000_initial.sql`
   - OR use Drizzle Kit: `npm run db:push`

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   Navigate to `http://localhost:3000`

---

## 🗄️ Database Schema

The project uses PostgreSQL with the following tables:

- **users** - User authentication and profiles
- **projects** - Partner project information
- **metric_points** - Time-series metrics data
- **transactions** - Transaction history

See `shared/schema.ts` for full schema definitions

---

## 🚢 Deployment

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `NODE_ENV=production`
4. Deploy!

---

## 📁 Project Structure

```
partners-dashboard/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities & helpers
│   └── index.html
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database layer
│   └── vite.ts          # Vite middleware
├── shared/              # Shared between client/server
│   └── schema.ts        # Database schema & types
├── migrations/          # Database migrations
│   └── 0000_initial.sql
├── .env.example         # Environment template
├── vercel.json          # Vercel config
└── package.json
```

---

## 🛠️ Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push schema changes to database

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Secret for session encryption | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port (default: 5000) | No |

---

## 🧪 Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon), Drizzle ORM
- **Auth**: Express Session, bcrypt
- **Deployment**: Vercel
- **State Management**: TanStack Query

---

## 🐛 Troubleshooting

### "DATABASE_URL is not set"
- Check your `.env` file exists
- Verify the environment variable name is correct
- For Vercel: check environment variables in project settings

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 20+)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Session issues on Vercel
- The current session store uses memory, which doesn't work well in serverless
- See deployment guide for PostgreSQL session store setup

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

---

## 📄 License

MIT

---