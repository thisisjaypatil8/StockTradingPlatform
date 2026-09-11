import { useState } from "react";
import styles from "./WatchList.module.css";
import { watchlist } from "../../../data/data";
import { DoughnutChart } from "../../shared/charts/DoughnutChart";
import WatchListItem from "./WatchListItem";

export default function WatchList() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredWatchlist = watchlist.filter((stock) =>
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const labels = watchlist.map((stock) => stock.name);
  const data = {
    labels,
    datasets: [
      {
        label: "Price",
        data: watchlist.map((stock) => stock.price),
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
          placeholder="Search eg: INFY, RELIANCE, TCS..."
          className={styles.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className={styles.counts}>
          {filteredWatchlist.length} / {watchlist.length}
        </span>
      </div>

      <ul className={styles.list}>
        {filteredWatchlist.map((stock) => (
          <WatchListItem key={stock.name} stock={stock} />
        ))}
      </ul>

      <DoughnutChart data={data} />
    </div>
  );
}
