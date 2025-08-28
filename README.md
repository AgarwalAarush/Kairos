# Kairos Todo Application

A modern, intelligent todo list application built with Next.js 14+, Supabase, and TypeScript. Kairos features smart natural language parsing, advanced organization tools, and a beautiful, responsive interface.

## ✨ Key Features

### 🧠 Smart Text Parsing
- **Natural Language Dates**: Parse dates like "tomorrow", "next Friday", "in 2 weeks"
- **Hashtag Tags**: Automatically extract `#work`, `#personal`, `#urgent` tags
- **Project Assignment**: Use `@project` syntax to assign todos to projects
- **Priority Levels**: Set priority with `!` (high), `!!` (medium), `!!!` (low)

### 🎯 Advanced Organization
- **Multi-criteria Filtering**: Filter by completion status, tags, projects, and priority
- **Full-text Search**: Search across todo titles, descriptions, tags, and projects
- **Flexible Sorting**: Sort by creation date, due date, priority, title, or completion status
- **Bulk Operations**: Select multiple todos for batch actions (complete, delete, tag)

### 📅 Date Management
- **Due Dates**: Set and track when tasks are due with overdue highlighting
- **Work Dates**: Schedule when to work on tasks
- **Date-based Views**: Filter and sort by various date criteria

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Toggle between themes with system preference support
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Smooth Animations**: Polished transitions and loading states
- **Toast Notifications**: Real-time feedback for all actions
- **Keyboard Shortcuts**: Efficient navigation with Enter, Escape, and more

### 🔐 Secure & Scalable
- **Google OAuth Authentication**: Secure sign-in with Google accounts
- **Row-Level Security**: Data isolation using Supabase RLS policies
- **Real-time Sync**: Instant updates across devices and sessions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- A Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kairos
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   
   Run the SQL schema in your Supabase project:
   ```bash
   # Copy the contents of supabase/schema.sql
   # and run it in your Supabase SQL editor
   ```

5. **Configure Google OAuth**
   
   In your Supabase project dashboard:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your OAuth credentials
   - Set redirect URL to: `http://localhost:3000/auth/callback`

6. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Examples

### Smart Text Parsing Examples

```
"Finish project proposal #work @client due Friday !"
```
- **Title**: "Finish project proposal"
- **Tags**: ["work"]  
- **Project**: "client"
- **Due Date**: Next Friday
- **Priority**: High (!)

```
"Buy groceries #personal tomorrow !!"
```
- **Title**: "Buy groceries"
- **Tags**: ["personal"]
- **Due Date**: Tomorrow
- **Priority**: Medium (!!)

```
"Review code #development @webapp next week"
```
- **Title**: "Review code" 
- **Tags**: ["development"]
- **Project**: "webapp"
- **Work Date**: Next week

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Language**: TypeScript
- **Date Parsing**: chrono-node for natural language dates

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   └── layout.tsx         # Root layout with providers
├── components/            # React components
│   ├── todos/            # Todo-specific components
│   ├── ui/               # shadcn/ui components
│   └── theme-toggle.tsx  # Theme switching
├── lib/                  # Utilities and services
│   ├── services/         # API services
│   ├── supabase/         # Supabase clients
│   └── utils/            # Helper utilities
└── types/                # TypeScript type definitions
```

### Database Schema
The application uses a single `todos` table with the following structure:
- `id`: UUID primary key
- `user_id`: Foreign key to auth.users
- `title`: Todo title text
- `description`: Optional description
- `tags`: Array of tag strings
- `project`: Optional project name
- `priority`: Integer (1=high, 2=medium, 3=low)
- `due_date`: Optional due date timestamp
- `work_date`: Optional work date timestamp
- `completed`: Boolean completion status
- `created_at`/`updated_at`: Timestamps

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

- **TodoParser**: Handles natural language parsing and text extraction
- **TodoService**: Manages CRUD operations with Supabase
- **TodoList**: Main todo display and interaction component
- **TodoFilters**: Advanced filtering and search interface
- **BulkActionToolbar**: Multi-select operations

## 🔧 Configuration

### Theme Configuration
The application supports system preference detection and manual theme switching. Themes are configured in `src/components/theme-provider.tsx`.

### Date Parsing
Natural language date parsing is handled by `chrono-node` and can be customized in `src/lib/utils/todoParser.ts`.

## 🚀 Deployment

The application is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Update Supabase OAuth redirect URLs for production
4. Deploy automatically on push to main branch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ using Next.js, Supabase, and modern web technologies.**