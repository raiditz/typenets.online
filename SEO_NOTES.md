# TypeNets SEO & branding update

1. Run `./set-domain.sh https://your-real-domain.com` once (replaces typenets.online in canonicals, OG tags, JSON-LD, sitemap.xml, robots.txt).
2. Deploy (GitHub -> Cloudflare). Check these load: /favicon.ico, /favicon.svg, /sitemap.xml, /robots.txt, /site.webmanifest.
3. Google Search Console: add the property, submit /sitemap.xml, use URL Inspection -> Request indexing on the home page.
4. Optional: add `site:` verification and Bing Webmaster Tools (import from Search Console).

Notes
- Indexed pages: Home, Practice, Typing test, Multiplayer, Help. noindex (personal/dynamic): Statistics, Settings, Unused legacy lesson runner.
- Sitelinks (the Practice / Typing Test / Multiplayer / Help list under the result) are chosen by Google automatically; they cannot be forced. The clear titles, descriptions, nav links, sitemap and SiteNavigationElement data make them likely once the site has traffic and history.
- Google favicon needs a crawlable favicon (multiple of 48px) on the home page; it can take days to weeks to appear.
- Logo: purple (#4f2570) hand-drawn spiderweb with a "t" in the centre. favicon.svg / favicon / app icons use a simplified, bolder web on a white rounded tile so it stays readable at 16-48px; og-image.png (1200x630) uses the original thin-line artwork. Files: favicon.svg, favicon.ico, favicon-*.png, icon-192/512.png, icon-maskable-512.png, apple-touch-icon.png, og-image.png.

- Clean URLs: canonicals, og:url, JSON-LD and sitemap.xml now use /practice, /typing-test, /multiplayer, /help, /privacy, /terms (no .html). _redirects 301s the old names. Re-submit sitemap.xml in Search Console after deploying.
