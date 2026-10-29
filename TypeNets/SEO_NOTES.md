# TypeNets SEO & branding update

1. Run `./set-domain.sh https://your-real-domain.com` once (replaces typenets.wasmer.app in canonicals, OG tags, JSON-LD, sitemap.xml, robots.txt).
2. Deploy (GitHub -> Cloudflare). Check these load: /favicon.ico, /favicon.svg, /sitemap.xml, /robots.txt, /site.webmanifest.
3. Google Search Console: add the property, submit /sitemap.xml, use URL Inspection -> Request indexing on the home page.
4. Optional: add `site:` verification and Bing Webmaster Tools (import from Search Console).

Notes
- Indexed pages: Home, Practice, Lessons, Typing test, Multiplayer, Help. noindex (personal/dynamic): Statistics, Settings, Lesson runner.
- Sitelinks (the Practice / Typing Test / Multiplayer / Help list under the result) are chosen by Google automatically; they cannot be forced. The clear titles, descriptions, nav links, sitemap and SiteNavigationElement data make them likely once the site has traffic and history.
- Google favicon needs a crawlable favicon (multiple of 48px) on the home page; it can take days to weeks to appear.
- Logo: black net (4x4 mesh) on a green (#a3e635) rounded square. Files: favicon.svg, favicon.ico, favicon-*.png, icon-192/512.png, icon-maskable-512.png, apple-touch-icon.png, og-image.png.
