# Second Thought Web App

A simple timetable/schedule web application built with Next.js and Tailwind CSS.

## Deployment to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Click Deploy - that's it!

Or deploy directly:
```bash
npm install -g vercel
vercel
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Configuration

Edit `lib/api.ts` to change:

1. **Backend URL** (line 4):
```typescript
const BASE_URL = 'https://your-backend-url.com/api';
```

2. **Dev Bypass** (line 8) - Set to `false` for production:
```typescript
export const DEV_BYPASS_LOGIN = false;
```

## API Endpoints Expected

- `POST /auth/login` → `{accessToken, refreshToken}`
- `POST /auth/signup` → `{accessToken, refreshToken}`
- `PUT /user/settings` → `{success, message}`
- `POST /schedule/save` → `{success, message}`

## Features

- Login / Signup
- Task scheduling with custom time blocks
- Auto-generates next time block based on duration setting
- Downloads schedule as JSON file
- Settings for notifications and default duration
- Mobile-responsive design
- Works offline (saves to localStorage)
