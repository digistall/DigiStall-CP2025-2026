# DigitalOcean App Platform Deployment Guide

## Overview
This guide explains how to deploy DigiStall to DigitalOcean App Platform with:
- **Backend API**: Node.js/Express service
- **Frontend**: Vue.js static site
- **Database**: DigitalOcean Managed MySQL (your existing database)

## Prerequisites
1. DigitalOcean account
2. GitHub repository with your code
3. Existing DigitalOcean Managed Database (or create one)

---

## Option 1: Deploy via DigitalOcean Console (Recommended)

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Add DigitalOcean deployment configuration"
git push origin FullBranch
```

### Step 2: Create App in DigitalOcean
1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Select **GitHub** as source
4. Authorize DigitalOcean to access your repository
5. Select your `DigiStall-CP2025-2026` repository
6. Select branch: `FullBranch`

### Step 3: Configure Backend Service
1. Click **"Add Resource"** → **"Service"**
2. Configure:
   - **Name**: `digistall-api`
   - **Source Directory**: `/Backend/Backend-Web`
   - **Build Command**: `npm install`
   - **Run Command**: `node server.js`
   - **HTTP Port**: `3001`
   - **HTTP Route**: `/api`
   - **Instance Size**: Basic ($5/mo) or Professional

3. Add Environment Variables:
   | Key | Value | Type |
   |-----|-------|------|
   | NODE_ENV | production | Plain |
   | WEB_PORT | 3001 | Plain |
   | DB_HOST | dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com | Plain |
   | DB_PORT | 25060 | Plain |
   | DB_USER | doadmin | Plain |
   | DB_PASSWORD | (your password) | **Secret** |
   | DB_NAME | naga_stall | Plain |
   | DB_SSL | true | Plain |
   | JWT_SECRET | (generate secure key) | **Secret** |
   | JWT_REFRESH_SECRET | (generate secure key) | **Secret** |

### Step 4: Configure Frontend Static Site
1. Click **"Add Resource"** → **"Static Site"**
2. Configure:
   - **Name**: `digistall-web`
   - **Source Directory**: `/Frontend/Web`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **HTTP Route**: `/`
   - **Index Document**: `index.html`
   - **Error Document**: `index.html` (for SPA routing)

3. Add Build-time Environment Variable:
   | Key | Value |
   |-----|-------|
   | VITE_API_URL | ${APP_URL}/api |

### Step 5: Review and Deploy
1. Review your configuration
2. Choose your plan (Basic ~$12/mo total)
3. Click **"Create Resources"**
4. Wait for deployment (5-10 minutes)

---

## Option 2: Deploy via App Spec YAML

### Step 1: Update the App Spec
Edit `.do/app-existing-db.yaml`:
1. Replace `your-github-username` with your actual GitHub username
2. Replace `REPLACE_WITH_YOUR_DB_PASSWORD` with your database password
3. Replace JWT secrets with secure random strings

### Step 2: Deploy using doctl CLI
```bash
# Install doctl
choco install doctl

# Authenticate
doctl auth init

# Create app from spec
doctl apps create --spec .do/app-existing-db.yaml
```

---

## Connecting to Your Existing Database

Your database is already configured:
- **Host**: `dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com`
- **Port**: `25060`
- **Database**: `naga_stall`
- **SSL**: Required (enabled in code)

### Trusted Sources Setup
1. Go to your DigitalOcean database dashboard
2. Navigate to **"Trusted Sources"** or **"Settings"**
3. Add your App Platform app as a trusted source
4. This allows the app to connect without exposing the database publicly

---

## Post-Deployment

### Verify Deployment
1. Visit your app URL: `https://your-app.ondigitalocean.app`
2. Test API health: `https://your-app.ondigitalocean.app/api/health`
3. Try logging in to verify database connection

### Custom Domain (Optional)
1. Go to App Settings → Domains
2. Add your domain (e.g., `digistall.com`)
3. Configure DNS with provided records
4. SSL is automatic

### Monitoring
- View logs in DigitalOcean Apps console
- Set up alerts for deployment failures
- Monitor database metrics in Managed Database dashboard

---

## Cost Estimate

| Component | Plan | Monthly Cost |
|-----------|------|--------------|
| Backend Service | Basic (1 vCPU, 0.5GB) | $5 |
| Static Site | Free tier | $0 |
| Managed Database | Basic (1GB) | $15 |
| **Total** | | **~$20/month** |

---

## Troubleshooting

### Build Fails
- Check build logs in App console
- Ensure `package.json` has correct dependencies
- Verify Node.js version compatibility

### Database Connection Error
- Verify database credentials
- Check Trusted Sources includes your app
- Ensure `DB_SSL=true` is set

### API Returns 502/503
- Check backend logs
- Verify environment variables are set
- Ensure port 3001 matches configuration

### Frontend Shows Blank
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Check that build output exists in `dist/`
