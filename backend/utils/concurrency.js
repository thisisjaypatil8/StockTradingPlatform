async function asyncPool(tasks, limit = 4){
    const results = [];
    const executing = new Set();

    for(const task of tasks){
        const p = Promise.resolve().then(() => task());
        results.push(p);
        executing.add(p);

        const clean = () => executing.delete(p);
        p.then(clean, clean);

        // If we hit concurrency ceiling, wait for the fastest active promise to finish
        if(executing.size >= limit){
            await Promise.race(executing);
        }
    }

    return Promise.all(results);
}

module.exports = { asyncPool };