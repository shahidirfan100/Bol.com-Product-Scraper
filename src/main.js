import { Actor, log } from 'apify';
import { Impit } from 'impit';
import { decode } from 'turbo-stream';

import { fetchPage } from './fetch-page.js';
import { normalizeSearchUrl, toDataUrl, toItem } from './search.js';

const REQUEST_HEADERS = { accept: 'text/x-script, */*; q=0.01', 'accept-language': 'nl-NL,nl;q=0.9' };

async function decodeRouteData(text) {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode(text));
            controller.close();
        },
    });
    const { value } = await decode(stream);
    const data = value?.['routes/search/searchPage']?.data;
    if (!data || !Array.isArray(data.products)) throw new Error('Unexpected response payload.');
    return data;
}

function collectSearchUrls(input) {
    const urls = Array.isArray(input.urls) ? input.urls.filter(Boolean) : [];
    // A typed keyword replaces the URL list, so a prefilled URL never adds a second search.
    const raw = String(input.keyword ?? '').trim() ? [input.keyword] : urls;
    if (!raw.length) throw new Error('Provide at least one search URL or a keyword.');

    const searchUrls = [];
    const errors = [];
    for (const entry of raw) {
        try {
            searchUrls.push(normalizeSearchUrl(entry));
        } catch (error) {
            errors.push(error.message);
        }
    }
    if (!searchUrls.length) throw new Error(`No usable search input. ${errors.join(' ')}`);
    for (const message of errors) log.warning(message);
    return searchUrls;
}

await Actor.main(async () => {
    const input = (await Actor.getInput()) ?? {};
    // Fallbacks mirror the schema defaults, so a local run without a resolved input behaves the same.
    const maxResults = Math.max(1, Number(input.maxResults) || 20);
    const maxPages = Math.max(1, Number(input.maxPages) || 5);
    const searchUrls = collectSearchUrls(input);
    log.info(`Start run | searches=${searchUrls.length} | maxResults=${maxResults} | maxPages=${maxPages}`);

    const proxyInput = input.proxyConfiguration || {};
    const wantsProxy = Boolean(proxyInput.useApifyProxy) || Boolean(proxyInput.proxyUrls?.length);
    const proxyConfiguration = wantsProxy ? await Actor.createProxyConfiguration(proxyInput) : undefined;
    const proxyUrl = proxyConfiguration ? await proxyConfiguration.newUrl() : undefined;
    const client = new Impit({ browser: 'chrome', proxyUrl, timeout: 60_000 });

    const seen = new Set();
    let saved = 0;
    let pagesRead = 0;
    let reachedPageCap = false;
    let reachedLastPage = false;

    for (const searchUrl of searchUrls) {
        const dataUrl = toDataUrl(searchUrl);
        let lastPage = maxPages;

        for (let page = 1; page <= Math.min(maxPages, lastPage) && saved < maxResults; page++) {
            dataUrl.searchParams.set('page', String(page));
            const data = await decodeRouteData(await fetchPage(client, dataUrl, { headers: REQUEST_HEADERS }));
            const query = data.metaData?.query ?? searchUrl.searchParams.get('searchtext');
            pagesRead++;

            const fresh = [];
            for (const product of data.products) {
                if (seen.has(product.id)) continue;
                seen.add(product.id);
                fresh.push(toItem(product, query, page));
            }

            const batch = fresh.slice(0, maxResults - saved);
            if (batch.length) {
                await Actor.pushData(batch);
                saved += batch.length;
            }
            log.info(
                `Page ${page} for "${query}": ${data.products.length} products, ${fresh.length} new, ${saved}/${maxResults} saved`,
            );

            lastPage = Math.max(1, Number(data.metaData?.maxPage) || 1);
            if (page >= lastPage) reachedLastPage = true;
            if (page >= maxPages) reachedPageCap = true;
            if (!data.products.length) break;
        }
    }

    let stopReason = 'end of results';
    if (reachedPageCap) stopReason = 'maxPages';
    if (reachedLastPage) stopReason = 'last result page';
    if (saved >= maxResults) stopReason = 'maxResults';
    log.info(`Done | saved=${saved} | pages=${pagesRead} | searches=${searchUrls.length} | stop=${stopReason}`);
});
