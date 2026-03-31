import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot, getDoc, doc } from "firebase/firestore";
import { TrendSnapshot } from "../types";
import { handleFirestoreError, OperationType } from "../lib/utils";
import { 
  TrendingUp, 
  ArrowUpRight, 
  Zap, 
  ExternalLink, 
  Sparkles,
  Loader2,
  ChevronRight,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Link } from "react-router-dom";

export default function TrendFeed() {
  const [trends, setTrends] = useState<TrendSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
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

    const q = query(
      collection(db, "trend_snapshots"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trendData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TrendSnapshot[];
      setTrends(trendData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "trend_snapshots");
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Starter sees top 3 only
  const displayTrends = userTier === 'starter' ? trends.slice(0, 3) : trends;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-50 mb-3 tracking-tight">Trend Discovery</h1>
          <p className="text-slate-400 text-lg">Real-time intelligence feed ranked by virality potential.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Feed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {displayTrends.map((trend, index) => (
            <motion.div
              key={trend.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/50 transition-all shadow-xl hover:shadow-indigo-500/5"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Score & Main Info */}
                <div className="flex-1 flex gap-6">
                  <div className="flex flex-col items-center justify-center w-24 h-24 bg-slate-800 rounded-2xl border border-slate-700 shrink-0 relative overflow-hidden">
                    {userTier === 'starter' && (
                      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                        <Lock className="w-6 h-6 text-slate-500" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-1">Virality</span>
                    <span className={`text-3xl font-black ${
                      trend.viralityScore >= 80 ? "text-red-500" : 
                      trend.viralityScore >= 50 ? "text-amber-500" : "text-emerald-500"
                    }`}>
                      {trend.viralityScore}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full uppercase tracking-widest border border-indigo-500/20">
                        {trend.vertical.replace('_', ' ')}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs font-medium text-slate-500">{new Date(trend.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-100 mb-2 group-hover:text-indigo-400 transition-colors">{trend.trendName}</h3>
                    <p className="text-slate-400 line-clamp-2 text-sm leading-relaxed">{trend.trendDescription}</p>
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-8">
                  <div className="flex-1 grid grid-cols-2 gap-4 relative">
                    {userTier === 'starter' && (
                      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                        <Lock className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Search Δ</p>
                      <div className="flex items-center gap-1 text-emerald-500 font-bold">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>+{trend.searchVolumeDelta}%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Velocity</p>
                      <div className="flex items-center gap-1 text-indigo-400 font-bold">
                        <Zap className="w-4 h-4" />
                        <span>{trend.socialVelocity}/hr</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 relative">
                    {userTier === 'starter' && (
                      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Hidden</span>
                      </div>
                    )}
                    {trend.suggestedLeadMagnets.slice(0, 2).map((lm, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold rounded-md border border-slate-700">
                        {lm}
                      </span>
                    ))}
                  </div>

                  <button 
                    onClick={() => navigate(`/dashboard/generate/${trend.id}`)}
                    className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all group/btn"
                  >
                    <span>Generate Assets</span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {userTier === 'starter' && trends.length > 3 && (
        <div className="mt-8 p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl text-center">
          <Lock className="w-8 h-8 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-100 mb-2">Unlock Full Trend Feed</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">You are currently viewing the top 3 trends. Upgrade to Pro to see the full feed, virality scores, and lead magnets.</p>
          <Link 
            to="/pricing"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-all"
          >
            Upgrade to Pro
          </Link>
        </div>
      )}
    </div>
  );
}
