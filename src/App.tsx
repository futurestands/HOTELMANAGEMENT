import { useState, useEffect } from "react";
import { AuthModal } from "./components/AuthModal";
import { ModuleViews } from "./components/ModuleViews";
import { supabase } from "./lib/supabase";

type Module = {
  name: string;
  icon: string;
  description: string;
};

const modules: Module[] = [
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
  const [userRole, setUserRole] = useState<string>("owner");
  const [hotelName] = useState<string>("Kampala Grand Hotel");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
  };

  return (
    <div className="app">
      {!isAuthenticated && (
        <AuthModal
          onBypassDemo={(role) => {
            setUserRole(role);
            setIsAuthenticated(true);
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
          {modules.map((m) => (
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
                  ? "Operational overview for Kampala Grand Hotel. Real-time metrics and alerts."
                  : `Managing ${active} module with full tenant isolation and audit logging.`}
              </p>
            </div>
            <button className="primary" onClick={() => setActive(active)}>
              + New {active === "Dashboard" ? "Reservation" : active.slice(0, -1)}
            </button>
          </div>

          {active === "Dashboard" ? (
            <>
              <section className="cards">
                <Metric title="Occupied Rooms" value="22 / 30" note="73% occupancy rate" />
                <Metric title="Today's Revenue" value="UGX 4.15M" note="+12.2% vs yesterday" />
                <Metric title="Pending Bookings" value="5" note="2 need rate approval" />
                <Metric title="Low Stock Items" value="3" note="1 critical ingredient" danger />
              </section>

              <section className="grid-two">
                <div className="panel">
                  <div className="panel-head">
                    <h2>Today's Operations</h2>
                    <span className="tag">Live Data</span>
                  </div>
                  <div className="operation-row">
                    <span>Check-ins</span>
                    <strong>8</strong>
                  </div>
                  <div className="operation-row">
                    <span>Check-outs</span>
                    <strong>5</strong>
                  </div>
                  <div className="operation-row">
                    <span>Restaurant orders</span>
                    <strong>42</strong>
                  </div>
                  <div className="operation-row">
                    <span>Pending rate approvals</span>
                    <strong>1</strong>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-head">
                    <h2>Control Alerts</h2>
                    <span className="tag warning">3 actions required</span>
                  </div>
                  <Alert text="Fresh Milk inventory is below reorder threshold (UGX stock check)." />
                  <Alert text="Reservation #HMS-104 rate is below minimum policy (Manager approval needed)." />
                  <Alert text="Morning cashier shift #SH-204 is awaiting closeout sign-off." />
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
