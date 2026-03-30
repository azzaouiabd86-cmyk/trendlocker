import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  Radar, 
  TrendingUp, 
  Library, 
  Settings, 
  LogOut, 
  CreditCard,
  Menu,
  X,
  Activity,
  ShieldAlert
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";

const navItems = [
  { name: "Niche Radar", path: "/dashboard/radar", icon: Radar },
  { name: "Trend Discovery", path: "/dashboard/trends", icon: TrendingUp },
  { name: "My Library", path: "/dashboard/library", icon: Library },
  { name: "Usage & Billing", path: "/dashboard/usage", icon: Activity },
  { name: "Settings", path: "/dashboard/settings", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        if (user.email === "azzaouiabd86@gmail.com") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            
            // Update lastLoginAt if it's a new day
            const today = new Date().toISOString().split('T')[0];
            const lastLogin = data.lastLoginAt ? new Date(data.lastLoginAt).toISOString().split('T')[0] : null;
            
            if (today !== lastLogin) {
              await updateDoc(userDocRef, {
                lastLoginAt: new Date().toISOString()
              });
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setIsAdmin(false);
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const tier = userData?.subscriptionTier || 'free';
  const credits = userData?.apiCreditsRemaining ?? 50;
  const maxCredits = tier === 'agency' ? 5000 : tier === 'pro' ? 500 : 50;
  const creditPercentage = Math.min(100, (credits / maxCredits) * 100);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg">N</span>
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">Niche Raddar</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors",
                  isActive 
                    ? "bg-indigo-600/10 text-indigo-400" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                <Icon className="w-5 h-5" />
                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
          
          {isAdmin && (
            <Link
              to="/dashboard/admin"
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-colors mt-4",
                location.pathname === "/dashboard/admin"
                  ? "bg-red-500/10 text-red-400" 
                  : "text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
              )}
            >
              <ShieldAlert className="w-5 h-5" />
              {isSidebarOpen && <span className="font-medium">Admin Panel</span>}
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <Link to="/dashboard/usage" className={cn(
            "block bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800 transition-colors cursor-pointer",
            !isSidebarOpen && "flex justify-center"
          )}>
            {isSidebarOpen ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Credits</span>
                  <span className="text-xs text-indigo-400 font-bold">{credits}/{maxCredits}</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${creditPercentage}%` }} />
                </div>
              </>
            ) : (
              <CreditCard className="w-5 h-5 text-indigo-400" />
            )}
          </Link>

          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 p-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-sm z-10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-100">{auth.currentUser?.displayName || "User"}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{isAdmin ? "Admin" : tier}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg">
              {auth.currentUser?.displayName?.[0] || "U"}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
