import { PortfolioProvider } from "../../context/PortfolioContext.jsx";
import { ModalContextProvider } from "../../context/ModalContext.jsx";
import Dashboard from "./Dashboard.jsx";
import TopBar from "./TopBar.jsx";

export default function Home() {
  return (
    <PortfolioProvider>
      <ModalContextProvider>
        <TopBar />
        <Dashboard />
      </ModalContextProvider>
    </PortfolioProvider>
  );
}
