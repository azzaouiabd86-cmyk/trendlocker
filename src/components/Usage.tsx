import { Activity, CreditCard, TrendingUp, BarChart3, Zap, ArrowUpCircle, CheckCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs, getCountFromServer } from "firebase/firestore";

export default function Usage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scansUsed, setScansUsed] = useState(0);
  const [campaignsUsed, setCampaignsUsed] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }

          // Fetch scans used today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const scansQuery = query(
            collection(db, "trend_snapshots"),
            where("userId", "==", user.uid),
            where("createdAt", ">=", today.toISOString()),
            where("createdAt", "<", tomorrow.toISOString())
          );
          const scansSnapshot = await getCountFromServer(scansQuery);
          setScansUsed(scansSnapshot.data().count);

          // Fetch campaigns used (generated assets)
          const campaignsQuery = query(
            collection(db, "generated_assets"),
            where("userId", "==", user.uid)
          );
          const campaignsSnapshot = await getCountFromServer(campaignsQuery);
          setCampaignsUsed(campaignsSnapshot.data().count);

          // Build recent activity
          const recentScansQuery = query(
            collection(db, "trend_snapshots"),
            where("userId", "==", user.uid)
          );
          const recentScansDocs = await getDocs(recentScansQuery);
          
          const recentCampaignsQuery = query(
            collection(db, "generated_assets"),
            where("userId", "==", user.uid)
          );
          const recentCampaignsDocs = await getDocs(recentCampaignsQuery);

          const activities: any[] = [];
          
          // Group trend scans by minute to represent a single scan action
          const scanGroups: { [key: string]: any } = {};
          recentScansDocs.docs.forEach(doc => {
            const data = doc.data();
            if (!data.createdAt) return;
            const timeKey = data.createdAt.substring(0, 16); // Group by YYYY-MM-DDTHH:mm
            if (!scanGroups[timeKey]) {
              scanGroups[timeKey] = {
                action: "Trend Scan",
                trend: data.vertical ? data.vertical.replace('_', ' ') : "General",
                credits: -1,
                date: new Date(data.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                createdAt: data.createdAt,
                isPositive: false
              };
            }
          });
          Object.values(scanGroups).forEach(group => activities.push(group));

          // Add generated assets
          recentCampaignsDocs.docs.forEach(doc => {
            const data = doc.data();
            if (!data.createdAt) return;
            activities.push({
              action: `Generated ${data.assetType ? data.assetType.replace('_', ' ') : 'Asset'}`,
              trend: data.title || "Asset",
              credits: -1,
              date: new Date(data.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              createdAt: data.createdAt,
              isPositive: false
            });
          });

          // Sort by newest first and take top 10
          activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRecentActivity(activities.slice(0, 10));

        } catch (error) {
          console.error("Error fetching usage data:", error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const tier = userData?.subscriptionTier || 'starter';
  const credits = userData?.apiCreditsRemaining ?? 15;
  const maxCredits = tier === 'agency' ? 5000 : (tier === 'pro' ? 500 : 15);
  
  const maxScans = tier === 'agency' ? 'Unlimited' : (tier === 'pro' ? 25 : 1);
  const maxCampaigns = tier === 'agency' ? 'Unlimited' : (tier === 'pro' ? 100 : 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {sessionId && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-400">Payment Successful!</h3>
            <p className="text-slate-300">Thank you for upgrading. Your account is being updated.</p>
          </div>
        </div>
      )}

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
          <p className="text-sm text-slate-500">{tier === 'starter' ? 'Lifetime credits (No reset)' : 'Resets in 12 days'}</p>
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
          {tier === 'starter' && <p className="text-sm text-slate-500">Upgrade to Pro for 500 monthly credits</p>}
          {tier === 'pro' && <p className="text-sm text-slate-500">Upgrade to Agency for unlimited campaigns</p>}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
          <button className="text-sm text-indigo-400 hover:text-indigo-300">View All</button>
        </div>
        
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No recent activity found. Start scanning trends to see your usage here!
            </div>
          ) : (
            recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    {item.isPositive ? <CreditCard className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-200 capitalize">{item.action}</p>
                    <p className="text-sm text-slate-500 capitalize">{item.trend}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${item.isPositive ? 'text-emerald-400' : 'text-slate-300'}`}>{item.credits} Credits</p>
                  <p className="text-sm text-slate-500">{item.date}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
