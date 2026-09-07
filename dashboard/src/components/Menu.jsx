import { useState } from "react";
import { json, Link } from "react-router-dom";
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

  const menuClass = "menu";
  const activeMenuClass = "menu selected";


  //1. Logged in user ka naam nikalo
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = storedUser.username ? storedUser.username.toUpperCase() : "TRADER";
  const avatarInitials = displayName.slice(0, 2);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href="http://localhost:5173/signup";
  };

  return (
    <div className="menu-container">
      <img src="logo.png" style={{ width: "50px" }} />
      <div className="menus">
        <ul>
          <li>
            <Link style={{ textDecoration: "none" }} to={"/"} onClick={() => handleMenuClick("Dashboard")} className={selectedMenu === "Dashboard" ? activeMenuClass : menuClass}>Dashboard</Link>

          </li>
          <li >
            <Link style={{ textDecoration: "none" }} to={"/orders"} onClick={() => handleMenuClick("Orders")} className={selectedMenu === "Orders" ? activeMenuClass : menuClass}>Orders</Link>

          </li>
          <li>

            <Link style={{ textDecoration: "none" }} to={"/holdings"} onClick={() => handleMenuClick("Holdings")} className={selectedMenu === "Holdings" ? activeMenuClass : menuClass}>Holdings</Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to={"/positions"} onClick={() => handleMenuClick("Positions")} className={selectedMenu === "Positions" ? activeMenuClass : menuClass}>Positions</Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to={"/funds"} onClick={() => handleMenuClick("Funds")} className={selectedMenu === "Funds" ? activeMenuClass : menuClass}>Funds</Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to={"/apps"} onClick={() => handleMenuClick("Apps")} className={selectedMenu === "Apps" ? activeMenuClass : menuClass}>Apps</Link>
          </li>
        </ul>
        <hr />
        <div className="profile"onClick={handleLogout} title="Click to Logout" 
        style={{cursor:"pointer"}} >
          <div className="avatar">{avatarInitials}</div>
          <p className="username">{displayName}</p>
        </div>
      </div>
    </div>
  );
};
