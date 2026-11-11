# API discovery — Bol.com product search

Evidence gathered 2026-11-11 against a live browser session and plain HTTP requests from a residential IP.

## Target

- Listing surface: `https://www.bol.com/nl/nl/s/?searchtext=waterkoker` (server-rendered search page).
- What a page contains: 24–30 product tiles, filter facets, pagination (max 10 pages).
- Locale variants seen: `/nl/nl/s/` (Netherlands) and `/be/nl/s/` (Belgium). Same route, same payload.

## Selected API

`GET https://www.bol.com/{locale}/s.data?searchtext=<query>&page=<n>`

The search route is a React Router data route. Appending `.data` to the route path returns the route's loader data as a turbo-stream payload instead of HTML. It is the same data the page renders, without the DOM.

Why this one:

- No auth, no cookies required. Verified with a cold HTTP client: `200`, `text/x-script; charset=utf-8`, ~570 KB.
- Returns structured product objects (price, rating, brand, seller, image, delivery) rather than markup.
- Honours filters and sort parameters from the original search URL (`sort=price0`, `price=10-00-50-00`, `rating=4` all changed the result set).
- One request per page, no per-product request.

## Request contract

| Item             | Value                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Method           | `GET`                                                                                                   |
| Path             | `/nl/nl/s.data` or `/be/nl/s.data`                                                                      |
| Query            | `searchtext` (required), `page` (1-based), plus any filter/sort params carried over from the user's URL |
| Required headers | none beyond a browser-like `User-Agent`; `Accept: text/x-script, */*; q=0.01`                           |
| Auth / cookies   | none                                                                                                    |
| Response type    | `text/x-script; charset=utf-8`                                                                          |

`searchtext=` empty returns `202` with a 136-byte body. Treat as invalid input.

## Response shape

Body is a turbo-stream v2 flattened array. Decode with `turbo-stream@2`:

```
decode(bytes) -> { root: {...}, "routes/search/searchPage": { data: {...} } }
```

`data` keys: `template`, `urls`, `seoMetadata`, `metaData`, `facets`, `queryInterpretation`, `facetRedirect`, `products`, `activePageVariant`, `url`, `textResources`, `googleAnalytics`, `sentry`, `deviceContext`, `rudder`.

`data.metaData`: `query`, `pageNumber`, `total`, `maxPage`, `pageType`, `filters`, `restrictions`.
`data.products[]` (25 items on page 1): product node with `id`, `title`, `url`, `reviews`, `relatedParties`, `categories`, `bestSellingOffer`, `structuredDataListPage`, `searchProductSponsor`.

## Pagination

- `page` is 1-based and honoured.
- `metaData.maxPage` caps at 10 for large result sets (5231 results for `waterkoker`, 10 pages reachable).
- `page=11` returns `200` with `products: []`, `total: 0` — stop on an empty page.
- Page 2 and 3 repeat 6 promoted product ids from page 1 (ad slots at the top, middle and bottom). Dedupe by product id.

## Field mapping

| Dataset field    | Source path                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `id`             | `products[].id`                                                                                                             |
| `title`          | `products[].title`                                                                                                          |
| `url`            | `products[].url`, resolved against `https://www.bol.com`                                                                    |
| `price`          | `products[].bestSellingOffer.sellingPrice.price.amount` (string → number)                                                   |
| `currency`       | `JSON.parse(products[].structuredDataListPage).offers.priceCurrency`                                                        |
| `referencePrice` | `products[].bestSellingOffer.savings.reference.referencePrice.amount` (absent on most items)                                |
| `rating`         | `products[].reviews.averageRating`                                                                                          |
| `reviewCount`    | `products[].reviews.total`                                                                                                  |
| `brand`          | `products[].relatedParties[] where role === "BRAND" → party.name`                                                           |
| `seller`         | `products[].bestSellingOffer.retailer.name`                                                                                 |
| `category`       | `products[].categories[0].name`                                                                                             |
| `imageUrl`       | `JSON.parse(products[].structuredDataListPage).image`, fallback `products[].primaryProductImageAssets[0].renditions[0].url` |
| `availability`   | `JSON.parse(products[].structuredDataListPage).offers.availability`                                                         |
| `delivery`       | `products[].bestSellingOffer.bestDeliveryOption.deliveryDescription`                                                        |
| `isSponsored`    | `Boolean(products[].searchProductSponsor.adId)`                                                                             |

Coverage measured over 88 products (`senseo koffie`, pages 1–3): price 88/88, brand 88/88, seller 88/88, image 88/88, currency 88/88, availability 88/88, rating 70/88, referencePrice 19/88, category 86/88, sponsored 18/88.

## Rejected candidates

| Candidate                              | Why rejected                                                                                                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST https://www.bol.com/api/graphql` | Persisted queries only (`SearchHistory`, `Preferences`, `ProductCompareMobileUrl`). No product search operation fires on the listing page; search data comes from the route loader. |
| Search page HTML + CSS selectors       | 1.8 MB per page, markup changes with every A/B variant, and the HTML is 403 for any client that does not look like a browser.                                                       |
| `api.bol.com/catalog/v2/products`      | Partner API, requires a client id/secret and an affiliate relationship.                                                                                                             |

## Failure log

- `2026-11-11 11:11` — plain `fetch` and `impit` on the HTML search URL: **403**, 9.6 KB body (bot manager). The HTML route is protected; the `.data` route is not.
- `2026-11-11 11:20` — `GET /nl/nl/s.data?searchtext=waterkoker&page=1` with only a `User-Agent`: **200**, 614 KB. Repeated with `impit` browser emulation: **200**, 569 KB.
- `2026-11-11 11:26` — `page=11` on a 10-page query: **200**, `products: []`. Empty page is the end condition.
- `2026-11-11 11:27` — bare `searchtext=`: **202**, 136 B. Blocked at input validation instead.
