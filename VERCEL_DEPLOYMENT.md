# Vercel Deployment Guide

## Steps to Deploy to Vercel

### Option 1: Deploy via Vercel Web Interface (Recommended - Easiest)

1. **Push to GitHub**

   ```bash
   git add -A
   git commit -m "Prepare for Vercel deployment"
   git push origin bill-v1
   ```

2. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click "Add New..." → "Project"
   - Import the GitHub repository: `expo-sample-app`

3. **Configure Project Settings**
   - **Framework Preset**: Node.js
   - **Root Directory**: `./` (leave default)
   - **Build Command**: Leave empty (Vercel auto-detects)
   - **Output Directory**: `public`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add these variables:
     ```
     EXPO_PUBLIC_GOOGLE_API_KEY=AIzaSyCI8acGqx7YK-ou16lPvkvx0Gfudi96_pg
     EXPO_PUBLIC_GOOGLE_SHEETS_ID=1QKTL_5g5Y3XsUsq2GDyyHdSDAszuMaZVlIkkxg7mDCU
     EXPO_PUBLIC_DESCOPE_PROJECT_ID=your_descope_project_id
     NODE_ENV=production
     ```

5. **Click "Deploy"**
   - Vercel will build and deploy automatically
   - Once done, you'll get a URL like: `https://your-project.vercel.app`

---

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed)

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   vercel --prod
   ```

4. **Answer the prompts**
   - Set project name: `ma-org-billings-system` (or your choice)
   - Confirm settings when prompted

---

## Fixing Common Deployment Errors

### Error: "Cannot find module 'server-static.js'"

**Solution**: Make sure `server-static.js` is in the root directory

```bash
ls -la server-static.js  # Check if file exists
```

### Error: "Module not found: 'dotenv'"

**Solution**: Install dependencies

```bash
npm install dotenv
```

### Error: "CORS Policy Error"

**Solution**: Already configured in `server-static.js`. If still getting errors:

- Check browser console for actual error message
- Ensure API endpoints are properly configured

### Error: "Cannot GET /"

**Solution**: The `public/index.html` file is missing or not being served

- Verify `public/index.html` exists
- Check `vercel.json` routes configuration

### Error: "Google Sheets API returns 403"

**Solution**: The API key might not have access to the spreadsheet

1. Go to Google Cloud Console
2. Ensure Google Sheets API is enabled
3. Check spreadsheet sharing settings
4. Try sharing the spreadsheet with "Anyone with the link can view"

---

## Verify Deployment

After deployment, test these URLs:

1. **Home Page**

   ```
   https://your-project.vercel.app/
   ```

2. **Health Check**

   ```
   https://your-project.vercel.app/api/health
   ```

3. **Info Endpoint**
   ```
   https://your-project.vercel.app/api/info
   ```

Expected responses:

- Health: `{ "status": "ok", "timestamp": "..." }`
- Info: `{ "environment": "production", "platform": "vercel", ... }`

---

## Environment Variables Needed

Add these to Vercel project settings:

```
EXPO_PUBLIC_GOOGLE_API_KEY = AIzaSyCI8acGqx7YK-ou16lPvkvx0Gfudi96_pg
EXPO_PUBLIC_GOOGLE_SHEETS_ID = 1QKTL_5g5Y3XsUsq2GDyyHdSDAszuMaZVlIkkxg7mDCU
EXPO_PUBLIC_DESCOPE_PROJECT_ID = (your Descope project ID)
NODE_ENV = production
```

---

## Monitoring & Logs

After deployment:

1. Go to your Vercel project dashboard
2. Click "Deployments" tab
3. Click the latest deployment
4. View "Logs" for any errors
5. Check "Functions" tab for API endpoint logs

---

## Rollback (If Something Goes Wrong)

1. Go to Vercel Dashboard
2. Click your project
3. Go to "Deployments"
4. Find the previous working deployment
5. Click the "..." menu → "Promote to Production"

---

## Performance Tips

1. **Enable Caching**
   - Already configured in `server-static.js` with `maxAge: '1d'`

2. **Optimize Images**
   - Use PNG format (already done for invoices)
   - Keep file sizes small

3. **Database (Optional Future)**
   - Use Vercel Postgres for data persistence
   - Currently using Google Sheets (read-only)

---

## Support & Troubleshooting

- **Vercel Docs**: https://vercel.com/docs
- **Check Project URL**: https://your-project.vercel.app
- **View Logs**: Dashboard → Deployments → Click deployment → Logs
- **Redeploy**: Click "Redeploy" button on any past deployment

---

## Next Steps After Deployment

1. Test login with credentials: `Admin / galaxy@2026`
2. Verify Google Sheets data loads
3. Test bill download functionality (should download as PNG)
4. Share the URL with your team
