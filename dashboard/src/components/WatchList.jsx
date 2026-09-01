import { Grow, Tooltip } from "@mui/material";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import BarChartIcon from '@mui/icons-material/BarChart';
import MoreHoriz from "@mui/icons-material/MoreHoriz";

import { watchlist } from "../data/data";
import { useState, useContext } from "react";
import GeneralContext from "./GeneralContext";

export default function WatchList() {
  return (
    <div className="watchlist-container">
      <div className="search-container">
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search eg:infy, bse, nifty fut weekly, gold mcx"
          className="search"
        />
        <span className="counts"> {watchlist.length} / 50</span>
      </div>

      <ul className="list">
        {watchlist.map((stock) => (
          <WatchListItem stock={stock} />
        ))}
      </ul>
    </div>
  );
};

const WatchListItem = ({ stock }) => {

  const [showWatchlistActions, setShowWatchlistActions] = useState(false);
  const handleMouseEnter = () => {
    setShowWatchlistActions(true);
  }
  const handleMouseLeave = () => {
    setShowWatchlistActions(false);
  }

  return (
    <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} key={stock.name}>
      <div className="item">
        <p className={stock.isDown ? 'down' : 'up'}>{stock.name}</p>
        <div className="itemInfo">
          <span className="percent">{stock.percent}</span>
          {stock.isDown ? <KeyboardArrowDown className="down" /> : <KeyboardArrowUp className="up" />}
          <span className="price">{stock.price}</span>
        </div>
      </div>
      {showWatchlistActions && (
        <WatchListActions uid={stock.name} />
      )}
    </li>
  );
};

const WatchListActions = ({ uid }) => {
  const {openBuyWindow} = useContext(GeneralContext);

  const handleBuyClick = () => {
    openBuyWindow(uid);
  }
  return (

    <span className="actions">
      <span>
        <Tooltip title="Buy" placement="top" arrow TransitionComponent={Grow} ><button className="buy" onClick={handleBuyClick}>Buy</button></Tooltip>
        <Tooltip title="Sell" placement="top" arrow TransitionComponent={Grow}><button className="sell" >Sell</button></Tooltip>
        <Tooltip title="Analytics" placement="top" arrow TransitionComponent={Grow}><button className="action"><BarChartIcon className="icon" /></button></Tooltip>
        <Tooltip title="More" placement="top" arrow TransitionComponent={Grow}><button className="btn"><MoreHoriz className="icon" /></button></Tooltip>
      </span>
    </span>
  )
}
