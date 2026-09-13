import { PortfolioProvider } from "../../context/PortfolioContext.jsx";
import { GeneralContextProvider } from "../../context/GeneralContext.jsx";
import Dashboard from "./Dashboard.jsx";
import TopBar from "./TopBar.jsx";

export default function Home() {
  return (
    <PortfolioProvider>
      <GeneralContextProvider>
        <TopBar />
        <Dashboard />
      </GeneralContextProvider>
    </PortfolioProvider>
  );
}
