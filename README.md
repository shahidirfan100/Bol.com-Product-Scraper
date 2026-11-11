## What does Bol.com Product Scraper do?

Bol.com Product Scraper collects products from bol.com search result pages and saves them as a structured dataset. Give it one or more bol.com search URLs, or type a keyword such as `waterkoker`, and it returns the product title, price, rating, brand, seller and image for every result it finds.

The Actor is built for price research, assortment checks, competitor monitoring and product feeds. It follows pagination, removes duplicates across pages and across multiple searches, and flags sponsored placements so you can separate paid rows from organic ones.

No bol.com account, login or API key is needed.

## Why use Bol.com Product Scraper?

- **Complete result pages** - Every product on a search page is collected, including sponsored placements, with pagination handled for you.
- **Clean, typed output** - Prices arrive as numbers and review counts as integers, ready for a spreadsheet or database without post-processing.
- **Multiple searches per run** - Paste several bol.com search URLs and get one de-duplicated dataset instead of merging exports by hand.
- **Filters respected** - Sort order and filter parameters in your search URL are kept, so `sort=price0` or a rating filter produces the same selection you see in the browser.
- **Automation ready** - Export to CSV, Excel, JSON or XML, or read the dataset from the Apify API.
- **Scheduled monitoring** - Run daily or weekly to track price and availability changes over time.

## What data can you extract from bol.com?

| Field            | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `id`             | bol.com product id, for example `9300000025110276`     |
| `title`          | Full product title                                     |
| `url`            | Product page URL                                       |
| `price`          | Current selling price as a number                      |
| `currency`       | Currency code, for example `EUR`                       |
| `referencePrice` | Manufacturer suggested price when bol.com shows one    |
| `rating`         | Average rating out of 5                                |
| `reviewCount`    | Number of reviews on the product                       |
| `brand`          | Brand name from the product page                       |
| `seller`         | Seller of the displayed offer, `bol` or a partner name |
| `category`       | Product category, for example `Waterkokers`            |
| `imageUrl`       | Product image URL                                      |
| `availability`   | Stock status, for example `InStock`                    |
| `delivery`       | Delivery promise shown on the result card              |
| `isSponsored`    | `true` when the row is a sponsored placement           |
| `query`          | Search term that produced the row                      |
| `page`           | Result page number the row came from                   |

## How to use Bol.com Product Scraper

1. Open the Actor on Apify Store.
2. Paste one or more bol.com search result URLs, or type a keyword.
3. Set the maximum number of products and pages for the run.
4. Run the Actor.
5. Open the dataset to preview the rows, then export or connect it to your workflow.

For a first run, keep the defaults and check the dataset preview before scheduling a larger job.

## Input Parameters

| Parameter            | Type    | Required | Default                                                  | Description                                                                         |
| -------------------- | ------- | -------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `urls`               | Array   | No       | `["https://www.bol.com/nl/nl/s/?searchtext=waterkoker"]` | One or more bol.com search result URLs. Filters and sort order in the URL are kept. |
| `keyword`            | String  | No       | -                                                        | Search term used instead of the URL list                                            |
| `maxResults`         | Integer | No       | `20`                                                     | Stop after this many products                                                       |
| `maxPages`           | Integer | No       | `5`                                                      | Safety cap on result pages per search                                               |
| `proxyConfiguration` | Object  | No       | No proxy                                                 | Optional proxy settings for larger volumes                                          |

`urls` and `keyword` are alternatives. A filled-in keyword replaces the URL list, so a prefilled URL never adds a second search.

## Supported URL formats

| Input                                                            | Behaviour                           |
| ---------------------------------------------------------------- | ----------------------------------- |
| `https://www.bol.com/nl/nl/s/?searchtext=waterkoker`             | Search on the Dutch storefront      |
| `https://www.bol.com/be/nl/s/?searchtext=waterkoker`             | Search on the Belgian storefront    |
| `www.bol.com/nl/nl/s/?searchtext=waterkoker`                     | Accepted without the protocol       |
| `https://www.bol.com/nl/nl/s/?searchtext=waterkoker&sort=price0` | Sort and filter parameters are kept |
| `waterkoker`                                                     | Treated as a keyword search         |

Product pages (`/nl/nl/p/...`) and URLs from other domains are rejected with a message that lists the accepted forms. A `page` parameter in your URL is ignored, because the Actor pages from the first result page.

## Output Data

| Field            | Type    | Description                                               |
| ---------------- | ------- | --------------------------------------------------------- |
| `id`             | String  | bol.com product id                                        |
| `title`          | String  | Product title                                             |
| `url`            | String  | Product page URL                                          |
| `price`          | Number  | Current price, for example `25.99`                        |
| `currency`       | String  | Currency code, for example `EUR`                          |
| `referencePrice` | Number  | Suggested retail price when shown, otherwise `null`       |
| `rating`         | Number  | Average rating out of 5, `null` when there are no reviews |
| `reviewCount`    | Integer | Number of reviews                                         |
| `brand`          | String  | Brand name                                                |
| `seller`         | String  | Seller of the displayed offer                             |
| `category`       | String  | Product category                                          |
| `imageUrl`       | String  | Product image URL                                         |
| `availability`   | String  | Stock status                                              |
| `delivery`       | String  | Delivery promise text                                     |
| `isSponsored`    | Boolean | Sponsored placement flag                                  |
| `query`          | String  | Search term used for the row                              |
| `page`           | Integer | Result page number                                        |

