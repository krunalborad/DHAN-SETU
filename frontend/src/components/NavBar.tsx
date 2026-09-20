import { NavLink } from "react-router-dom";
import { usePortfolio } from "../context/PortfolioContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/holdings", label: "Holdings" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/trades", label: "Trades" },
  { to: "/sip-goals", label: "SIP & Goals" },
  { to: "/analytics", label: "Analytics" },
  { to: "/dividends", label: "Dividends" },
  { to: "/tax", label: "Tax" },
  { to: "/ai-insights", label: "AI Insights" },
  { to: "/alerts", label: "Alerts" },
];

export default function NavBar() {
  const { resetDemoData } = usePortfolio();

  return (
    <header className="border-b border-ink-border">
      <div className="flex items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-8 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gain opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gain" />
            </span>
            <span className="text-sm font-bold tracking-wide text-ink50">DHAN SETU</span>
          </div>
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap text-sm px-3 py-1.5 rounded-md transition-colors ${
                    isActive ? "bg-ink-elevated text-ink50" : "text-ink70 hover:text-ink50"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <button
          onClick={() => {
            if (confirm("Reset all portfolio data back to the demo defaults?")) resetDemoData();
          }}
          className="text-xs text-ink70 hover:text-ink50 shrink-0"
        >
          Sign out
        </button>
      </div>
      <nav className="lg:hidden flex items-center gap-1 overflow-x-auto px-6 pb-3 -mt-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `whitespace-nowrap text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                isActive ? "bg-ink-elevated text-ink50" : "text-ink70 hover:text-ink50"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}