import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Gamepad2, 
  Sparkles, 
  Code, 
  Coins, 
  HeartPulse, 
  GraduationCap, 
  ShoppingBag, 
  PlayCircle,
  Search,
  Loader2,
  Globe,
  ChevronRight
} from "lucide-react";
import { motion } from "motion/react";
import { generateTrends } from "../services/geminiService";
import { db, auth } from "../firebase";
import { collection, addDoc, doc, updateDoc, increment, getDoc, query, where, getCountFromServer } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/utils";
import { smartModelRouter } from "../lib/smartRouter";

const verticals = [
  { id: 'mobile_gaming', name: 'Mobile Gaming', icon: Gamepad2, color: 'bg-indigo-500' },
  { id: 'beauty_cosmetics', name: 'Beauty & Cosmetics', icon: Sparkles, color: 'bg-pink-500' },
  { id: 'software_saas', name: 'Software & SaaS', icon: Code, color: 'bg-blue-500' },
  { id: 'finance_crypto', name: 'Finance & Crypto', icon: Coins, color: 'bg-emerald-500' },
  { id: 'health_fitness', name: 'Health & Fitness', icon: HeartPulse, color: 'bg-red-500' },
  { id: 'education_courses', name: 'Education & Courses', icon: GraduationCap, color: 'bg-amber-500' },
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingBag, color: 'bg-orange-500' },
  { id: 'entertainment', name: 'Entertainment', icon: PlayCircle, color: 'bg-purple-500' },
];

const geos = [
  { id: 'global', name: 'Global', flag: '🌍' },
  { id: 'us', name: 'United States', flag: '🇺🇸' },
  { id: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
  { id: 'fr', name: 'France', flag: '🇫🇷' },
  { id: 'de', name: 'Germany', flag: '🇩🇪' },
  { id: 'es', name: 'Spain', flag: '🇪🇸' },
  { id: 'it', name: 'Italy', flag: '🇮🇹' },
];

export default function NicheRadar() {
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);
  const [selectedGeo, setSelectedGeo] = useState('global');
  const [loading, setLoading] = useState(false);
  const [userTier, setUserTier] = useState('starter');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserTier(userDoc.data().subscriptionTier || 'starter');
        }
      }
    };
    fetchUser();
  }, []);

  const handleScan = async () => {
    if (!selectedVertical || !auth.currentUser) return;

    // Check limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const scansQuery = query(
      collection(db, "trend_snapshots"),
      where("userId", "==", auth.currentUser.uid),
      where("createdAt", ">=", today.toISOString()),
      where("createdAt", "<", tomorrow.toISOString())
    );
    const snapshot = await getCountFromServer(scansQuery);
    const scansToday = snapshot.data().count;
    
    // Starter: 1/day, Pro: 25/day, Agency: Unlimited
    const limit = userTier === 'agency' ? Infinity : (userTier === 'pro' ? 25 : 1);
    
    if (scansToday >= limit) {
      alert("You have reached your daily limit for trend scans. Upgrade your plan for more scans!");
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/trends/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vertical: selectedVertical, geo: selectedGeo })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate trends');
      }

      navigate("/dashboard/trends");
    } catch (error: any) {
      console.error("Scan error:", error);
      alert(error.message || "Failed to scan trends. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-50 mb-3 tracking-tight">Niche Radar</h1>
        <p className="text-slate-400 text-lg">Configure your intelligence parameters to discover high-velocity trends.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vertical Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-200">Select Vertical</h2>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Step 1 of 2</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {verticals.map((v) => {
              const Icon = v.icon;
              const isSelected = selectedVertical === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVertical(v.id)}
                  className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-4 group ${
                    isSelected 
                      ? "bg-indigo-600/10 border-indigo-600 shadow-lg shadow-indigo-500/10" 
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${v.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`font-bold ${isSelected ? "text-indigo-400" : "text-slate-300"}`}>{v.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* GEO & Scan */}
        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-200">Target GEO</h2>
                <Globe className="w-5 h-5 text-indigo-400" />
              </div>
              
              <div className="space-y-2">
                {geos.map((g) => {
                  const isStarter = userTier === 'starter';
                  const isRestrictedGeo = isStarter && g.id !== 'global' && g.id !== 'us';
                  
                  return (
                    <button
                      key={g.id}
                      onClick={() => !isRestrictedGeo && setSelectedGeo(g.id)}
                      disabled={isRestrictedGeo}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isRestrictedGeo ? "opacity-50 cursor-not-allowed bg-slate-900 border-slate-800" :
                        selectedGeo === g.id 
                          ? "bg-indigo-600/10 border-indigo-600 text-indigo-400" 
                          : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{g.flag}</span>
                        <span className="font-medium">{g.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isRestrictedGeo && <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Pro</span>}
                        {selectedGeo === g.id && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleScan}
              disabled={!selectedVertical || loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Search className="w-6 h-6" />
                  <span>Scan for Trends</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <span className="text-amber-500 text-xl font-bold">!</span>
            </div>
            <div>
              <p className="text-amber-200 font-bold mb-1">Pro Tip</p>
              <p className="text-amber-200/60 text-sm leading-relaxed">
                Mobile Gaming trends in Tier 1 Europe currently have the highest conversion rates for content lockers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
