# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Google Login (localhost)

If Google sign-in shows `Error 400: redirect_uri_mismatch`, it means the Google OAuth client is not allowing the Supabase callback URL.

1) In Supabase Dashboard → Authentication → Providers → Google
- Ensure Google provider is enabled and you have a valid Client ID/Secret.
- Copy the required redirect URL (it follows this pattern):
	- `https://<project-ref>.supabase.co/auth/v1/callback`

For this project, `<project-ref>` comes from `VITE_SUPABASE_URL` in `.env`.

Current project ref (from `.env`):
- `odlukohernadrwygjlfs`

2) In Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs
- Add the Supabase callback URL to **Authorized redirect URIs**:
	- `https://<project-ref>.supabase.co/auth/v1/callback`
- Add your local URLs to **Authorized JavaScript origins** (typical):
	- `http://localhost:8080`
	- `http://127.0.0.1:8080`

3) In Supabase Dashboard → Authentication → URL Configuration
- Add local redirect URLs so Supabase accepts returning to your SPA:
	- `http://localhost:8080/auth/callback`
	- `http://127.0.0.1:8080/auth/callback`

Then restart `npm run dev` and try “Entrar com Google” again.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
