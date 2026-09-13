# Project: Practice Inventory App

## What this is
A basic, practice-only web-based inventory system. Not for production/serious use — this is a learning project. It should track items with fields like name, type, and date/time stored (exact field list still to be finalized as we build).

## Who uses it
A small handful of people (a small team), each with their own login. Needs to be accessible from anywhere (hosted online), not just run locally.

## Tech stack (decided)
- **Frontend:** React, written in TypeScript
- **Backend:** Node.js + Express, written in TypeScript (custom REST API — intentionally NOT skipping this layer, see "How I want to work" below)
- **Database:** PostgreSQL, hosted by Supabase
- **ORM:** Prisma (backend talks to Postgres through Prisma rather than raw SQL)
- **Auth:** Supabase Auth handles account creation/login and issues tokens; the Express backend verifies those tokens on incoming requests rather than rolling custom password/token logic
- **Hosting:** Render — a Static Site for the built React app, and a Web Service for the Express backend. Supabase hosts the database itself (Render does not manage the DB).

## Key architecture decisions already made (don't re-litigate these)
- Considered MySQL, switched to Postgres because Render only manages Postgres natively.
- Considered dropping the custom backend and having React talk straight to Supabase. Decided against it — keeping the Express API layer on purpose so the 3-tier pattern (frontend → backend → database) gets learned properly. Supabase is being used to avoid hand-rolling a database server and a login system, not to avoid the backend.
- Row Level Security (Postgres-level access rules) is a "harden it later" step, not a day-one requirement — Express is the primary gatekeeper for now.

## Rough build order
1. Set up tools: Node, a code editor, a free Supabase account, a free Render account
2. Create the Supabase project; design the database schema (items table, plus Supabase's built-in users)
3. Scaffold the backend (Node/Express/TypeScript); connect it to Supabase Postgres via Prisma
4. Build core API routes for items (create/read/update/delete), protected by checking Supabase auth tokens
5. Scaffold the React frontend; wire up Supabase login (sign up / log in / log out)
6. Build the inventory UI and connect it to the Express API
7. Push to GitHub, deploy frontend + backend on Render, point them at Supabase

## How I want to work (important)
- I'm an experienced programmer (Java, C#, Unity/game dev background) but this is my first time doing web/app development. Don't re-explain general programming fundamentals (loops, functions, etc.) — I know those.
- DO explain web/app-specific concepts from first principles as we hit them (e.g., what an API is, what a migration is, what a token is) — I'm new to this side of things.
- Teach and explain concepts WHILE building, step by step — don't just generate the whole app's code wholesale without walking me through it. I want to actually understand and learn this, not just end up with working code I didn't build.
