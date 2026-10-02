/**
 * withCache — Generic Higher-Order Function for Cache Check + Single-Flight Coalescing
 *
 * Invariants:
 * 1. Cache Hit -> O(1) instant return
 * 2. In-Flight Hit -> Return existing promise (zero duplicate network calls)
 * 3. Cache Miss -> Execute fetchFn(), cache if valid, guarantee cleanup in finally
 */
async function withCache(cache, inFlightMap, key, fetchFn) {
    const cached = cache.get(key);
    if (cached) return cached;

    if (inFlightMap.has(key)) {
        return inFlightMap.get(key);
    }

    const promise = (async () => {
        try {
            const data = await fetchFn();
            if (data !== undefined && data !== null) {
                cache.set(key, data);
            }
            return data;
        } finally {
            inFlightMap.delete(key);
        }
    })();

    inFlightMap.set(key, promise);
    return promise;
}

module.exports = { withCache };
