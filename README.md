# RepDIR — Replica Fashion Seller Directory

RepDIR is a modern, open-source replica fashion seller directory and live aggregator. It is specifically designed to catalog, verify, and rate replica fashion sellers and agents by monitoring community-driven replica subreddits, extracting vendor mentions via tracking codes (e.g., `TRK-XXXXX`), and aggregating them into a searchable web interface with user reviews, ratings, and upvote/downvote metrics.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![Sylvia API](https://img.shields.io/badge/Powered%20By-Sylvia%20API-blue)](https://sylvia-api.com)

---

## 🚀 How It Works & The Sylvia API Ingestion

RepDIR relies on continuous background scanning of popular replica fashion subreddits (such as `r/FashionReps`, `r/DesignerReps`, `r/QualityReps`, and `r/sneakers`) to find seller mentions, price estimates, and product images.

Rather than running heavy, fragile scraping scripts or navigating complex OAuth limitations with the standard Reddit API, RepDIR's ingestion engine is powered by **[sylvia-api.com](https://sylvia-api.com)**.

```
                           ┌────────────────────────┐
                           │   Sylvia Reddit API    │
                           └───────────┬────────────┘
                                       │ (Clean, structured JSON)
                                       ▼
 ┌───────────────┐        ┌────────────────────────┐
 │ Reddit Posts  ├───────>│ Deno Ingestion Worker  │
 └───────────────┘        └───────────┬────────────┘
                                       │ (Parses TRK- codes & prices)
                                       ▼
                          ┌────────────────────────┐        ┌───────────────┐
                          │   Supabase Postgres    ├───────>│ Next.js App   │
                          └────────────────────────┘        └───────────────┘
```

**Why Sylvia API?**
- **Structured Data**: Returns clean, pre-parsed JSON payloads optimized for item/post mapping.
- **Speed & Stability**: High-performance endpoints that ensure background syncs run without rate-limiting issues.
- **Ease of Integration**: Eliminates the boilerplate required to parse media metadata, galleries, and pricing contexts.

Interested in building replica directories, seller trackers, or search engines? Check out **[sylvia-api.com](https://sylvia-api.com)** for reliable, structured Reddit data streams.

---

## ✨ Features

- **Live Aggregated Feed**: Real-time listing of post mentions monitored by the Deno polling worker.
- **Searchable Seller Directory**: Full-text fuzzy search (via Postgres `pg_trgm`) over sellers, categories, and descriptions.
- **Interactive Ratings & Reviews**: User accounts can submit verified star ratings and reviews for listed replica sellers.
- **Voting Mechanism**: Dynamic upvote/downvote scoring to rank seller popularity.
- **Replica Seller Dashboard**: Sign-up flow generating unique tracking codes (`TRK-XXXXX`) so replica sellers can easily track post mentions and upvote scores.
- **Admin Management**: Secure administration view to verify sellers, feature listings, and toggle ingestion filters.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16.2 (App Router, static HTML export), React 19, Tailwind CSS v4, PostCSS.
- **Backend / Database**: Supabase (PostgreSQL, Row Level Security, generated TsVectors).
- **Ingestion Worker**: Deno (hosted on Supabase Edge Functions).

---

## 💻 Getting Started (Frontend)

### 1. Clone the repository
```bash
git clone https://github.com/c1nn3r/repdir.git
cd repdir
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase public anonymous API key |
| `NEXT_PUBLIC_ADMIN_SECRET` | A secret token used to access the `/admin/` panel |

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build static export
To compile the application into static HTML assets (outputs to `/out`):
```bash
npm run build
```

---

## ⚡ Database & Ingestion Setup (High-Level)

RepDIR relies on a Supabase backend. Follow these steps to initialize:

1. **Database Schema**: Apply the SQL migration scripts located under `backend/supabase/migrations/` to initialize tables (`vendors`, `posts`, `reviews`, `votes`, `subreddits_config`, `settings`, `admin_users`), RLS policies, and rankings views.
2. **Ingestion Function**: Deploy the Deno script located in `supabase/functions/sylvia-poll/` as a Supabase Edge Function (or run it locally via `supabase functions serve`).
3. **Environment Setup for Poller**: Ensure the Deno runtime has access to the following environment variables:
   - `SYLVIA_API_KEY`: Your API key for authorization with the Sylvia API.
   - `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Used to bypass RLS for write-heavy background updates.
   - `ADMIN_SECRET` & `CRON_SECRET`: Access codes for scheduling triggers.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
