# TODO Production

## Hero image optimization (perf)
Source: `public/hero-radar-permis.jpg` (~1.5 MB)

Cible : < 200 KB par variante (AVIF + WebP).

Recommandations :
- Re-encode avec [Squoosh](https://squoosh.app/) (Drag&drop UI, AVIF q=45, WebP q=70)
- ou via [sharp](https://sharp.pixelplumbing.com/) en CLI :

```sh
npx sharp -i public/hero-radar-permis.jpg \
  -o public/hero-radar-permis.avif --avif quality=45
npx sharp -i public/hero-radar-permis.jpg \
  -o public/hero-radar-permis.webp --webp quality=70
```

Une fois fait, `<Image src="/hero-radar-permis.jpg">` (next/image) servira automatiquement
l'AVIF/WebP grâce à `images.formats` dans `next.config.ts`. Aucun changement code requis.

Tip : ramener la résolution source à 1920×1080 max avant compression.
