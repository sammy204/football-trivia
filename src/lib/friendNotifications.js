export async function sendFriendRequestPushNotification({
  toUserId,
  fromName,
}) {
  if (!toUserId || !fromName) return

  const backendUrl = import.meta.env.VITE_PUSH_BACKEND_URL
  if (!backendUrl) return

  const endpoint = `${backendUrl.replace(/\/$/, '')}/api/notify/friend-request`
  await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      toUserId,
      fromName,
    }),
  })
}
