# Social-Sphere — Project Requirements

This is a **pnpm monorepo** composed of multiple packages/workspaces.
Install everything from the root with `pnpm install`.

---

## Prerequisites

| Tool       | Version     | Notes                              |
|------------|-------------|------------------------------------|
| Node.js    | >= 18.x     | Required runtime                   |
| pnpm       | >= 9.x      | Workspace package manager          |
| PostgreSQL  | >= 14       | Database (used via `pg` + Drizzle) |

---

## Workspace Packages

| Package                       | Location                          | Role                     |
|-------------------------------|-----------------------------------|--------------------------|
| `@workspace/db`               | `lib/db`                          | Drizzle ORM + DB schema  |
| `@workspace/api-zod`          | `lib/api-zod`                     | Zod type contracts       |
| `@workspace/api-client-react` | `lib/api-client-react`            | TanStack Query API hooks |
| `@workspace/api-spec`         | `lib/api-spec`                    | OpenAPI spec + codegen   |
| `@workspace/api-server`       | `artifacts/api-server`            | Express.js backend       |
| `@workspace/social-sphere`    | `artifacts/social-sphere`         | Vite + React frontend    |
| `@workspace/mockup-sandbox`   | `artifacts/mockup-sandbox`        | UI mockup dev sandbox    |
| `@workspace/scripts`          | `scripts`                         | Utility dev scripts      |

---

## Catalog (Shared / Pinned Versions)

These versions are defined centrally in `pnpm-workspace.yaml` and referenced as `catalog:` across packages.

| Package                                  | Version      |
|------------------------------------------|--------------|
| `@replit/vite-plugin-cartographer`       | ^0.5.1       |
| `@replit/vite-plugin-dev-banner`         | ^0.1.1       |
| `@replit/vite-plugin-runtime-error-modal`| ^0.0.6       |
| `@tailwindcss/vite`                      | ^4.1.14      |
| `@tanstack/react-query`                  | ^5.90.21     |
| `@types/node`                            | ^25.3.3      |
| `@types/react`                           | ^19.2.0      |
| `@types/react-dom`                       | ^19.2.0      |
| `@vitejs/plugin-react`                   | ^5.0.4       |
| `class-variance-authority`               | ^0.7.1       |
| `clsx`                                   | ^2.1.1       |
| `drizzle-orm`                            | ^0.45.2      |
| `framer-motion`                          | ^12.23.24    |
| `lucide-react`                           | ^0.545.0     |
| `react`                                  | 19.1.0       |
| `react-dom`                              | 19.1.0       |
| `tailwind-merge`                         | ^3.3.1       |
| `tailwindcss`                            | ^4.1.14      |
| `tsx`                                    | ^4.21.0      |
| `vite`                                   | ^7.3.2       |
| `wouter`                                 | ^3.3.5       |
| `zod`                                    | ^3.25.76     |

---

## Root Workspace (`/`)

### devDependencies

| Package      | Version  |
|--------------|----------|
| `typescript` | ~5.9.2   |
| `prettier`   | ^3.8.1   |

---

## `@workspace/db` — `lib/db`

### dependencies

| Package       | Version  |
|---------------|----------|
| `drizzle-orm` | catalog: |
| `drizzle-zod` | ^0.8.3   |
| `pg`          | ^8.20.0  |
| `zod`         | catalog: |

### devDependencies

| Package        | Version  |
|----------------|----------|
| `@types/node`  | catalog: |
| `@types/pg`    | ^8.18.0  |
| `drizzle-kit`  | ^0.31.9  |

---

## `@workspace/api-zod` — `lib/api-zod`

### dependencies

| Package | Version  |
|---------|----------|
| `zod`   | catalog: |

---

## `@workspace/api-client-react` — `lib/api-client-react`

### dependencies

| Package                | Version  |
|------------------------|----------|
| `@tanstack/react-query`| catalog: |

### peerDependencies

| Package | Version |
|---------|---------|
| `react` | >=18    |

---

## `@workspace/api-spec` — `lib/api-spec`

### devDependencies

| Package | Version |
|---------|---------|
| `orval` | ^8.5.2  |

---

## `@workspace/api-server` — `artifacts/api-server`

### dependencies

| Package                   | Version  |
|---------------------------|----------|
| `@workspace/api-zod`      | workspace:* |
| `@workspace/db`           | workspace:* |
| `bcryptjs`                | ^3.0.3   |
| `cloudinary`              | ^2.10.0  |
| `cookie-parser`           | ^1.4.7   |
| `cors`                    | ^2       |
| `drizzle-orm`             | catalog: |
| `express`                 | ^5       |
| `express-rate-limit`      | ^8.4.1   |
| `express-validator`       | ^7.3.2   |
| `helmet`                  | ^8.1.0   |
| `jsonwebtoken`            | ^9.0.3   |
| `morgan`                  | ^1.10.1  |
| `multer`                  | ^2.1.1   |
| `multer-storage-cloudinary`| ^4.0.0  |
| `pino`                    | ^9       |
| `pino-http`               | ^10      |
| `socket.io`               | ^4.8.3   |

### devDependencies

| Package                  | Version  |
|--------------------------|----------|
| `@types/bcryptjs`        | ^3.0.0   |
| `@types/cookie-parser`   | ^1.4.10  |
| `@types/cors`            | ^2.8.19  |
| `@types/express`         | ^5.0.6   |
| `@types/jsonwebtoken`    | ^9.0.10  |
| `@types/morgan`          | ^1.9.10  |
| `@types/multer`          | ^2.1.0   |
| `@types/node`            | catalog: |
| `esbuild`                | ^0.27.3  |
| `esbuild-plugin-pino`    | ^2.3.3   |
| `pino-pretty`            | ^13      |
| `thread-stream`          | 3.1.0    |

