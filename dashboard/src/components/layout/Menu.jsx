import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Menu.module.css";

const PATH_TO_MENU = {
  "/": "Dashboard",
  "/orders": "Orders",
  "/holdings": "Holdings",
  "/positions": "Positions",
  "/funds": "Funds",
  "/apps": "Apps",
};

export default function Menu() {
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const cleanPath = location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const activeMenu = PATH_TO_MENU[cleanPath] || "Dashboard";

  useEffect(() => {
    document.title = `Kite - ${activeMenu}`;
  }, [activeMenu]);

  const handleMenuClick = () => {
    setIsProfileDropdownOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = storedUser.username ? storedUser.username.toUpperCase() : "TRADER";
  const avatarInitials = displayName.slice(0, 1);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    const wwwURL = import.meta.env.VITE_WWW_URL || "http://localhost:5173";
    window.location.href = `${wwwURL}/signup?action=logout`;
  };

  return (
    <div className={styles.menuContainer}>
      <a href="/"><img src="logo.png" alt="Zerodha" className={styles.logo} /></a>
      <div className={styles.menus}>
        <ul>
          <li>
            <Link
              to={"/"}
              onClick={handleMenuClick}
              className={`${styles.menu} ${activeMenu === "Dashboard" ? styles.selected : ""}`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to={"/orders"}
              onClick={handleMenuClick}
              className={`${styles.menu} ${activeMenu === "Orders" ? styles.selected : ""}`}
            >
              Orders
            </Link>
          </li>
          <li>
            <Link
              to={"/holdings"}
              onClick={handleMenuClick}
              className={`${styles.menu} ${activeMenu === "Holdings" ? styles.selected : ""}`}
            >
              Holdings
            </Link>
          </li>
          <li>
            <Link
              to={"/positions"}
              onClick={handleMenuClick}
              className={`${styles.menu} ${activeMenu === "Positions" ? styles.selected : ""}`}
            >
              Positions
            </Link>
          </li>
          <li>
            <Link
              to={"/funds"}
              onClick={handleMenuClick}
              className={`${styles.menu} ${activeMenu === "Funds" ? styles.selected : ""}`}
            >
              Funds
            </Link>
          </li>
          <li>
            <Link
              to={"/apps"}
              onClick={handleMenuClick}
              className={`${styles.menu} ${activeMenu === "Apps" ? styles.selected : ""}`}
            >
              Apps
            </Link>
          </li>
        </ul>
        <hr className={styles.divider} />

        <div className={styles.profileWrapper}>
          <div
            className={styles.profile}
            onClick={handleProfileClick}
            title="Account Profile"
          >
            <div className={styles.avatar}>{avatarInitials}</div>
            <p className={styles.username}>{displayName}</p>
          </div>

          {isProfileDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownName}>{displayName}</p>
                <span className={styles.dropdownEmail}>
                  {storedUser.email || "Active Trader"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutBtn}
              >
                Logout Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
