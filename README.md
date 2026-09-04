# SocialSphere

A full-stack, real-time social networking platform built with a modern monorepo architecture. SocialSphere enables users to create profiles, share posts, interact through likes and comments, follow other users, exchange direct messages, and receive instant notifications — all powered by WebSocket technology.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Endpoints](#api-endpoints)
- [Documentation](#documentation)
- [License](#license)

---

## Tech Stack

| Layer              | Technologies                                          |
| :----------------- | :---------------------------------------------------- |
| Frontend           | React 18, Vite, TypeScript                            |
| Styling and UI     | Tailwind CSS v4, shadcn/ui, Framer Motion             |
| Routing and State  | Wouter, TanStack React Query v5                       |
| Backend            | Node.js, Express.js v5, TypeScript                    |
| Real-time Engine   | Socket.io (WebSockets)                                |
| Database           | SQLite, Drizzle ORM                                   |
| Validation         | Zod, OpenAPI (Orval)                                  |
| Authentication     | JSON Web Tokens (JWT), bcryptjs                       |
| Security           | Helmet, express-rate-limit, CORS                      |
| Media Storage      | Cloudinary, Multer                                    |
| Build Tooling      | pnpm workspaces, esbuild                              |

---

## Features

**User Management**
- Secure registration and login with hashed passwords (bcrypt) and JWT-based session management.
- Profile viewing and editing with avatar and bio support.

**Social Graph**
- Follow and unfollow users to curate a personalized home feed.
- Explore page to discover public content from across the platform.

**Content and Interactions**
- Create text posts with configurable visibility settings.
- Like and comment on posts with real-time count updates.
- Infinite scroll pagination for seamless feed browsing.

**Real-Time Communication**
- Instant push notifications for likes, comments, and follows via Socket.io.
- Live feed updates without requiring page refreshes.
- Direct messaging system with real-time message delivery.

**Media Uploads**
- Image upload support powered by Cloudinary integration.

---

## Architecture

SocialSphere follows a **monorepo** structure managed by pnpm workspaces, with clear separation between frontend, backend, and shared libraries.

```
Client (React SPA)
    |
    |-- REST API (HTTP) ---> Express.js Server
    |-- WebSocket (WS) ----> Socket.io Server
                                  |
                                  |---> SQLite Database (via Drizzle ORM)
                                  |---> Cloudinary (media storage)
```

**Contract-Driven Development:** API contracts are defined using Zod schemas shared between client and server. The frontend consumes auto-generated, type-safe API clients via Orval and TanStack React Query, ensuring complete synchronization between both ends.

---

## Project Structure

```
SocialSphere/
|-- artifacts/
|   |-- api-server/           # Express.js backend application
|   |   |-- src/
|   |   |   |-- controllers/  # Request handlers
|   |   |   |-- middlewares/  # Auth, validation, error handling
|   |   |   |-- routes/       # API route definitions
|   |   |   |-- socket/       # Socket.io event handlers
|   |   |   |-- lib/          # Utilities and helpers
|   |   |   |-- app.ts        # Express app configuration
|   |   |   +-- index.ts      # Server entry point
|   |   +-- build.mjs         # esbuild configuration
|   |
|   +-- social-sphere/        # React frontend application
|       +-- src/
|           |-- components/   # Reusable UI components
|           |-- pages/        # Route-level page components
|           |-- hooks/        # Custom React hooks
|           +-- lib/          # API clients, utilities
|
|-- lib/
|   +-- db/                   # Shared database package
|       +-- src/
|           +-- schema/       # Drizzle ORM table definitions
|               |-- users.ts
|               |-- posts.ts
|               |-- comments.ts
|               |-- likes.ts
|               |-- follows.ts
|               |-- notifications.ts
|               +-- conversations.ts
|
|-- package.json              # Root workspace configuration
|-- pnpm-workspace.yaml       # Workspace package definitions
|-- tsconfig.base.json        # Shared TypeScript configuration
+-- sqlite.db                 # SQLite database file
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- pnpm (v8 or higher recommended)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/adityaashhhh/SocialSphere.git
   cd SocialSphere
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up the database schema:

   ```bash
   cd lib/db
   pnpm run push
   ```

4. Configure environment variables (see section below).

5. Start the backend server:

   ```bash
   cd artifacts/api-server
   pnpm run dev
   ```

6. Start the frontend development server:

   ```bash
   cd artifacts/social-sphere
   pnpm run dev
   ```

The application will be accessible at `http://localhost:5173` by default.

---

## Environment Variables

Create a `.env` file inside `artifacts/api-server/` with the following variables:

```
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_URL=your_cloudinary_url
```

---

## Database

SocialSphere uses **SQLite** as its database, managed through **Drizzle ORM**. The database schema includes the following entities:

| Table           | Description                                  |
| :-------------- | :------------------------------------------- |
| users           | User accounts, profiles, and credentials     |
| posts           | User-created content with visibility control |
| comments        | Replies and discussions on posts             |
| likes           | Like records for posts and comments          |
| follows         | Social graph relationships between users     |
| notifications   | System and interaction notifications         |
| conversations   | Direct messaging threads and messages        |

To inspect the database visually, run Drizzle Studio:

```bash
cd lib/db
pnpm dlx drizzle-kit studio
```

---

## API Endpoints

| Method | Endpoint             | Description                     |
| :----- | :------------------- | :------------------------------ |
| POST   | /api/auth/register   | Register a new user             |
| POST   | /api/auth/login      | Authenticate and receive a JWT  |
| GET    | /api/users/:id       | Retrieve user profile           |
| GET    | /api/posts           | Fetch paginated feed            |
| POST   | /api/posts           | Create a new post               |
| POST   | /api/comments        | Add a comment to a post         |
| POST   | /api/posts/:id/like  | Like or unlike a post           |
| GET    | /api/notifications   | Fetch user notifications        |
| GET    | /api/messages        | Fetch conversation messages     |
| POST   | /api/upload          | Upload media files              |

---

## Documentation

The `SRS_Document.md` file contains the complete Software Requirement Specification following IEEE standards. UML diagrams are provided in Mermaid format:

- `use_case.mmd` — Use Case Diagram
- `class.mmd` — Class Diagram
- `sequence.mmd` — Sequence Diagram
- `activity.mmd` — Activity Diagram
- `implementation.mmd` — Implementation Diagram

---

## License

This project is licensed under the MIT License.
