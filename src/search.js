const BASE = 'https://www.bol.com';

/** Accepts a bol.com search URL or a bare phrase and returns a search URL with no page param. */
export function normalizeSearchUrl(raw) {
    const value = String(raw ?? '').trim();
    if (!value) throw new Error('Empty search input.');

    const looksLikeUrl = /^https?:\/\//i.test(value) || /^(www\.)?bol\.com\//i.test(value);
    if (!looksLikeUrl) {
        const url = new URL('/nl/nl/s/', BASE);
        url.searchParams.set('searchtext', value);
        return url;
    }

    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!/(^|\.)bol\.com$/i.test(url.hostname)) {
        throw new Error(`Not a bol.com URL: ${value}`);
    }
    if (/\/p\//.test(url.pathname)) {
        throw new Error(`Product pages are not supported, pass a search URL instead: ${value}`);
    }
    if (!/^\/(nl|be)\/(nl|fr)\/s\/?$/.test(url.pathname)) {
        throw new Error(`Not a bol.com search URL, expected /nl/nl/s/?searchtext=... : ${value}`);
    }
    if (!url.searchParams.get('searchtext')?.trim()) {
        throw new Error(`Search URL has no searchtext parameter: ${value}`);
    }

    url.protocol = 'https:';
    url.hostname = 'www.bol.com';
    // Keep filters and sort, drop paging and tracking noise.
    url.searchParams.delete('page');
    url.searchParams.delete('suggestionType');
    url.searchParams.delete('suggestFragment');
    return url;
}

/** Route data endpoint: /nl/nl/s/ -> /nl/nl/s.data */
export function toDataUrl(searchUrl) {
    const dataUrl = new URL(searchUrl);
    dataUrl.pathname = `${dataUrl.pathname.replace(/\/$/, '')}.data`;
    return dataUrl;
}

const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

function parseStructuredData(raw) {
    try {
        return JSON.parse(raw || '{}');
    } catch {
        return {};
    }
}

export function toItem(product, query, page) {
    const offer = product.bestSellingOffer ?? {};
    const structured = parseStructuredData(product.structuredDataListPage);
    const brand = product.relatedParties?.find((party) => party.role === 'BRAND')?.party?.name;

    return {
        id: product.id,
        title: product.title ?? null,
        url: product.url ? new URL(product.url, BASE).href : null,
        price: toNumber(offer.sellingPrice?.price?.amount),
        currency: structured.offers?.priceCurrency ?? null,
        referencePrice: toNumber(offer.savings?.reference?.referencePrice?.amount),
        rating: product.reviews?.averageRating ?? null,
        reviewCount: product.reviews?.total ?? null,
        brand: brand ?? null,
        seller: offer.retailer?.name ?? null,
        category: product.categories?.[0]?.name ?? null,
        imageUrl: structured.image ?? product.primaryProductImageAssets?.[0]?.renditions?.[0]?.url ?? null,
        availability: structured.offers?.availability ?? null,
        delivery: offer.bestDeliveryOption?.deliveryDescription ?? null,
        isSponsored: Boolean(product.searchProductSponsor?.adId),
        query,
        page,
    };
}
