// Production bounded LRU Cache(Least Recently Used)
// Implements O(1) read, O(1) write, O(1) eviction using JS ordered map

class LRUCache {
    constructor({max = 300, ttlMs = 60_000} = {}){
        this.max = max;
        this.ttlMs = ttlMs;
        this.cache = new Map();
    }

    get(key) {
        const item = this.cache.get(key);
        if(!item) return null;

        // Check TTL expiration
        if(Date.now() > item.expiresAt){
            this.cache.delete(key); // Evict expired
            return null;
        }

        //Refresh access order (mark as Most Recently used)
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.value;
    }

    set(key, value, customTtl = this.ttlMs){
        // If key already exists, delete first to refresh insertion order
        if(this.cache.has(key)){
            this.cache.delete(key);
        }else if(this.cache.size >= this.max){
            // Evict Least Recently Used(first key in Map iterator is oldest!)
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + customTtl,
        });
    }

    has(key) {
        return this.get(key) !== null;
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    get size() {
        return this.cache.size;
    }
}

module.exports = LRUCache;