## Usage Examples

### Search by keyword

Collect the first 50 water kettles without building a URL yourself:

```json
{
    "keyword": "waterkoker",
    "maxResults": 50
}
```

### Collect several searches in one run

Combine the Dutch and Belgian storefronts, then export a single dataset:

```json
{
    "urls": [
        "https://www.bol.com/nl/nl/s/?searchtext=waterkoker",
        "https://www.bol.com/be/nl/s/?searchtext=waterkoker"
    ],
    "maxResults": 200,
    "maxPages": 5
}
```

### Filtered and sorted results

Keep the filter and sort parameters from the bol.com URL to collect only the cheapest matches in a category:

```json
{
    "urls": ["https://www.bol.com/nl/nl/s/?searchtext=airfryer&sort=price0&rating=4"],
    "maxResults": 120,
    "maxPages": 5
}
```

## Sample Output

```json
{
    "id": "9300000025110276",
    "title": "Tefal Includeo KI5338 - Waterkoker - 1L - Maataanduiding - Anti-kalkfilter - 2400W - Zwart",
    "url": "https://www.bol.com/nl/nl/p/tefal-includeo-ki5338-waterkoker/9300000025110276/",
    "price": 25.99,
    "currency": "EUR",
    "referencePrice": 40.99,
    "rating": 4.6,
    "reviewCount": 183,
    "brand": "Tefal",
    "seller": "bol",
    "category": "Waterkokers",
    "imageUrl": "https://media.s-bol.com/D0lpEEQr5x1k/1159x1200.jpg",
    "availability": "InStock",
    "delivery": "Op voorraad. Voor 23:59 uur besteld, morgen in huis",
    "isSponsored": true,
    "query": "waterkoker",
    "page": 1
}
```

## Tips for best results

- Use the search URL you already get from bol.com, including any filter or sort parameters, so the selection matches what you see in the browser.
- Keep `maxPages` at 10 for large categories. bol.com stops returning results after the tenth page, so a higher limit or a much higher `maxResults` does not add rows.
- Check `isSponsored` when you need organic rankings only. Sponsored rows sit at the top, middle and bottom of a result page.
- Expect `rating` and `referencePrice` to be `null` for some products. bol.com only shows a suggested price on part of the catalogue.
- Use a proxy when you run many searches per day or several scheduled jobs.
- If a run returns fewer rows than `maxResults`, that is normal: duplicates across pages and across searches are removed before saving.
- Public pages change. Report a broken run through the Issues tab instead of editing the Actor.

## Integrations

- **Google Sheets** - Send the dataset to a spreadsheet for price comparisons and assortment reviews.
- **Webhooks** - Trigger your own process when a run finishes.
- **Make or Zapier** - Push new products and price changes into no-code workflows.
- **Apify API** - Read datasets programmatically for dashboards, databases or price monitoring services.
- **Scheduled runs** - Track prices and stock on an hourly, daily or weekly interval.

## Frequently Asked Questions

### Can I export bol.com data to CSV or Excel?

Yes. Apify datasets can be downloaded as CSV, Excel, JSON, XML and other formats from the Console, and the same data is available through the Apify API.

### Can I run this Actor on a schedule?

Yes. Create a schedule in Apify Console and the Actor will repeat with the same input. Scheduling is the simplest way to track price or availability changes over time.

### Why did I get fewer products than my maxResults value?

Duplicates are removed and bol.com exposes at most ten result pages per search, which is roughly 240 products. When the search has fewer results than the limit, the run stops earlier.

### Why are some fields empty?

Some products have no reviews or no suggested retail price, and a few categories are hidden by bol.com. When bol.com does not publish a value, the field stays `null` instead of being guessed.

### Do I need a bol.com account or API key?

No. The Actor only uses public search result pages, so no login, account or API credentials are required.

### Can I collect product descriptions and specifications?

This Actor collects search result data. Product descriptions, full specifications and seller offers are not part of the output, which keeps runs fast and avoids one request per product.

### Why are sponsored products in my dataset?

bol.com mixes sponsored placements into search results. They are included because they are part of the page, and each row is marked with `isSponsored` so you can filter them out.

### Is it legal to scrape bol.com?

Scraping public web data can be legal, but you are responsible for complying with applicable laws, bol.com's terms and privacy rules. Use the data responsibly and do not republish copyrighted content.

## Related Actors

- [Otto.de Scraper](https://apify.com/shahidirfan/otto-de-scraper) - Product data from the German marketplace Otto.de.
- [Cdiscount Product Scraper](https://apify.com/shahidirfan/cdiscount-product-scraper) - Product listings and prices from the French marketplace Cdiscount.
- [Takealot Products Scraper](https://apify.com/shahidirfan/Takealot-Products-Scraper) - Product data from the South African marketplace Takealot.

## Support

For issues, feature requests or custom Actor work, use the Issues tab on the Actor page or contact the developer through Apify.

## Legal Notice

This Actor is designed for legitimate data collection from publicly available sources. Users are responsible for using the collected data responsibly and complying with applicable laws and website terms.
