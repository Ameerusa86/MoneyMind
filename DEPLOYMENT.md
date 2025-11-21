# Deployment Checklist

## Pre-Deployment Steps

### ✅ Security & Credentials

- [x] All credentials moved to `.env.local` (not committed)
- [x] `.env.example` created with template values
- [x] `.gitignore` includes `.env*` files
- [x] No hardcoded API keys, passwords, or secrets in source code
- [x] Test pages removed from production build

### ✅ Code Quality

- [x] TypeScript compilation successful
- [x] Build completes without errors (`npm run build`)
- [x] All async functions properly awaited
- [x] ESLint issues resolved

### ✅ Documentation

- [x] Professional README.md created
- [x] Installation instructions included
- [x] Deployment guide provided
- [x] Environment variables documented

## Vercel Deployment

### 1. Initial Setup

1. Push code to GitHub repository
2. Visit [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2. Environment Variables

Add the following in Vercel Project Settings → Environment Variables:

**Required:**

```env
MONGODB_URI=your_mongodb_connection_string
BETTER_AUTH_SECRET=your_generated_secret
BETTER_AUTH_URL=https://your-app.vercel.app
```

**Optional (OAuth):**

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 3. MongoDB Atlas Configuration

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to Network Access
3. Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
   - Or add specific Vercel IPs if you prefer stricter security
4. Ensure connection string includes:
   - Correct username and password
   - Database name: `finance-tracker`
   - Options: `?retryWrites=true&w=majority`

### 4. OAuth Provider Setup (Optional)

**Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Add Authorized redirect URI:
   - `https://your-app.vercel.app/api/auth/callback/google`

**GitHub OAuth:**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Update Authorization callback URL:
   - `https://your-app.vercel.app/api/auth/callback/github`

### 5. Deploy

1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Visit deployment URL to verify

### 6. Post-Deployment Verification

- [ ] App loads successfully
- [ ] Authentication works (email/password)
- [ ] OAuth providers work (if configured)
- [ ] Database connections successful
- [ ] All pages render correctly
- [ ] API routes respond properly

## Continuous Deployment

Every push to `master` branch will automatically trigger a new deployment on Vercel.

### Development Preview

- Feature branches automatically create preview deployments
- Test changes before merging to master
- Preview URLs are temporary and shareable

## Monitoring & Maintenance

### Vercel Analytics (Optional)

1. Enable in Project Settings → Analytics
2. Track page views, performance, and errors

### MongoDB Monitoring

1. Monitor database performance in Atlas dashboard
2. Set up alerts for connection issues
3. Review query performance regularly

### Regular Updates

- Keep dependencies updated: `npm update`
- Monitor security advisories: `npm audit`
- Review Vercel build logs for warnings

## Rollback Procedure

If deployment fails or issues arise:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Fix issues in development
5. Redeploy when ready

## Common Issues & Solutions

### Build Fails

- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Ensure TypeScript compiles locally: `npm run build`

### Database Connection Error

- Verify `MONGODB_URI` is correct in Vercel env vars
- Check MongoDB Atlas network access settings
- Ensure database user has correct permissions

### OAuth Not Working

- Verify redirect URIs match production URL
- Check client IDs and secrets are set in Vercel
- Ensure `BETTER_AUTH_URL` matches your domain

### Session/Auth Issues

- Regenerate `BETTER_AUTH_SECRET` if needed
- Clear browser cookies and try again
- Check that secret is at least 32 characters

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Better Auth](https://better-auth.com/docs)

---

**✅ Ready to Deploy!**

Your finance tracker is production-ready and secure. Follow the steps above to deploy to Vercel.
