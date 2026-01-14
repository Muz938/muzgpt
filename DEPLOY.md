# 🚀 MUZGPT Deployment Guide

Your MUZGPT application is ready for production!

## 1. Stack Overview
- **Frontend:** React + Vite (hosted on Netlify CDN)
- **Backend:** Node.js Express (hosted on Netlify Functions)
- **Database:** JSON File (Ephemeral on Netlify / Persistent Locally)
- **Auth:** Custom Email + Google OAuth
- **Payments:** Stripe

## 2. Deploy to Netlify
1. Log in to [Netlify](https://app.netlify.com).
2. Click **"Add new site"** -> **"Import from existing project"**.
3. Select **GitHub** and choose the `muzgpt` repository.
4. **Build Settings** (detected automatically):
   - Command: `npm run build`
   - Publish directory: `dist`
5. **Environment Variables** (Click "Add environment variables"):
   - `VITE_GEMINI_API_KEY`: [Your Key]
   - `STRIPE_SECRET_KEY`: [Your Key]
   - `RESEND_API_KEY`: [Your Key]
   - `VITE_GOOGLE_CLIENT_ID`: [Your Key]
   - `NETLIFY`: `true`
6. Click **Deploy**.

## 3. Post-Deployment
- Once deployed, copy your site URL (e.g., `https://muzgpt-app.netlify.app`).
- Update your **Google Cloud Console**:
  - Add the new Netlify URL to **Authorized JavaScript origins**.
  - Add `https://your-site.netlify.app` to **Authorized redirect URIs**.
- Update the `DOMAIN` variable in Netlify to your new URL.

## 4. Notes
- **Data Persistence:** On Netlify, the user database is **ephemeral** (reset on redeploy). For permanent data, connect a MongoDB/Supabase database.
- **Local Dev:** Run `npm run dev` and `npx tsx server/server.ts` to run locally (data is persistent).

Enjoy your AI empire! 🧠
