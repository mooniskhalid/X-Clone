# X Clone

A full-stack Twitter/X clone built with Next.js 16, React 19, and PostgreSQL. Supports posts, reposts, quote reposts, comments, likes, follows, notifications, image uploads, and real-time search — all with a responsive mobile-first design.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)

---

## Features

- **Authentication** — GitHub OAuth via NextAuth v4, database sessions
- **Posts** — Create, edit, delete posts with optional image uploads (base64)
- **Reposts & Quotes** — Repost any post, or quote it with your own comment
- **Comments** — Reply to posts with a full comment thread
- **Likes** — Like/unlike posts with optimistic UI updates
- **Follows** — Follow/unfollow users, dedicated following feed
- **Notifications** — Real-time badge for likes, follows, and replies
- **Explore** — Full-text search across posts and users
- **Profiles** — Posts, Likes, Media, Highlights, Articles tabs
- **Responsive** — Desktop sidebar navigation + mobile bottom bar

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | NextAuth v4 + GitHub provider |
| Data fetching | TanStack React Query v5 |
| HTTP client | Axios |
| Icons | React Icons |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- A GitHub OAuth App ([create one here](https://github.com/settings/developers))

### Installation

```bash
git clone https://github.com/mooniskhalid/x-clone.git
cd x-clone
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://..."

GITHUB_ID="your_github_client_id"
GITHUB_SECRET="your_github_client_secret"

NEXTAUTH_SECRET="any_random_string"
NEXTAUTH_URL="http://localhost:3000"
```

### Database Setup

```bash
npx prisma migrate dev
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── api/              # REST API routes (Next.js Route Handlers)
│   │   ├── auth/         # NextAuth
│   │   ├── create-post/
│   │   ├── get-posts/    # Feed with cursor-based pagination
│   │   ├── repost/
│   │   ├── quote-post/
│   │   ├── like-post/
│   │   ├── comment-post/
│   │   ├── follow-user/
│   │   ├── search/
│   │   ├── get-notifications/
│   │   └── ...
│   └── app/              # UI pages
│       ├── page.tsx      # Home feed (For You / Following)
│       ├── explore/      # Search
│       ├── follows/      # Following feed
│       ├── notifications/
│       ├── post/[postId]/
│       └── profile/[userId]/
├── components/
│   ├── Post.tsx          # PostCard + all post interactions
│   ├── Navigation.tsx    # Desktop sidebar + mobile bottom bar
│   ├── CreatePostModal.tsx
│   ├── ReplyModal.tsx
│   ├── QuoteModal.tsx
│   ├── EditProfileModal.tsx
│   ├── SearchBar.tsx
│   └── RightSidebar.tsx  # Who to Follow + Trending
├── lib/
│   ├── prisma.ts         # Prisma singleton with PrismaPg adapter
│   └── axios.ts          # Typed API client
└── generated/
    └── prisma/           # Generated Prisma client
```

---

## Deployment

This project is deployed on **Vercel** with a **Neon** PostgreSQL database.

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add the environment variables from `.env`
4. Deploy

Vercel auto-detects Next.js — no extra configuration needed.

---

## Database Schema

Core models: `User`, `Post`, `Comment`, `Like`, `Repost`, `Follow`, `Notification`

Posts support self-referential quote reposts via `quotedPostId`. The feed uses timestamp-based cursor pagination to correctly merge original posts and reposts in chronological order.

---

## License

MIT
