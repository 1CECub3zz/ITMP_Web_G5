# BrewTrack

This project now runs locally without Base44.

## Run locally

```bash
npm install
npm run dev
```

## Notes

- App data is stored in your browser `localStorage`.
- Images are stored as local data URLs in the browser.
- Registration uses a local demo verification code: `123456`.
- Password reset generates an in-app local reset link instead of sending email.

## Production reminder

This setup is great for local development and demos. If you want real multi-user hosting later, we should wire it to a normal backend or hosted database/auth service.
