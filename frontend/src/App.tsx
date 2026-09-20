import { Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Holdings from "./pages/Holdings";
import Watchlist from "./pages/Watchlist";
import Trades from "./pages/Trades";
import SipGoals from "./pages/SIP & Goals";
import Analytics from "./pages/Analytics";
import Dividends from "./pages/Dividends";
import Tax from "./pages/Tax";
import AiInsights from "./pages/AiInsights";
import Alerts from "./pages/Alerts";

export default function App() {
  return (
    <div className="min-h-screen">
      <div className="app-aurora-bg" />
      <NavBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/holdings" element={<Holdings />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/trades" element={<Trades />} />
        <Route path="/sip-goals" element={<SipGoals />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/dividends" element={<Dividends />} />
        <Route path="/tax" element={<Tax />} />
        <Route path="/ai-insights" element={<AiInsights />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </div>
  );
}