import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Menu.module.css";

export default function Menu() {

  const [selectedMenu, setSelectedMenu] = useState("Dashboard");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleMenuClick = (menu) => {
    setSelectedMenu(menu);
    setIsProfileDropdownOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  //1. Logged in user ka naam nikalo
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = storedUser.username ? storedUser.username.toUpperCase() : "TRADER";
  const avatarInitials = displayName.slice(0, 1);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href="http://localhost:5173/signup?action=logout";
  };

  return (
    <div className={styles.menuContainer}>
      <img src="logo.png" alt="Zerodha" className={styles.logo} />
      <div className={styles.menus}>
        <ul>
          <li>
            <Link to={"/"} onClick={() => handleMenuClick("Dashboard")} className={`${styles.menu} ${selectedMenu === "Dashboard" ? styles.selected : ""}`}>Dashboard</Link>
          </li>
          <li>
            <Link to={"/orders"} onClick={() => handleMenuClick("Orders")} className={`${styles.menu} ${selectedMenu === "Orders" ? styles.selected : ""}`}>Orders</Link>
          </li>
          <li>
            <Link to={"/holdings"} onClick={() => handleMenuClick("Holdings")} className={`${styles.menu} ${selectedMenu === "Holdings" ? styles.selected : ""}`}>Holdings</Link>
          </li>
          <li>
            <Link to={"/positions"} onClick={() => handleMenuClick("Positions")} className={`${styles.menu} ${selectedMenu === "Positions" ? styles.selected : ""}`}>Positions</Link>
          </li>
          <li>
            <Link to={"/funds"} onClick={() => handleMenuClick("Funds")} className={`${styles.menu} ${selectedMenu === "Funds" ? styles.selected : ""}`}>Funds</Link>
          </li>
          <li>
            <Link to={"/apps"} onClick={() => handleMenuClick("Apps")} className={`${styles.menu} ${selectedMenu === "Apps" ? styles.selected : ""}`}>Apps</Link>
          </li>
        </ul>
        <hr className={styles.divider} />

        {/* Profile Container with Dropdown */}
        <div className={styles.profileWrapper}>
          <div 
            className={styles.profile} 
            onClick={handleProfileClick} 
            title="Account Profile" 
          >
            <div className={styles.avatar}>{avatarInitials}</div>
            <p className={styles.username}>{displayName}</p>
          </div>

          {/* Profile Dropdown Popup */}
          {isProfileDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownName}>
                  {displayName}
                </p>
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
};

