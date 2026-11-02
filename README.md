# SecureView CCTV

## Hero frame assets

The hero uses pre-baked WebP sequences in `public/frames/m`, `public/frames/t`, and
`public/frames/d`. To regenerate them, place the 240 source JPEGs in the ignored
`source_frames/` directory, install Pillow in the active Python environment, and run:

```powershell
python scripts\bake-hero-frames.py
```

The script skips duplicate frames and expects to produce exactly 192 images in each set.

Run `npm run qa` after `npm run build` to test the 14 responsive viewport sizes. Playwright
screenshots and the JSON results are written to the ignored `.qa-results/` directory.

## Static asset caching

The deployment host is not configured in this repository. Configure the host to send
`Cache-Control: public, max-age=31536000, immutable` for `/frames/*` and hashed files
under `/assets/*`. Keep asset filenames content-hashed when deploying.
