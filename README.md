# Azentrix Full-Stack Task 2 — Kanban Board

## Task 2
**Problem Statement:**  
Remote teams lack a lightweight, self-hostable task collaboration tool. Most existing tools are either too bloated or too expensive for small teams. 

**Task to Do:**  
Build a Multi-User Task Management System (mini Trello) where: 
* Users can register and log in using JWT or session-based auth 
* Boards contain columns (To Do / In Progress / Done) with draggable cards 
* Cards support title, description, assignee, due date, and priority tag 
* Two users on the same board see updates in near real-time (WebSockets or polling) 
* Admins can manage users; Members can only manage their own cards 
* The app must be deployed on a free tier (Render, Railway, Vercel, etc.) with a live link shared in the README

**Live demo:** [https://azentrix-fullstack-task2.onrender.com](https://azentrix-fullstack-task2.onrender.com) (Default template URL - configure your Render service mapping to this subdomain or update it after setting up a custom domain/service name)


## Features

- **Authentication** — Register/login with JWT stored in httpOnly cookies
- **Kanban boards** — To Do, In Progress, Done columns
- **Draggable cards** — Title, description, assignee, due date, priority (`@dnd-kit`)
- **Real-time sync** — Socket.io broadcasts card create/update/move/delete to all clients on a board
- **Role-based access** — Admins manage users and edit any card; members edit only cards assigned to them

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Next.js API routes + custom Node server |
| Database | PostgreSQL (Prisma ORM) |
| Auth | JWT (`jose`) + bcrypt |
| Real-time | Socket.io |
| Deploy | Render (monolith) |

## Screenshots

<!-- Replace with actual screenshots after deployment -->

| Login | Board view |
|-------|------------|
| ![Login placeholder](./docs/screenshots/login.png) | ![Board placeholder](./docs/screenshots/board.png) |

## Local setup

### Prerequisites

- Node.js 18+
- PostgreSQL database ([Neon](https://neon.tech) free tier works well)

### 1. Clone and install

```bash
git clone https://github.com/AnanyaSinha16/azentrix-fullstack-task2.git
cd azentrix-fullstack-task2
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
JWT_SECRET="a-long-random-secret-string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database

```bash
npx prisma db push
npm run db:seed
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@azentrix.com | admin123 |
| Member | member@azentrix.com | member123 |

## Deploy to Render

1. Create a **Neon** PostgreSQL database and copy the connection string.
2. In Render, create a **Web Service** from this repo (or use the included `render.yaml`).
3. Set environment variables:
   - `DATABASE_URL` — Neon connection string
   - `JWT_SECRET` — long random string
   - `NEXT_PUBLIC_APP_URL` — your Render service URL (e.g. `https://azentrix-fullstack-task2.onrender.com`)
4. Build command: `npm install && npm run build && npx prisma db push && npm run db:seed`
5. Start command: `npm start`

After deploy, update the **Live demo** link at the top of this README.

## Approach

### Architecture

The app runs as a **monolith**: a custom `server.ts` hosts both the Next.js app and a Socket.io server on the same port. This keeps WebSockets and HTTP on one Render web service without a separate API host.

### Auth

Users register/login via REST endpoints. Passwords are hashed with bcrypt. A signed JWT is stored in an `httpOnly` cookie (`azentrix_token`) for seven days. API routes read the cookie on each request; Socket.io middleware validates the same token on connection.

### Permissions

- **Admin** — full user CRUD at `/admin`, can edit/delete any card
- **Member** — can edit cards where `assigneeId` matches their user id; can delete cards they created or are assigned to

### Real-time

Clients join a Socket.io room per board (`board:{boardId}`). When a card is created, updated, moved, or deleted via the REST API, the server emits to that room so other tabs/users update immediately.

### Drag and drop

`@dnd-kit` handles within-column reordering and cross-column moves. On drop, the client optimistically updates UI and PATCHes the card with new `columnId` and `order`.

## Loom walkthrough script

Use this outline when recording your demo video:

1. **Intro (30s)** — App name, live URL, stack summary
2. **Auth (45s)** — Register a user, log out, log in as admin demo account
3. **Boards (1m)** — Open seeded board, create a new card, set assignee/due date/priority
4. **Drag & drop (45s)** — Move cards across To Do → In Progress → Done
5. **Real-time (45s)** — Open two browser windows; change a card in one, show instant sync in the other
6. **Permissions (45s)** — Log in as member; show read-only on unassigned cards; admin edits any card
7. **Admin (30s)** — Promote a user, show user list
8. **Outro (15s)** — GitHub repo, README, thank you

## Project structure

```
├── server.ts              # Custom server (Next.js + Socket.io)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/               # Pages & API routes
│   ├── components/        # UI components
│   └── lib/               # Auth, prisma, socket helpers
└── render.yaml
```

## License

MIT
