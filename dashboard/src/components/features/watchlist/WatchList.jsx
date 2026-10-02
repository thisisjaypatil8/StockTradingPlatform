import { useState, useEffect } from "react";
import styles from "./WatchList.module.css";
import { fetchBatchQuotes } from "../../../utils/marketQuotes";
import { watchlist as defaultWatchlist } from "../../../data/data";
import { DoughnutChart } from "../../shared/charts/DoughnutChart";
import WatchListItem from "./WatchListItem";
import API from "../../../api";

export default function WatchList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize from LocalStorage or fallback to default data
  const [userWatchlist, setUserWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem("userWatchlist");
      return saved ? JSON.parse(saved) : defaultWatchlist;
    } catch {
      return defaultWatchlist;
    }
  });

  // Debounced Live Symbol Search (300ms)
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await API.get(`/market/search?q=${encodeURIComponent(trimmed)}`);
        setSearchResults(res.data || []);
      } catch (err) {
        console.warn("Live search error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);


    // Batch Quote polling: 1 single network request for all watchlist stocks
  useEffect(() => {
    let isMounted = true;

    const refreshWatchlistQuotes = async () => {
      if (userWatchlist.length === 0) return;
      try {
        const quoteMap = await fetchBatchQuotes(userWatchlist);
        if (!isMounted || !quoteMap) return;

        setUserWatchlist((prev) =>
          prev.map((stock) => {
            const quote = quoteMap[stock.name.toUpperCase()] || quoteMap[stock.name];
            if (!quote) return stock;
            return {
              ...stock,
              price: Number(quote.price) || stock.price,
              percent: quote.percent || stock.percent,
              isDown: quote.isLoss !== undefined ? quote.isLoss : stock.isDown,
            };
          })
        );
      } catch (err) {
        console.warn("Watchlist batch quote failed:", err);
      }
    };

    refreshWatchlistQuotes();
    const interval = setInterval(refreshWatchlistQuotes, 15000); // 15 sec live cycle

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userWatchlist.length]);

  // Add stock to Watchlist
  const handleAddStock = (item) => {
    const alreadyExists = userWatchlist.some(
      (s) => s.name.toUpperCase() === item.name.toUpperCase()
    );
    if (alreadyExists) return;

    const newStock = {
      name: item.name.toUpperCase(),
      price: 0,
      percent: "+0.00%",
      isDown: false,
    };

    const updated = [newStock, ...userWatchlist];
    setUserWatchlist(updated);
    localStorage.setItem("userWatchlist", JSON.stringify(updated));
    setSearchTerm("");
    setSearchResults([]);
  };

    // Remove stock from Watchlist
  const handleRemoveStock = (stockName) => {
    const updated = userWatchlist.filter(
      (s) => s.name.toUpperCase() !== stockName.toUpperCase()
    );
    setUserWatchlist(updated);
    localStorage.setItem("userWatchlist", JSON.stringify(updated));
  };


  // Filter local watchlist
  const filteredWatchlist = userWatchlist.filter((stock) =>
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const labels = userWatchlist.map((stock) => stock.name);
  const data = {
    labels,
    datasets: [
      {
        label: "Price",
        data: userWatchlist.map((stock) => stock.price || 100),
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
          "rgba(153, 102, 255, 0.5)",
          "rgba(255, 159, 64, 0.5)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className={styles.watchlistContainer}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search eg: INFY, TATA, ITC, ZOMATO..."
          className={styles.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoComplete="off"
        />
        <span className={styles.counts}>
          {filteredWatchlist.length} / {userWatchlist.length}
        </span>

        {/* Live Search Dropdown */}
        {searchResults.length > 0 && (
          <div className={styles.searchDropdown}>
            {searchResults.map((item) => {
              const isAdded = userWatchlist.some(
                (s) => s.name.toUpperCase() === item.name.toUpperCase()
              );
              return (
                <div key={item.symbol} className={styles.searchItem}>
                  <div className={styles.searchInfo}>
                    <div className={styles.searchHeader}>
                      <span className={styles.searchTicker}>{item.name}</span>
                      <span className={styles.exchangeBadge}>{item.exchange}</span>
                    </div>
                    <span className={styles.companyName}>{item.shortname}</span>
                  </div>
                  {isAdded ? (
                    <span className={styles.addedBadge}>✓ Added</span>
                  ) : (
                    <button
                      type="button"
                      className={styles.addBtn}
                      onClick={() => handleAddStock(item)}
                    >
                      + Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ul className={styles.list}>
        {filteredWatchlist.map((stock) => (
          <WatchListItem key={stock.name} stock={stock} onRemove={handleRemoveStock} />
        ))}
      </ul>

      <DoughnutChart data={data} />
    </div>
  );
}
