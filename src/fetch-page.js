const RETRY_STATUSES = new Set([403, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;

const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

export async function fetchPage(client, url, { headers = {}, retries = MAX_RETRIES, backoffMs = 1000 } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await client.fetch(url, { headers });
            const body = await response.text();
            if (response.status === 200) return body;
            lastError = new Error(`HTTP ${response.status} for ${url}`);
            if (!RETRY_STATUSES.has(response.status)) break;
        } catch (error) {
            lastError = error;
        }
        if (attempt < retries) await sleep(backoffMs * attempt * (1 + Math.random()));
    }
    throw lastError;
}
