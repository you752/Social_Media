# Connect — Social Media Frontend

A production-style React + TypeScript frontend for your social media backend, built with Vite, React Router, Axios, Socket.IO, and the Context API for auth/notification state.

## Setup

```bash
npm install
cp .env.example .env   # then edit with your real backend URL(s)
npm run dev
```

`.env`:
```
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

## What's implemented

Every endpoint in the spec you gave me, wired end-to-end: login, signup (multipart, single `username` field), account verification with resend + cooldown, logout, profile view/update, users discovery, full post CRUD with images, comments CRUD, the friend request/accept/reject/block flow, real-time friend notifications, and a real-time chat with Socket.IO, read receipts, and unread counts.

Layout: sidebar + navbar on desktop, bottom nav on mobile, toasts, confirm dialogs, skeleton loading, empty states, dark/light mode (follows system, no toggle wired up — easy to add).

## Assumptions I had to make (isolated so you can fix them fast)

The spec left a few backend details unstated. I made a reasonable choice for each and kept it in exactly one place:

1. **Response envelope** — `src/types/api.ts` (`unwrap()`). Assumes `{ message, data }`; falls back to the raw body if there's no `data` key.
2. **Login token field** — `src/context/AuthContext.tsx`, `login()`. Assumes the login response has `token` or `accessToken`. Adjust the destructure there if it's named differently.
3. **Socket auth handshake** — `src/services/socket.ts`. Assumes `io(url, { auth: { token } })`. If your backend expects the token in a header or query string instead, this is the only place to change.
4. **Real-time message event name** — `src/pages/chat/ChatPage.tsx`. Assumes the backend emits an event literally named `"message"` with the message object as payload (matching `realtimeModule.deliverMessage`). Change the `useSocketEvent("message", ...)` call if the actual event name differs.
5. **Accept/reject friend request body** — `src/api/friend.api.ts`. Assumes `{ requestId }`. The spec didn't give the exact field name for these two endpoints — check your `acceptFriendRequestValidation`/`rejectFriendRequestValidation` and adjust here.
6. **Conversation list source** — `src/components/chat/ConversationList.tsx`. No "list all conversations" endpoint was given, so the chat sidebar is built from your friends list. Swap this out if you add a dedicated endpoint later.
7. **Friendship status field on a user** — `src/types/user.ts` (`friendshipStatus`). The Users/Discover page reads this to decide whether to show "Add friend" / "Pending" / "Friends". If `GET /` doesn't return this, the UI will just always show "Add friend" — harmless, but worth wiring up once the backend supports it.

None of these required inventing business logic beyond what the spec described — they're just naming/shape guesses, isolated to one file/function each.

## Folder structure

```
src/
├── api/          Axios calls, one file per resource, matching your endpoints exactly
├── components/   Reusable UI, grouped by feature
├── context/      Auth, Toast, Notification providers
├── hooks/        useAuth, useSocket, useToast, useDebounce
├── pages/        Route-level screens
├── routes/       AppRoutes + ProtectedRoute/PublicOnlyRoute
├── services/     socket.ts (single shared Socket.IO connection)
├── types/        TypeScript interfaces per resource
└── utils/        Token storage, date formatting, user-display helpers
```

## Verified

`npm run build` (tsc + vite build) completes with no type errors and no build errors.
