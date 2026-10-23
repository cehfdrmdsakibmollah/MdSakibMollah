# MD Sakib Mollah Portfolio — SEO and Google Search Visibility

**Target canonical domain:** https://mdsakibmollah.vercel.app/

Google Search is not a paid listing, and there is **no guarantee of indexing, a #1 result, or any particular ranking**. Google's search results depend on page relevance, useful original content, competition, independent references, crawling and several other factors. Never promise 100% SEO rankings.

## Implemented technical SEO

- Server-rendered, publicly reachable homepage and public project, service, articles, planner, contact, privacy, and listing pages.
- Distinct page titles, real descriptions, absolute canonical links and social Open Graph metadata. Private Dashboard remains `noindex` and is excluded from the sitemap and robots crawler access.
- A new publicly accessible /services overview provides context and internal links to real service detail pages and source-linked work.
- Visible, clickable breadcrumbs alongside accurately matching `BreadcrumbList` JSON-LD on all project/service/article detail pages.
- Consistent `Person` and `WebSite` JSON-LD, plus factual page-level `SoftwareSourceCode`, `BlogPosting`, and `Service` schema with **only content visible and supported by the public site**. Some types are semantic hints only and do not earn Google rich results.
- Related project and article links plus service-to-project links improve navigation and discoverability without artificial keyword stuffing.
- Root /sitemap.xml and /robots.txt, including /services but omitting private Dashboard and API URLs. Links to actual public GitHub repositories and public profile pages remain.
- GitHub quality automation now checks 21 indexable canonical pages after the matching Vercel revision is live, including sitemap integrity, metadata uniqueness, crawlability, schema parsing and OG image accessibility. Automated passing checks verify technical structure—not ranking, Google indexing, real-user Core Web Vitals, or search traffic.

## Owner-supplied HTML verification file — prepared for next deploy

The original owner-provided file `google25491feec6ee656b.html` has been committed **unchanged** to `apps/web/public/google25491feec6ee656b.html`. Next.js serves static assets in `public/` from the website root, so the required Google Search Console URL will be:

`https://mdsakibmollah.vercel.app/google25491feec6ee656b.html`

The expected plain-text response must be **exactly** `google-site-verification: google25491feec6ee656b.html`. This is intentionally public and contains **no API key**. `scripts/check-google-ownership.mjs` now fails GitHub CI if the file differs from the supplied bytes. The browser quality audit checks the live URL after the Vercel deployment revision matches GitHub `main`.

**Tomorrow, after Vercel free-tier deployment quota resets:**

1. Deploy **latest GitHub main**, not an old deployment's old commit. Do not upgrade billing to get around the quota.
2. Open the direct verification URL above. It must return the exact expected text and HTTP 200, not a 404 or the portfolio homepage.
3. In the already-created Search Console URL-prefix property `https://mdsakibmollah.vercel.app/`, expand **HTML file**, then click **VERIFY**. This method uses the uploaded file, so the optional previously saved `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` HTML-tag setting is not necessary for the HTML-file method; leaving it in place does not change the steps.
4. After **Ownership verified**, submit `sitemap.xml` in Search Console → Sitemaps.
5. Use URL Inspection to request indexing of the homepage and important pages. Actual indexing and rank cannot be assumed or guaranteed; track these in Search Console.

Do not click **Remove Property**, delete the verification file after verification, copy verification codes into analytics accounts, or expose passwords. The owner has to perform the Search Console verification action in their authenticated property.

## Account-level Google Search Console setup (requires owner)

1. Sign in to [Google Search Console](https://search.google.com/search-console) with the **site owner's Google account**.
2. Add the **URL-prefix** property `https://mdsakibmollah.vercel.app/`, or an existing verified property if applicable. Complete ownership verification via the method Google provides. If using Google's HTML-tag verification method, set the exact verification content in Vercel as `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`; the application already emits the corresponding meta tag. Do not share tokens in chats or GitHub.
3. After the verified property recognizes the deployed site, submit `https://mdsakibmollah.vercel.app/sitemap.xml` in **Sitemaps**.
4. Inspect the homepage, /services, /projects, /insights and important detail URLs using **URL Inspection**, then ask Google to index priority pages when eligible. Check whether the *Google-selected canonical* matches the site's declared canonical.
5. Monitor **Pages / Indexing**, **Performance → Search results**, **Core Web Vitals**, and **Enhancements** if available. In Performance, inspect queries, pages, impressions, clicks, CTR, and average position over several weeks, filtering branded vs non-branded searches. Report actual observations rather than invented ranks.
6. Improve content based on evidence. Give each project real technical details, screenshots, deployment links and dates only if actually verified. Publish firsthand notes or honest engineering writeups periodically. Do not use fake reviews, fake numbers, doorway pages, paid backlink schemes or mass autogenerated keyword pages.

### Verification reference

- Google Search SEO starter guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Google breadcrumb markup: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- Sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Search Console: https://search.google.com/search-console/

**Not completed without site owner authorization:** Search Console ownership verification, sitemap submission through that account, confirmation of actual Google indexing or ranking, domain authentication or analytics authorization. Do not infer these from public 200 responses.
