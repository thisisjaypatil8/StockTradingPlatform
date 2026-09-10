
import { PortfolioProvider } from "../context/PortfolioContext.jsx";
import Dashboard from "./Dashboard.jsx";
import TopBar from "./TopBar.jsx";

export default function Home() {
  return (
    <PortfolioProvider>
        <TopBar />
        <Dashboard />
    </PortfolioProvider>
  );
};

