# youtube-music-ts-api notes

- Guest mode works for public playlists; no authentication or cookies required.
- Authenticated access needs a cookie string copied from music.youtube.com request headers; keep it in an env var (for example `YTMUSIC_COOKIE`) if we ever need it and never in the repo.
- For this project we will prefer guest mode and return null on failure; handle fallbacks gracefully when data is missing.
