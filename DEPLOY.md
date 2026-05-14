# Deploy to Vercel + Render + Supabase

## Step 1: Supabase Database (5 min)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project (free tier)
3. Wait for project setup (~2 minutes)
4. Go to **Database** → **Extensions** → Enable `uuid-ossp`
5. Go to **SQL Editor** → **New query**
6. Copy contents of `supabase-schema.sql` from this repo and run it
7. Go to **Project Settings** → **Database** → copy **Connection string** (URI format)

## Step 2: Backend on Render (5 min)

1. Go to [render.com](https://render.com) and sign up
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Name**: `finance-tracker-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Environment Variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (generate a long random string)
   - `DATABASE_URL` = (paste your Supabase connection string)
6. Click **Create Web Service**

## Step 3: Frontend on Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **Add New Project**
3. Import your GitHub repo
4. Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Environment Variables:
   - `VITE_API_URL` = `https://your-render-url.onrender.com/api`
6. Click **Deploy**

## Done!

- Frontend: `https://your-project.vercel.app`
- Backend API: `https://your-render-url.onrender.com/api`
- Database: Supabase (never sleeps, never resets)

## Important Notes

- Supabase free tier: 500MB storage, pauses after 7 days of inactivity (just visit to wake up)
- Render free tier: sleeps after 15 min of inactivity (first request takes ~30s to wake up)
- Vercel free tier: always fast, no sleep
- Your data is safe in Supabase even if Render or Vercel restart
