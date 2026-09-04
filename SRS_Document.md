# Software Requirement Specification (SRS)
## Project Name: SocialSphere
**Date:** May 2026  
**Version:** 1.0 (Final)

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to present a detailed description of the SocialSphere web application. It will explain the purpose and features of the system, the interfaces of the system, what the system will do, the constraints under which it must operate, and how the system will react to external stimuli.

### 1.2 Document Conventions
This document follows standard IEEE SRS formatting. The terminology used aligns with modern web development standards (e.g., RESTful APIs, WebSockets, SPA).

### 1.3 Intended Audience
This document is intended for project evaluators, software developers, quality assurance testers, and academic examiners who require a deep understanding of the system's architecture and capabilities.

### 1.4 Project Scope
SocialSphere is a full-stack, real-time social networking application. It allows users to register, create profiles, share text and media posts, interact with others through likes and comments, and follow other users. The system leverages a monorepo architecture and provides real-time notifications and updates using WebSocket technology, ensuring a highly interactive user experience.

---

## 2. Overall Description

### 2.1 Product Perspective
SocialSphere is a self-contained, monolithic web application deployed via a modern Node.js ecosystem. It uses a clear separation of concerns with a React-based frontend, an Express-based RESTful API backend, and an SQLite database managed via Drizzle ORM.

### 2.2 Product Functions
- **User Management:** Registration, secure login, logout, and profile management.
- **Social Graph:** Ability to follow and unfollow other users.
- **Content Creation:** Creating posts with adjustable visibility settings.
- **Interactions:** Liking posts and commenting on posts.
- **Real-time Engine:** Receiving instant notifications for interactions and instant feed updates.

### 2.3 User Classes and Characteristics
- **Guest / Unregistered User:** Can only view the login and registration screens. Cannot access feeds or user profiles.
- **Authenticated User:** Can view the home feed, explore public posts, create content, manage their profile, and interact with other users.

### 2.4 Operating Environment
- **Client-Side:** Any modern web browser (Chrome, Firefox, Safari, Edge) with JavaScript enabled. Responsive design ensures compatibility with desktop, tablet, and mobile displays.
- **Server-Side:** Node.js environment (v18+) running on Windows, Linux, or macOS.
- **Database:** SQLite (local file-based relational database).

### 2.5 Design and Implementation Constraints
- The system must be developed within a pnpm monorepo architecture.
- Real-time features depend heavily on an active and stable WebSocket connection.
- Passwords must never be stored in plain text.

---

## 3. System Features (Functional Requirements)

### 3.1 User Authentication and Authorization
- **FR 1.1:** The system shall allow a user to register by providing an email, username, and password.
- **FR 1.2:** The system shall hash passwords using `bcrypt` before storing them in the database.
- **FR 1.3:** The system shall authenticate users and issue a JSON Web Token (JWT) upon successful login.
- **FR 1.4:** The system shall restrict access to the Home Feed and Profile pages to authenticated users only.

### 3.2 Content Feed and Post Creation
- **FR 2.1:** The system shall allow an authenticated user to create a text post.
- **FR 2.2:** The system shall display a personalized "Home Feed" containing posts from the user and the accounts they follow.
- **FR 2.3:** The system shall support infinite scrolling (pagination) to load older posts continuously.
- **FR 2.4:** The system shall provide an "Explore" feed to discover public posts from users they do not follow.

### 3.3 Social Interactions
- **FR 3.1:** The system shall allow users to "Like" or "Unlike" a post or comment.
- **FR 3.2:** The system shall allow users to reply to posts by adding a "Comment".
- **FR 3.3:** The system shall allow users to follow other accounts, adding the followed account's content to their Home Feed.

### 3.4 Real-Time Notifications
- **FR 4.1:** The system shall establish a WebSocket (`Socket.io`) connection for authenticated users.
- **FR 4.2:** The system shall push a real-time notification to a user when someone likes their post or comments on their post.
- **FR 4.3:** The system shall update the feed dynamically without requiring a page refresh when a new post is created by a followed user.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- The frontend UI is designed using **Tailwind CSS** and **shadcn/ui**.
- The application provides a persistent navigation sidebar (or bottom bar on mobile).
- Alerts and toasts will be used to notify the user of successful actions or errors (e.g., "Post created successfully").

### 4.2 Software Interfaces
- **Database Interface:** The application communicates with the SQLite database via Drizzle ORM.
- **API Interface:** The frontend communicates with the backend via a RESTful API defined by an OpenAPI specification. Validation is enforced on both ends using Zod schemas.

### 4.3 Communication Interfaces
- **HTTP/HTTPS:** Standard REST API requests for fetching data and submitting forms.
- **WebSockets (WS/WSS):** Persistent bidirectional communication channel for real-time events.

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
- The application shall load the initial Home Feed within 2 seconds under normal network conditions.
- API response times for standard queries (e.g., liking a post) should be under 200 milliseconds.

### 5.2 Security Requirements
- All API endpoints except `/login` and `/register` must require a valid JWT token in the Authorization header.
- The system must prevent SQL Injection attacks by utilizing Drizzle ORM's parameterized queries.
- The system must prevent Cross-Site Scripting (XSS) by using React's built-in DOM escaping mechanisms.
- API endpoints shall implement Rate Limiting to prevent Denial of Service (DoS) and brute-force attacks.

### 5.3 Software Quality Attributes
- **Maintainability:** The use of a monorepo, strict TypeScript typing, and Contract-Driven Development ensures high maintainability.
- **Reliability:** Auto-generated API clients (TanStack Query) ensure that frontend data fetching is perfectly synchronized with backend responses.
- **Scalability:** The stateless nature of the JWT authentication allows the Express backend to be horizontally scaled if migrated to a larger database like PostgreSQL in the future.

---

## 6. Technology Stack Summary

| Layer | Technology Used |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite |
| **Styling & UI** | Tailwind CSS v4, shadcn/ui, Framer Motion |
| **Routing & State** | Wouter, TanStack React Query v5 |
| **Backend Framework** | Node.js, Express.js v5 |
| **Real-time Engine** | Socket.io |
| **Database** | SQLite, Drizzle ORM |
| **Validation & Types** | Zod, OpenAPI (Orval) |
| **Security** | JWT, bcryptjs, Helmet |
