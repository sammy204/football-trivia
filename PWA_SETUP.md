# PWA Push Notifications Setup

## What's been set up

1. **manifest.json** - Makes your app installable on mobile
2. **service-worker.js** - Handles push notifications and offline support
3. **pushNotifications.js** - Manages push subscriptions using Firebase Cloud Messaging
4. **Service worker registration** - Automatically registered in `main.jsx`

## Next Steps: Enable Push Notifications

To complete the PWA setup, you need a backend to handle push subscriptions and send notifications at 12:00 UTC.

### Option 1: Firebase Cloud Functions (Recommended)

1. Generate Firebase Web Push credentials:
   ```bash
   npm install web-push -g
   web-push generate-vapid-keys
   ```

2. Add the public key to `.env`:
   ```
   VITE_VAPID_PUBLIC_KEY=<your_public_key>
   ```

3. Create a Firebase Cloud Function to:
   - Store push subscriptions
   - Send notifications at 12:00 UTC

4. Update `src/lib/pushNotifications.js` with your backend URL

### Option 2: Node.js/Express Backend

Create a backend server with:
- `POST /api/subscriptions` - Store push subscriptions
- Scheduled job to send push at 12:00 UTC

Example:
```javascript
// backend/routes/subscriptions.js
app.post('/api/subscriptions', async (req, res) => {
  const subscription = req.body
  // Save to database
  // Send push at 12:00 UTC using web-push library
})
```

## Current Flow

1. User clicks "Enable reminder"
2. Browser requests notification permission
3. Service worker subscribes to push notifications
4. Subscription is sent to your backend
5. Backend stores the subscription
6. At 12:00 UTC, backend sends push to all subscriptions
7. User sees notification even if app is closed

## Files to Update

- **src/lib/pushNotifications.js** - Update the API endpoint to your backend
- **src/App.jsx** - Optional: Add user profile tracking for subscriptions
- **.env** - Add your VAPID public key (optional for client-side only)

## Testing on Desktop

1. Open the app in Chrome/Firefox
2. Click "Enable reminder"
3. Verify the install prompt appears
4. Test push notifications using the Web Push library

## Testing on Mobile

1. Open on your phone
2. Click "Add to Home Screen" (or similar)
3. The app will be installed
4. Enable reminders - you'll receive background notifications

## Security Notes

- All push subscriptions should be stored securely
- Use HTTPS in production (required for service workers)
- Validate all subscriptions before storing
- Rate-limit your push API endpoint
