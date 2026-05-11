# 🚀 LogicLens: Split-Platform Deployment Guide ($0/mo)

Follow this guide to launch LogicLens for free using the "Split Platform" strategy.

## 1. 🗄️ Database (Supabase)
*   **Sign up**: [Supabase.com](https://supabase.com/)
*   **Create Project**: Name it `logiclens-db`.
*   **Get Connection String**:
    *   Go to **Project Settings > Database**.
    *   Find **Connection string** and select **URI**.
    *   Use the **Transaction Pooler** (port 6543).
    *   **Keep this URL** for the next step.

## 2. 📡 Backend (Render)
*   **Sign up**: [Render.com](https://render.com/)
*   **Create Web Service**:
    *   Connect your GitHub repo.
    *   **Root Directory**: `backend`
    *   **Build Command**: `pnpm install && pnpm run build`
    *   **Start Command**: `pnpm run start`
*   **Environment Variables**:
    *   `DATABASE_URL`: (Your Supabase URI)
    *   `JWT_SECRET`: (Random string, e.g., `logic_lens_super_secret_99`)
    *   `SESSION_SECRET`: (Random string, e.g., `session_lens_123`)
    *   `STRIPE_SECRET_KEY`: (From Stripe Dashboard)
    *   `STRIPE_WEBHOOK_SECRET`: (From Stripe Dashboard after setting up webhook)
    *   `FRONTEND_URL`: (You will get this from Vercel in step 3)
    *   `BACKEND_URL`: (Render will give you this once deployed, e.g., `https://logiclens-api.onrender.com`)

## 3. 🌐 Frontend (Vercel)
*   **Sign up**: [Vercel.com](https://vercel.com/)
*   **Import Project**:
    *   Select your GitHub repo.
    *   **Root Directory**: `frontend`
    *   **Framework Preset**: `Vite`
*   **Environment Variables**:
    *   `VITE_API_URL`: (The URL of your Render backend)

## 🗄️ Final Step: Database Push
Once your Render backend is "Live", you need to create the tables.
1.  In your local terminal (on your computer), ensure you are logged into your Supabase DB via the `DATABASE_URL` in your `.env`.
2.  Run:
    ```bash
    pnpm --filter "@workspace/db" run push
    ```
    *Alternatively, use the Render "Shell" tab to run this command.*

---

### 🛡️ Production Security Checklist:
*   [ ] Stripe Webhook points to `https://your-backend.onrender.com/api/payments/webhook`
*   [ ] Google OAuth callback points to `https://your-backend.onrender.com/api/auth/google/callback`
*   [ ] `FRONTEND_URL` in Render matches your Vercel URL exactly.

**Congratulations! Your SaaS is now live.**
