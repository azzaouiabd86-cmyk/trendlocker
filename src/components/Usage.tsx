import { Activity, CreditCard, TrendingUp, BarChart3, Zap, ArrowUpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Usage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const tier = userData?.subscriptionTier || 'free';
  const credits = userData?.apiCreditsRemaining ?? 50;
  const maxCredits = tier === 'agency' ? 5000 : tier === 'pro' ? 500 : 50;
  
  // Mock values for scans and campaigns since we don't have real-time counters for them yet
  const scansUsed = 12;
  const maxScans = tier === 'agency' ? 'Unlimited' : tier === 'pro' ? 25 : 3;
  
  const campaignsUsed = 3;
  const maxCampaigns = tier === 'agency' ? 'Unlimited' : tier === 'pro' ? 100 : 5;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Usage & Analytics</h1>
          <p className="text-slate-400">Track your API usage, credits, and campaign performance.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="text-sm text-slate-400">Current Plan:</span>
            <span className="text-sm font-bold text-white uppercase tracking-wider">{tier}</span>
          </div>
          <Link 
            to="/pricing"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Upgrade Plan
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">Loading...</div>}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-300">AI Credits</h3>
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold text-white">{credits}</span>
            <span className="text-slate-500 mb-1">/ {maxCredits}</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, (credits / maxCredits) * 100)}%` }} />
          </div>
          <p className="text-sm text-slate-500">Resets in 12 days</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-300">Trend Scans</h3>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold text-white">{scansUsed}</span>
            <span className="text-slate-500 mb-1">/ {maxScans} daily limit</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: maxScans === 'Unlimited' ? '100%' : `${Math.min(100, (scansUsed / (maxScans as number)) * 100)}%` }} />
          </div>
          <p className="text-sm text-slate-500">Resets in 7 hours</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-300">Saved Campaigns</h3>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold text-white">{campaignsUsed}</span>
            <span className="text-slate-500 mb-1">/ {maxCampaigns} limit</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: maxCampaigns === 'Unlimited' ? '100%' : `${Math.min(100, (campaignsUsed / (maxCampaigns as number)) * 100)}%` }} />
          </div>
          {tier === 'free' && <p className="text-sm text-slate-500">Upgrade to Pro for 100 campaigns</p>}
          {tier === 'pro' && <p className="text-sm text-slate-500">Upgrade to Agency for unlimited campaigns</p>}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
          <button className="text-sm text-indigo-400 hover:text-indigo-300">View All</button>
        </div>
        
        <div className="space-y-4">
          {[
            { action: "Generated Landing Page", trend: "AI Productivity Tools", credits: -5, date: "Today, 10:23 AM" },
            { action: "Trend Scan", trend: "SaaS Marketing", credits: -1, date: "Yesterday, 2:15 PM" },
            { action: "Generated Video Script", trend: "Notion Templates", credits: -3, date: "Mar 27, 4:45 PM" },
            { action: "Monthly Credit Reset", trend: "System", credits: "+50", date: "Mar 25, 12:00 AM", isPositive: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800/50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                  {item.isPositive ? <CreditCard className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-slate-200">{item.action}</p>
                  <p className="text-sm text-slate-500">{item.trend}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${item.isPositive ? 'text-emerald-400' : 'text-slate-300'}`}>{item.credits} Credits</p>
                <p className="text-sm text-slate-500">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
