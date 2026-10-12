import { useState } from "react";

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

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="brand">🏨 HotelOS</div>
          <div className="hotel-name">Demo Hotel · Management System</div>
        </div>
        <div className="user-area">
          <span className="status-dot" />
          <span>Owner</span>
          <button className="avatar">M</button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <button className={`nav-item ${active === "Dashboard" ? "active" : ""}`}
            onClick={() => setActive("Dashboard")}>⌂ <span>Dashboard</span></button>
          {modules.map((m) => (
            <button key={m.name}
              className={`nav-item ${active === m.name ? "active" : ""}`}
              onClick={() => setActive(m.name)}>
              <span>{m.icon}</span><span>{m.name}</span>
            </button>
          ))}
        </aside>

        <main className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">OWNER VIEW</p>
              <h1>{active}</h1>
              <p className="muted">
                {active === "Dashboard"
                  ? "A clean operational overview. Real hotel data will replace these prototype values."
                  : `${active} module foundation.`}
              </p>
            </div>
            <button className="primary">+ New {active === "Dashboard" ? "Booking" : active}</button>
          </div>

          {active === "Dashboard" ? (
            <>
              <section className="cards">
                <Metric title="Occupied Rooms" value="18 / 30" note="60% occupancy" />
                <Metric title="Today's Revenue" value="UGX 2.84M" note="+8.4% vs yesterday" />
                <Metric title="Pending Bookings" value="7" note="3 need confirmation" />
                <Metric title="Low Stock Items" value="4" note="2 critical" danger />
              </section>

              <section className="grid-two">
                <div className="panel">
                  <div className="panel-head">
                    <h2>Today's Operations</h2>
                    <span className="tag">Live prototype</span>
                  </div>
                  <div className="operation-row"><span>Check-ins</span><strong>6</strong></div>
                  <div className="operation-row"><span>Check-outs</span><strong>4</strong></div>
                  <div className="operation-row"><span>Restaurant orders</span><strong>31</strong></div>
                  <div className="operation-row"><span>Pending approvals</span><strong>2</strong></div>
                </div>

                <div className="panel">
                  <div className="panel-head">
                    <h2>Control Alerts</h2>
                    <span className="tag warning">2 actions</span>
                  </div>
                  <Alert text="Milk is below the minimum stock level." />
                  <Alert text="Room 204 price requires manager approval." />
                  <Alert text="One cashier shift is still open." />
                </div>
              </section>
            </>
          ) : (
            <div className="empty-module">
              <div className="module-icon">{modules.find(m => m.name === active)?.icon ?? "⌂"}</div>
              <h2>{active}</h2>
              <p>This module is reserved for the next development stage.</p>
              <button className="primary">Open module prototype</button>
            </div>
          )}
        </main>
      </div>

      <nav className="mobile-nav">
        <button onClick={() => setActive("Dashboard")} className={active === "Dashboard" ? "active" : ""}>⌂<small>Home</small></button>
        <button onClick={() => setActive("Reservations")} className={active === "Reservations" ? "active" : ""}>📅<small>Bookings</small></button>
        <button onClick={() => setActive("Cashier")} className={active === "Cashier" ? "active" : ""}>💳<small>Cashier</small></button>
        <button onClick={() => setActive("Rooms")} className={active === "Rooms" ? "active" : ""}>🛏️<small>Rooms</small></button>
        <button onClick={() => setActive("Settings")} className={active === "Settings" ? "active" : ""}>☰<small>More</small></button>
      </nav>
    </div>
  );
}

function Metric({ title, value, note, danger = false }: { title: string; value: string; note: string; danger?: boolean }) {
  return (
    <div className={`metric ${danger ? "danger" : ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Alert({ text }: { text: string }) {
  return <div className="alert"><span>!</span><p>{text}</p></div>;
}

export default App;
