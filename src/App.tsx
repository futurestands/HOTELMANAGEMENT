import { useState, useEffect } from "react";
import { AuthModal } from "./components/AuthModal";
import { ModuleViews } from "./components/ModuleViews";
import { supabase } from "./lib/supabase";
import { UserRole, getModulesForRole } from "./types/hotel";

type Module = {
  name: string;
  icon: string;
  description: string;
};

const allModules: Module[] = [
  { name: "Reservations", icon: "📅", description: "Bookings and availability" },
  { name: "Rooms", icon: "🛏️", description: "Room status and rates" },
  { name: "Cashier", icon: "💳", description: "Payments and receipts" },
  { name: "Inventory", icon: "📦", description: "Stock and purchasing" },
  { name: "Restaurant", icon: "🍽️", description: "Orders and food sales" },
  { name: "HR", icon: "👥", description: "Employees and leave" },
  { name: "Reports", icon: "📊", description: "Operational reporting" },
  { name: "Settings", icon: "⚙️", description: "Hotel configuration" },
];

function App() {
  const [active, setActive] = useState("Dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>("owner");
  const [hotelName] = useState<string>("Kampala Grand Hotel");
  const [dbStatus, setDbStatus] = useState<string>("Checking database connection...");

  useEffect(() => {
    if (!supabase) {
      setDbStatus("Development Mode (Supabase not configured)");
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setDbStatus("Connected to Supabase Database");
      } else {
        setDbStatus("Awaiting Authentication");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) setDbStatus("Connected to Supabase Database");
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
  };

  const allowedModuleNames = getModulesForRole(userRole);
  const visibleModules = allModules.filter((m) => allowedModuleNames.includes(m.name));

  return (
    <div className="app">
      {!isAuthenticated && (
        <AuthModal
          onBypassDemo={(role) => {
            setUserRole(role);
            setIsAuthenticated(true);
            setDbStatus("Development Demo Mode Active");
          }}
          onAuthSuccess={() => {
            setIsAuthenticated(true);
            setDbStatus("Connected to Supabase Database");
          }}
        />
      )}

      <header className="topbar">
        <div>
          <div className="brand">🏨 HotelOS</div>
          <div className="hotel-name">{hotelName} · UGX / Africa/Kampala</div>
        </div>
        <div className="user-area">
          <span className="status-dot" />
          <span className="role-badge">{userRole.toUpperCase()}</span>
          <button className="avatar" title="Sign out" onClick={handleSignOut}>
            {userRole[0].toUpperCase()}
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <button
            className={`nav-item ${active === "Dashboard" ? "active" : ""}`}
            onClick={() => setActive("Dashboard")}
          >
            ⌂ <span>Dashboard</span>
          </button>
          {visibleModules.map((m) => (
            <button
              key={m.name}
              className={`nav-item ${active === m.name ? "active" : ""}`}
              onClick={() => setActive(m.name)}
            >
              <span>{m.icon}</span>
              <span>{m.name}</span>
            </button>
          ))}
        </aside>

        <main className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">{userRole.toUpperCase()} VIEW</p>
              <h1>{active}</h1>
              <p className="muted">
                {active === "Dashboard"
                  ? `Overview for ${hotelName}. Status: ${dbStatus}`
                  : `Managing ${active} module with role-based access control and tenant isolation.`}
              </p>
            </div>
            <button className="primary" onClick={() => setActive(active)}>
              + New {active === "Dashboard" ? "Reservation" : active.slice(0, -1)}
            </button>
          </div>

          {active === "Dashboard" ? (
            <>
              <section className="cards">
                <Metric title="Occupied Rooms" value="0 / 0" note="No room records loaded" />
                <Metric title="Today's Revenue" value="UGX 0" note="No payment records" />
                <Metric title="Pending Bookings" value="0" note="No pending reservations" />
                <Metric title="Low Stock Items" value="0" note="Inventory uninitialized" />
              </section>

              <section className="grid-two">
                <div className="panel">
                  <div className="panel-head">
                    <h2>Today's Operations</h2>
                    <span className="tag">Empty State</span>
                  </div>
                  <div className="operation-row">
                    <span>Check-ins</span>
                    <strong>0</strong>
                  </div>
                  <div className="operation-row">
                    <span>Check-outs</span>
                    <strong>0</strong>
                  </div>
                  <div className="operation-row">
                    <span>Restaurant orders</span>
                    <strong>0</strong>
                  </div>
                  <div className="operation-row">
                    <span>Pending rate approvals</span>
                    <strong>0</strong>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-head">
                    <h2>System Status & Security</h2>
                    <span className="tag success">RLS Active</span>
                  </div>
                  <Alert text={`Database status: ${dbStatus}`} />
                  <Alert text="PostgreSQL Row Level Security (RLS) policies enforce hotel data isolation." />
                  <Alert text="Role permissions restricted according to staff membership assignment." />
                </div>
              </section>
            </>
          ) : (
            <ModuleViews moduleName={active} />
          )}
        </main>
      </div>

      <nav className="mobile-nav">
        <button
          onClick={() => setActive("Dashboard")}
          className={active === "Dashboard" ? "active" : ""}
        >
          ⌂<small>Home</small>
        </button>
        <button
          onClick={() => setActive("Reservations")}
          className={active === "Reservations" ? "active" : ""}
        >
          📅<small>Bookings</small>
        </button>
        <button
          onClick={() => setActive("Cashier")}
          className={active === "Cashier" ? "active" : ""}
        >
          💳<small>Cashier</small>
        </button>
        <button
          onClick={() => setActive("Rooms")}
          className={active === "Rooms" ? "active" : ""}
        >
          🛏️<small>Rooms</small>
        </button>
        <button
          onClick={() => setActive("Settings")}
          className={active === "Settings" ? "active" : ""}
        >
          ☰<small>More</small>
        </button>
      </nav>
    </div>
  );
}

function Metric({
  title,
  value,
  note,
  danger = false,
}: {
  title: string;
  value: string;
  note: string;
  danger?: boolean;
}) {
  return (
    <div className={`metric ${danger ? "danger" : ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Alert({ text }: { text: string }) {
  return (
    <div className="alert">
      <span>!</span>
      <p>{text}</p>
    </div>
  );
}

export default App;
