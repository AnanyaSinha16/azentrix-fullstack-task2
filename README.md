# TaskFlow Pro — Azentrix Full-Stack Task 2

## Problem Statement
Remote teams lack a lightweight, self-hostable task collaboration tool. Most existing tools are either too bloated or too expensive for small teams.

## Task
Build a Multi-User Task Management System (mini Trello) where:
* Users can register and log in using JWT-based auth
* Boards contain columns (To Do / In Progress / Done) with draggable cards
* Cards support title, description, assignee, due date, and priority tag
* Two users on the same board see updates in near real-time (WebSockets)
* Admins can manage users; Members can only manage their own cards
* The app is deployed on a free tier with a live link

**🌐 Live Demo:** [https://azentrix-fullstack-task2-delta.vercel.app/](https://azentrix-fullstack-task2-delta.vercel.app/)

---

## Features

- **Authentication** — Register/login with JWT stored in httpOnly cookies
- **Premium Dashboard** — Stats widgets, daily standup form & team activity feed
- **Kanban Boards** — To Do, In Progress, Done columns with draggable cards (`@dnd-kit`)
- **My Tasks** — Personal task view with priority filters and search
- **Analytics** — Recharts visualizations for task completion and team performance
- **Team Members** — Admin-only user management with role assignment
- **Activity Logs** — Full audit trail of all team actions (Admin only)
- **Settings** — Profile and password update
- **Real-time Sync** — Socket.io broadcasts card changes to all clients on a board

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 14, TypeScript, Vanilla CSS |
| Backend | Next.js API routes + custom Node server |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (`jose`) + bcrypt |
| Real-time | Socket.io |
| Deploy | Vercel |

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone and install

```bash
git clone https://github.com/AnanyaSinha16/azentrix-fullstack-task2.git
cd azentrix-fullstack-task2
npm install
```

### 2. Environment variables

Create a `.env` file in the root:

```env
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/taskflow"
JWT_SECRET="your-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3006"
PORT=3006
```

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3006](http://localhost:3006).

### Demo Credentials (Live App)

| Role | Email | Password |
|------|-------|----------|
| Admin | 220003092cser@gmail.com | Password123 |

> The **first user to register** is automatically assigned the **Admin** role.

---

## Deploy to Vercel

1. Fork or clone this repo to your GitHub account.
2. Connect the repo to [Vercel](https://vercel.com).
3. Set the following environment variables in Vercel project settings:
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — long random string
   - `NEXT_PUBLIC_APP_URL` — your Vercel deployment URL
4. Deploy!

---

## Architecture

The app runs as a **Next.js 14** monolith deployed on Vercel:
- **API Routes** handle all backend logic (auth, boards, tasks, users, standups, analytics)
- **Mongoose** schemas define the MongoDB data models
- **Socket.io** provides real-time board sync
- **JWT** in httpOnly cookies handles authentication
- **Middleware** protects all `/app/*` routes

## Permissions

- **Admin** — full user management, view all activity logs, edit/delete any card
- **Member** — can create/edit cards assigned to them; can view their own tasks

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── (app)/          # Protected pages (dashboard, boards, tasks…)
│   │   ├── api/            # API routes (auth, boards, tasks, users…)
│   │   ├── login/          # Login page
│   │   └── register/       # Register page
│   ├── components/         # Sidebar, BoardView, TaskCard, modals…
│   ├── lib/                # MongoDB connection, auth helpers, permissions
│   ├── models/             # Mongoose schemas (User, Board, Task, Standup, Activity)
│   └── types/              # TypeScript type definitions
└── render.yaml
```

## License

MIT
