# SocialSphere

A full-stack social media application with real-time features.

## Architecture

### Monorepo Structure (pnpm workspaces)
- `artifacts/social-sphere` — React+Vite frontend (`@workspace/social-sphere`)
- `artifacts/api-server` — Express.js backend (`@workspace/api-server`)
- `lib/db` — Drizzle ORM + PostgreSQL schema (`@workspace/db`)
- `lib/api-spec` — OpenAPI 3.0 spec + codegen (`@workspace/api-spec`)
- `lib/api-client-react` — Generated TanStack Query hooks (`@workspace/api-client-react`)
- `lib/api-zod` — Generated Zod validation schemas (`@workspace/api-zod`)

### Routing
- Frontend: served at `/` (port 20835 in dev)
- API: served at `/api` (port 8080 in dev)
- Socket.io: path `/api/socket.io`

## Frontend (`artifacts/social-sphere`)

### Tech Stack
- React 18 + Vite + TypeScript
- TanStack Query v5 for data fetching
- Wouter for routing
- Tailwind CSS v4 + shadcn/ui components
- Framer Motion for animations
- Socket.io-client for real-time
- date-fns for date formatting

### Pages
- `/login` — Login page
- `/register` — Registration page
- `/` — Home Feed (protected, requires auth)
- `/profile/:userId` — User profile (protected)
- `/explore` — Explore public posts (public)
- `/notifications` — Notifications (protected)
- `/messages` — Direct messages (protected)

### Key Files
- `src/lib/auth.tsx` — AuthContext with login/register/logout
- `src/lib/socket.tsx` — SocketContext with Socket.io connection
- `src/components/layout/Layout.tsx` — App shell with sidebar + mobile nav
- `src/components/posts/PostCard.tsx` — Full post card with likes, comments, share
- `src/components/posts/CommentSection.tsx` — Inline comments with replies
- `src/components/posts/CreatePost.tsx` — Post creation box
- `src/components/users/UserSuggestionCard.tsx` — Follow suggestion card

### Auth Flow
- JWT tokens stored in localStorage (`accessToken`, `refreshToken`)
- `setAuthTokenGetter` from `@workspace/api-client-react` attaches token to all API calls
- Redirect to `/login` for protected routes

## Backend (`artifacts/api-server`)

### Tech Stack
- Express.js 5 + TypeScript
- Drizzle ORM + PostgreSQL
- JWT (jsonwebtoken) + bcryptjs for auth
- Socket.io for real-time events
- Helmet + express-rate-limit for security
- Pino for logging

### API Routes
- `GET /api/healthz` — Health check
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user
- `GET/PUT /api/users/:userId` — Profile CRUD
- `POST /api/users/:userId/follow` — Toggle follow
- `GET /api/users/:userId/followers` — Get followers
- `GET /api/users/:userId/following` — Get following
- `GET /api/users/suggestions/list` — Suggested users
- `GET /api/users/search` — Search users
- `GET /api/posts/feed` — Authenticated feed
- `GET /api/posts/explore` — Public explore feed
- `POST /api/posts` — Create post
- `GET/PUT/DELETE /api/posts/:postId` — Post CRUD
- `POST /api/posts/:postId/like` — Toggle like
- `GET /api/comments/:postId` — Get comments
- `POST /api/comments/:postId` — Create comment
- `DELETE /api/comments/:commentId` — Delete comment
- `POST /api/comments/:commentId/like` — Toggle comment like
- `POST /api/comments/:commentId/reply` — Reply to comment
- `GET /api/notifications` — Get notifications
- `PUT /api/notifications/read-all` — Mark all read
- `PUT /api/notifications/:id/read` — Mark one read
- `DELETE /api/notifications/:id` — Delete notification
- `GET /api/messages/conversations` — Get conversations
- `GET /api/messages/conversations/:id` — Get messages in conversation
- `POST /api/messages/send` — Send message
- `DELETE /api/messages/:id` — Delete message

### Socket.io Events
- Server emits: `newPost`, `newLike`, `newComment`, `newMessage`, `userOnline`, `userOffline`, `notificationCount`
- Client emits: `joinPost`, `leavePost`, `joinConversation`, `leaveConversation`

## Database Schema (`lib/db`)

Tables: `users`, `follows`, `posts`, `comments`, `likes`, `notifications`, `conversations`

### Migrations
```bash
pnpm --filter @workspace/db run push
```

## API Codegen
```bash
pnpm --filter @workspace/api-spec run codegen
```

## Demo Accounts
All demo accounts use password: `password123`
- alex@example.com (alex_chen)
- maya@example.com (maya_patel)
- jordan@example.com (jordan_lee)

## Development

Start all workflows via the Replit UI or:
- API Server: `pnpm --filter @workspace/api-server run dev`
- Frontend: `pnpm --filter @workspace/social-sphere run dev`
