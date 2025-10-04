# 🚀 Netlify Setup Guide for builder-faredown

## Current Issue
Your GitHub repo `Pikateck/builder-faredown` is **NOT connected to Netlify**, so pushes don't trigger deployments.

## Solution: Connect Netlify to Your GitHub Repo

### Option 1: Via Netlify Dashboard (Easiest ⭐)

1. **Go to Netlify**: https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** as the Git provider
4. Select repository: **`Pikateck/builder-faredown`**
5. Configure build settings:
   ```
   Build command: npm run build:client
   Publish directory: dist/spa
   Branch to deploy: main
   ```
6. **Advanced settings** - Add environment variables:
   ```
   VITE_API_BASE_URL=https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev/api
   ```
7. Click **"Deploy site"**
8. ✅ Done! Every push to `main` will auto-deploy

### Option 2: Via Netlify CLI (From Your Computer)

```bash
# 1. Login to Netlify (opens browser)
netlify login

# 2. Initialize Netlify in this project
netlify init

# 3. Follow prompts:
#    - Create & configure a new site
#    - Choose: Pikateck/builder-faredown
#    - Build command: npm run build:client
#    - Deploy directory: dist/spa

# 4. Link complete! Now deploy:
netlify deploy --prod
```

### Option 3: Import Existing Site (If you already have one)

If you have an existing Netlify site (like VIBE_LANDING):

```bash
# Link to existing site
netlify link

# Choose the site from the list
# Then deploy
netlify deploy --prod
```

## After Setup

Once connected, every `git push` to `main` will automatically:
1. ✅ Trigger Netlify build
2. ✅ Run `npm run build:client`
3. ✅ Deploy to production
4. ✅ Your changes go live!

## Check Status

```bash
# Check current Netlify status
netlify status

# View site info
netlify sites:list

# Open site in browser
netlify open
```

## Troubleshooting

**Q: I don't see my site in Netlify dashboard**
- A: You need to create it first using Option 1 or 2 above

**Q: Changes aren't deploying**
- A: Check Netlify → Deploys tab to see build logs
- A: Ensure auto-publishing is ON in site settings

**Q: Build fails**
- A: Check build logs for errors
- A: Ensure all dependencies are in package.json
- A: Verify build command is correct

## Next Steps

1. ✅ Set up Netlify connection (choose Option 1 or 2)
2. ✅ Push code to GitHub
3. ✅ See automatic deployment!
