import API from "../api";

export async function fetchBatchQuotes(items = []) {
    if (!items || items.length === 0) return {};

    const symbols = items
        .map((item) => (typeof item === "string" ? item : item.name))
        .filter(Boolean)
        .join(",");

    if (!symbols) return {};

    try {
        const res = await API.get(`/market/quotes?symbols=${symbols}`);
        return res.data || {};
    } catch (err) {
        console.warn("Batch quote fetch failed:", err);
        return {};
    }
}