---

## `@workspace/social-sphere` — `artifacts/social-sphere`

### dependencies

| Package           | Version |
|-------------------|---------|
| `socket.io-client`| ^4.8.3  |

### devDependencies (UI / Framework)

| Package                                   | Version   |
|-------------------------------------------|-----------|
| `react`                                   | catalog:  |
| `react-dom`                               | catalog:  |
| `vite`                                    | catalog:  |
| `@vitejs/plugin-react`                    | catalog:  |
| `@tailwindcss/vite`                       | catalog:  |
| `@tailwindcss/typography`                 | ^0.5.15   |
| `tailwindcss`                             | catalog:  |
| `tailwind-merge`                          | catalog:  |
| `tw-animate-css`                          | ^1.4.0    |
| `framer-motion`                           | catalog:  |
| `lucide-react`                            | catalog:  |
| `wouter`                                  | catalog:  |
| `zod`                                     | catalog:  |
| `@tanstack/react-query`                   | catalog:  |
| `@workspace/api-client-react`             | workspace:* |
| `class-variance-authority`                | catalog:  |
| `clsx`                                    | catalog:  |
| `@types/node`                             | catalog:  |
| `@types/react`                            | catalog:  |
| `@types/react-dom`                        | catalog:  |

### devDependencies (Radix UI Components)

| Package                              | Version   |
|--------------------------------------|-----------|
| `@radix-ui/react-accordion`          | ^1.2.4    |
| `@radix-ui/react-alert-dialog`       | ^1.1.7    |
| `@radix-ui/react-aspect-ratio`       | ^1.1.3    |
| `@radix-ui/react-avatar`             | ^1.1.4    |
| `@radix-ui/react-checkbox`           | ^1.1.5    |
| `@radix-ui/react-collapsible`        | ^1.1.4    |
| `@radix-ui/react-context-menu`       | ^2.2.7    |
| `@radix-ui/react-dialog`             | ^1.1.7    |
| `@radix-ui/react-dropdown-menu`      | ^2.1.7    |
| `@radix-ui/react-hover-card`         | ^1.1.7    |
| `@radix-ui/react-label`              | ^2.1.3    |
| `@radix-ui/react-menubar`            | ^1.1.7    |
| `@radix-ui/react-navigation-menu`    | ^1.2.6    |
| `@radix-ui/react-popover`            | ^1.1.7    |
| `@radix-ui/react-progress`           | ^1.1.3    |
| `@radix-ui/react-radio-group`        | ^1.2.4    |
| `@radix-ui/react-scroll-area`        | ^1.2.4    |
| `@radix-ui/react-select`             | ^2.1.7    |
| `@radix-ui/react-separator`          | ^1.1.3    |
| `@radix-ui/react-slider`             | ^1.2.4    |
| `@radix-ui/react-slot`               | ^1.2.0    |
| `@radix-ui/react-switch`             | ^1.1.4    |
| `@radix-ui/react-tabs`               | ^1.1.4    |
| `@radix-ui/react-toast`              | ^1.2.7    |
| `@radix-ui/react-toggle`             | ^1.1.3    |
| `@radix-ui/react-toggle-group`       | ^1.1.3    |
| `@radix-ui/react-tooltip`            | ^1.2.0    |

### devDependencies (Other UI/Utility)

| Package                       | Version   |
|-------------------------------|-----------|
| `@hookform/resolvers`         | ^3.10.0   |
| `cmdk`                        | ^1.1.1    |
| `date-fns`                    | ^3.6.0    |
| `embla-carousel-react`        | ^8.6.0    |
| `input-otp`                   | ^1.4.2    |
| `next-themes`                 | ^0.4.6    |
| `react-day-picker`            | ^9.11.1   |
| `react-hook-form`             | ^7.55.0   |
| `react-icons`                 | ^5.4.0    |
| `react-resizable-panels`      | ^2.1.7    |
| `recharts`                    | ^2.15.2   |
| `sonner`                      | ^2.0.7    |
| `vaul`                        | ^1.1.2    |
| `@replit/vite-plugin-cartographer`     | catalog: |
| `@replit/vite-plugin-dev-banner`       | catalog: |
| `@replit/vite-plugin-runtime-error-modal` | catalog: |

---

## `@workspace/mockup-sandbox` — `artifacts/mockup-sandbox`

Similar to `social-sphere` (shared Radix UI, Tailwind, Vite stack), plus:

| Package              | Version  |
|----------------------|----------|
| `chokidar`           | ^4.0.3   |
| `fast-glob`          | ^3.3.3   |
| `tailwindcss-animate`| ^1.0.7   |
| `react-hook-form`    | ^7.66.0  |

---

## `@workspace/scripts` — `scripts`

### devDependencies

| Package       | Version  |
|---------------|----------|
| `@types/node` | catalog: |
| `tsx`         | catalog: |

---

## Installation

```bash
# 1. Install pnpm globally (if not already installed)
npm install -g pnpm

# 2. From the project root, install all workspace dependencies
pnpm install
```

> **Note:** This project uses `pnpm` workspaces. Do **not** use `npm install` or `yarn install` — the root `package.json` enforces pnpm via a preinstall hook.

---

## Environment Variables

The API server requires the following environment variables (create a `.env` file in `artifacts/api-server`):

| Variable          | Description                              |
|-------------------|------------------------------------------|
| `DATABASE_URL`    | PostgreSQL connection string             |
| `JWT_SECRET`      | Secret key for JSON Web Tokens           |
| `CLOUDINARY_URL`  | Cloudinary credentials for media uploads |
| `PORT`            | Server port (default: `3000`)            |
