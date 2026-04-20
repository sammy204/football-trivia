# PWA Push Notifications - Complete Setup Guide

## 📱 What You Now Have

Your app is now a PWA (Progressive Web App) with:
- ✅ Service worker for offline support
- ✅ Installable on mobile home screen
- ✅ Push notification capability
- ✅ Always-on countdown timer
- ✅ Daily challenge at 12:00 UTC with 30-min window

## 🚀 Setup Steps

### Step 1: Generate VAPID Keys

```bash
npm install -g web-push
web-push generate-vapid-keys
```

This will output:
```
Public Key: <PUBLIC_KEY>
Private Key: <PRIVATE_KEY>
```

Save these—you'll need them.

### Step 2: Update Frontend (.env)

Create `.env` in your project root:
```
VITE_VAPID_PUBLIC_KEY=<your_public_key>
```

This allows the frontend to subscribe to push notifications.

### Step 3: Deploy Backend Server

The backend handles:
- Storing push subscriptions
- Sending notifications at 12:00 UTC
- Managing subscription lifecycle

**Option A: Heroku (Easiest)**

1. Copy `backend-push-server.js` and files to a new folder
2. Create `package.json` (see `backend-package.json`)
3. Create `.env` with your VAPID keys
4. Deploy:
   ```bash
   heroku create your-app-name
   heroku config:set VAPID_PUBLIC_KEY=<key>
   heroku config:set VAPID_PRIVATE_KEY=<key>
   git push heroku main
   ```

**Option B: Railway.app (Recommended)**

1. Connect your repo to Railway
2. Add environment variables in Railway dashboard
3. Railway auto-detects `node` from package.json

**Option C: Render.com**

Similar to Railway—connect repo and add env vars.

### Step 4: Update Frontend Backend URL

Edit `src/lib/pushNotifications.js`:

```javascript
// Line ~34, update the fetch URL:
await fetch('https://YOUR_BACKEND_URL/api/subscriptions', {
  // ...
})
```

Replace `YOUR_BACKEND_URL` with:
- Heroku: `https://your-app-name.herokuapp.com`
- Railway: `https://your-railway-app.up.railway.app`
- Custom domain: `https://yourdomain.com`

### Step 5: Test the Setup

#### Desktop (Chrome/Firefox):
1. Open your app
2. Look for install prompt
3. Click "Enable reminder"
4. Check notifications settings

#### Mobile (iPhone/Android):
1. Open in mobile browser
2. Tap menu → "Add to Home Screen"
3. App installs with icon on home screen
4. Enable reminders when prompted

#### Test Push Manually:
```bash
curl -X POST https://YOUR_BACKEND_URL/api/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"This is a test notification"}'
```

## 🔧 How It Works

1. **User opts in** → Clicks "Enable reminder"
2. **Browser confirms** → Requests notification permission
3. **Service Worker subscribes** → Creates push subscription
4. **Send to backend** → Frontend sends subscription endpoint
5. **Backend stores** → Saves subscription to memory (or DB)
6. **At 12:00 UTC** → Cron job triggers
7. **Push sends** → Backend sends notification to all subscribers
8. **User sees notification** → Even if app is closed!
9. **User taps** → App opens with daily challenge ready

## 📝 Environment Variables Summary

### Frontend (.env)
```
VITE_VAPID_PUBLIC_KEY=...
```

### Backend (.env)
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=admin@footballtrivia.com
PORT=3001
```

## 🛡️ Security Considerations

- ✅ Use HTTPS in production (required for service workers)
- ✅ Validate subscriptions before storing
- ✅ Rate-limit your push API
- ✅ Never expose private VAPID key to frontend
- ✅ Implement user authentication for subscriptions (optional)

## 📡 Production Checklist

- [ ] VAPID keys generated and stored securely
- [ ] Frontend updated with public key
- [ ] Backend deployed to production
- [ ] Frontend pointing to production backend URL
- [ ] Service worker caching configured
- [ ] HTTPS enabled on all domains
- [ ] Push notifications tested end-to-end
- [ ] Monitoring/logging set up

## 🆘 Troubleshooting

### "Service Worker failed to register"
- Check browser console for errors
- Ensure HTTPS (or localhost)
- Verify `/service-worker.js` is accessible

### "Enable reminder button does nothing"
- Check console for errors
- Verify `VITE_VAPID_PUBLIC_KEY` is set
- Check backend URL is correct

### "Notifications not received"
- Check subscription count: `curl https://YOUR_BACKEND_URL/api/subscriptions/count`
- Check backend logs for errors
- Verify cron job is running (should log at 12:00 UTC)

### Backend not sending at 12:00 UTC
- Check server timezone is UTC
- Verify cron job logs
- Test manually: `curl -X POST .../api/notify`

## 📚 Resources

- [MDN: Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push npm](https://www.npmjs.com/package/web-push)
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)

## 🎉 Next Steps

1. Generate VAPID keys
2. Deploy backend
3. Update frontend .env
4. Update pushNotifications.js with backend URL
5. Test on mobile
6. Monitor push delivery

You're now set up for reliable push notifications! 🚀
