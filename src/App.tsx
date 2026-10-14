import { useState, useEffect } from "react";
import { AuthModal } from "./components/AuthModal";
import { ModuleViews } from "./components/ModuleViews";
import { supabase } from "./lib/supabase";
import { UserRole, getModulesForRole, HotelMembership } from "./types/hotel";

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
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);
  const [hotelName, setHotelName] = useState<string>("Select Hotel");
  const [hotelId, setHotelId] = useState<string | undefined>(undefined);
  const [memberships, setMemberships] = useState<HotelMembership[]>([]);
  const [dbStatus, setDbStatus] = useState<string>("Checking session...");
  const [loadingSession, setLoadingSession] = useState<boolean>(true);

  // Real Database Operational Stats
  const [roomStats, setRoomStats] = useState({ total: 0, occupied: 0 });
  const [reservationCount, setReservationCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (!supabase) {
      setDbStatus("Supabase Not Configured");
      setLoadingSession(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        loadUserMemberships(session.user.id);
      } else {
        setIsAuthenticated(false);
        setLoadingSession(false);
        setDbStatus("Awaiting Authentication");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        loadUserMemberships(session.user.id);
      } else {
        setHotelId(undefined);
        setUserRole(undefined);
        setMemberships([]);
        setLoadingSession(false);
        setDbStatus("Awaiting Authentication");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (hotelId && supabase) {
      fetchLiveDashboardStats(hotelId);
    }
  }, [hotelId]);

  const fetchLiveDashboardStats = async (targetHotelId: string) => {
    if (!supabase) return;
    try {
      // Fetch rooms stats
      const { data: rooms } = await supabase.from('rooms').select('status').eq('hotel_id', targetHotelId);
      if (rooms) {
        const total = rooms.length;
        const occupied = rooms.filter(r => r.status === 'occupied').length;
        setRoomStats({ total, occupied });
      }

      // Fetch reservations count
      const { count: resCount } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('hotel_id', targetHotelId).neq('status', 'cancelled');
      setReservationCount(resCount || 0);

      // Fetch stock items low stock count
      const { data: stock } = await supabase.from('stock_items').select('quantity_in_stock, reorder_threshold').eq('hotel_id', targetHotelId);
      if (stock) {
        const lowStock = stock.filter(s => s.quantity_in_stock <= s.reorder_threshold).length;
        setLowStockCount(lowStock);
      }
    } catch (err) {
      console.error('Error fetching live stats:', err);
    }
  };

  const loadUserMemberships = async (userId: string) => {
    if (!supabase) return;
    setLoadingSession(true);
    try {
      const { data, error } = await supabase
        .from('hotel_memberships')
        .select('id, hotel_id, user_id, role, is_active, hotels(id, name, currency, timezone)')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      if (!data || data.length === 0) {
        setMemberships([]);
        setHotelId(undefined);
        setUserRole(undefined);
        setHotelName("No Hotel Membership");
        setDbStatus("Connected (No active hotel memberships found)");
      } else {
        const mapped: HotelMembership[] = data.map((m: any) => ({
          id: m.id,
          hotel_id: m.hotel_id,
          user_id: m.user_id,
          role: m.role as UserRole,
          is_active: m.is_active,
          created_at: '',
          hotel: m.hotels ? {
            id: m.hotels.id,
            name: m.hotels.name,
            currency: m.hotels.currency || 'UGX',
            timezone: m.hotels.timezone || 'Africa/Kampala',
            is_active: true,
            created_at: ''
          } : undefined
        }));

        setMemberships(mapped);
        const primary = mapped[0];
        setHotelId(primary.hotel_id);
        setUserRole(primary.role);
        if (primary.hotel) {
          setHotelName(primary.hotel.name);
        }
        setDbStatus("Connected to Supabase Database (Authenticated & RLS Enforced)");
      }
    } catch (err: any) {
      setDbStatus(`Membership error: ${err.message}`);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleHotelSelect = (selectedHotelId: string) => {
    const membership = memberships.find(m => m.hotel_id === selectedHotelId);
    if (membership) {
      setHotelId(membership.hotel_id);
      setUserRole(membership.role);
      if (membership.hotel) {
        setHotelName(membership.hotel.name);
      }
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setHotelId(undefined);
    setUserRole(undefined);
    setMemberships([]);
  };

  const allowedModuleNames = userRole ? getModulesForRole(userRole) : [];
  const visibleModules = allModules.filter((m) => allowedModuleNames.includes(m.name));

  if (loadingSession) {
    return (
      <div className="app" style={{ display: 'grid', placeItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>🏨 HotelOS Loading...</h2>
          <p className="muted">Verifying secure session and hotel memberships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {!isAuthenticated && (
        <AuthModal
          onBypassDemo={(role) => {
            if (isDev) {
              setUserRole(role);
              setIsAuthenticated(true);
              setHotelName("Development Demo Hotel");
              setHotelId("00000000-0000-0000-0000-000000000001");
              setDbStatus("Development Mode (Demo Fixture)");
            }
          }}
          onAuthSuccess={() => {
            setIsAuthenticated(true);
          }}
        />
      )}

      <header className="topbar">
        <div>
          <div className="brand">🏨 HotelOS</div>
          <div className="hotel-name">
            {memberships.length > 1 ? (
              <select
                value={hotelId}
                onChange={(e) => handleHotelSelect(e.target.value)}
                style={styles.hotelSelect}
              >
                {memberships.map((m) => (
                  <option key={m.hotel_id} value={m.hotel_id}>
                    {m.hotel?.name || 'Hotel'} ({m.role?.toUpperCase()})
                  </option>
                ))}
              </select>
            ) : (
              <span>{hotelName} · UGX / Africa/Kampala</span>
            )}
          </div>
        </div>
        <div className="user-area">
          <span className="status-dot" />
          <span className="role-badge">{userRole ? userRole.toUpperCase() : 'UNASSIGNED'}</span>
          <button className="avatar" title="Sign out" onClick={handleSignOut}>
            {userRole ? userRole[0].toUpperCase() : '?'}
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
              <p className="eyebrow">{userRole ? userRole.toUpperCase() : 'UNASSIGNED'} VIEW</p>
              <h1>{active}</h1>
              <p className="muted">
                {active === "Dashboard"
                  ? `Live database operational overview for ${hotelName}.`
                  : `Managing ${active} module with secure RLS policies and role verification.`}
              </p>
            </div>
            {active === "Dashboard" || active === "Rooms" || active === "Reservations" ? null : (
              <button className="primary" onClick={() => setActive(active)}>
                + New {active.slice(0, -1)}
              </button>
            )}
          </div>

          {active === "Dashboard" ? (
            <>
              <section className="cards">
                <Metric title="Occupied Rooms" value={`${roomStats.occupied} / ${roomStats.total}`} note={roomStats.total > 0 ? `${Math.round((roomStats.occupied / roomStats.total) * 100)}% occupancy` : 'No rooms configured'} />
                <Metric title="Active Reservations" value={reservationCount.toString()} note="Confirmed / checked-in" />
                <Metric title="Assigned Role" value={userRole || 'None'} note="Permission checked" />
                <Metric title="Low Stock Items" value={lowStockCount.toString()} note="Inventory reorder check" danger={lowStockCount > 0} />
              </section>

              <section className="grid-two">
                <div className="panel">
                  <div className="panel-head">
                    <h2>Live Database Metrics</h2>
                    <span className="tag success">Connected</span>
                  </div>
                  <div className="operation-row">
                    <span>Active Hotel ID</span>
                    <strong>{hotelId ? hotelId.slice(0, 12) + '...' : 'None'}</strong>
                  </div>
                  <div className="operation-row">
                    <span>Database Engine</span>
                    <strong>PostgreSQL + RLS</strong>
                  </div>
                  <div className="operation-row">
                    <span>Currency / Timezone</span>
                    <strong>UGX / Africa/Kampala</strong>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-head">
                    <h2>Security & Tenant Isolation</h2>
                    <span className="tag success">Active</span>
                  </div>
                  <Alert text={`Database status: ${dbStatus}`} />
                  <Alert text="PostgreSQL Row Level Security (RLS) policies prevent cross-hotel access." />
                  <Alert text="Database-level triggers enforce concurrency-safe reservation overlap prevention." />
                </div>
              </section>
            </>
          ) : (
            <ModuleViews moduleName={active} hotelId={hotelId} userRole={userRole} />
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
        {visibleModules.slice(0, 4).map((m) => (
          <button
            key={m.name}
            onClick={() => setActive(m.name)}
            className={active === m.name ? "active" : ""}
          >
            <span>{m.icon}</span>
            <small>{m.name}</small>
          </button>
        ))}
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

const styles = {
  hotelSelect: {
    background: '#1e293b',
    color: 'white',
    border: '1px solid #334155',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
  },
};

export default App;
