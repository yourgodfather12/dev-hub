<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.local` and fill in:
   - `VITE_HF_API_KEY` – Hugging Face access token for the Inference API
   - `VITE_HF_API_URL` – optional, custom model URL (defaults to Llama 3.1 8B Instruct)
   - `VITE_API_EXPLORER_TOKEN` – shared secret used to call the API proxy
3. (Server) set `API_PROXY_TOKEN` (must match the frontend token) and optionally `API_PROXY_ALLOWLIST` (comma separated hostnames) before running `npm run dev` inside `server/`.
4. Run the app:
   `npm run dev`
