# UNO X Preview White Card

This update makes every /pixel/:id page use a clean generated X/Twitter preview image:

- White canvas
- Pixel image on the left
- Pixel number on the right
- Claimed count at bottom right
- 1200x630 card

Important:
- X caches previews. Test with a new pixel link.
- Vercel will install @vercel/og from package.json.
- After deployment, open /api/og/PIXEL_ID.png to test the preview image directly.
