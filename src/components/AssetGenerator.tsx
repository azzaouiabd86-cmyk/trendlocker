import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, collection, addDoc, updateDoc, increment } from "firebase/firestore";
import { TrendSnapshot } from "../types";
import { handleFirestoreError, OperationType } from "../lib/utils";
import { 
  Video, 
  Layout as LayoutIcon, 
  MousePointer2, 
  Copy, 
  RefreshCw, 
  Check,
  Loader2,
  ArrowLeft,
  Sparkles,
  Download
} from "lucide-react";
import { motion } from "motion/react";
import { generateAssetsStream } from "../services/geminiService";
import { smartModelRouter, RequestType } from "../lib/smartRouter";
import ExportModal from "./ExportModal";

type Tab = 'video_script' | 'landing_page_copy' | 'cta_copy';

export default function AssetGenerator() {
  const { trendId } = useParams();
  const navigate = useNavigate();
  const [trend, setTrend] = useState<TrendSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('video_script');
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Record<Tab, string>>({
    video_script: "",
    landing_page_copy: "",
    cta_copy: ""
  });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [userTier, setUserTier] = useState<string>('free');

  useEffect(() => {
    const fetchTrendAndUser = async () => {
      if (!trendId) return;
      
      try {
        const docRef = doc(db, "trend_snapshots", trendId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTrend({ id: docSnap.id, ...docSnap.data() } as TrendSnapshot);
        }

        if (auth.currentUser) {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserTier(userDoc.data().subscriptionTier || 'free');
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `trend_snapshots/${trendId}`);
      }
    };
    fetchTrendAndUser();
  }, [trendId]);

  const handleGenerate = async () => {
    if (!trend || !auth.currentUser) return;
    setLoading(true);
    setAssets(prev => ({ ...prev, [activeTab]: "" })); // Clear previous content
    try {
      let requestType: RequestType = 'Video Scripts';
      if (activeTab === 'landing_page_copy') requestType = 'Landing Page Copy';
      else if (activeTab === 'cta_copy') requestType = 'CTA Copy';

      const { model, estimatedCost: cost } = await smartModelRouter(auth.currentUser.uid, requestType);
      setModelUsed(model);
      setEstimatedCost(cost);
      
      const stream = generateAssetsStream(model, trend, activeTab, trend.geoTarget);
      
      let fullContent = "";
      for await (const chunk of stream) {
        fullContent += chunk;
        setAssets(prev => ({ ...prev, [activeTab]: fullContent }));
      }

      // Deduct credits (1 credit per generation)
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          apiCreditsRemaining: increment(-1)
        });
      } catch (error) {
        console.error("Error deducting credits:", error);
      }

    } catch (error: any) {
      console.error("Generation error:", error);
      alert(error.message || "Failed to generate assets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!trend || !assets[activeTab]) return;
    setSaving(true);
    try {
      const assetData = {
        campaignId: trendId, // Using trendId as a simple campaignId for now
        userId: auth.currentUser?.uid,
        assetType: activeTab,
        title: `${trend.trendName} - ${activeTab.replace('_', ' ')}`,
        content: assets[activeTab],
        createdAt: new Date().toISOString(),
        modelUsed: modelUsed,
        estimatedCost: estimatedCost
      };
      await addDoc(collection(db, "generated_assets"), assetData);
      alert("Asset saved to library!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "generated_assets");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(assets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!trend) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <button 
        onClick={() => navigate("/dashboard/trends")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-300 mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Trends</span>
      </button>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Info */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Active Trend</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{trend.trendName}</h1>
            <p className="text-sm text-slate-400 leading-relaxed">{trend.trendDescription}</p>
            
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Vertical</span>
                <span className="text-slate-200 font-medium capitalize">{trend.vertical.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Target GEO</span>
                <span className="text-slate-200 font-medium uppercase">{trend.geoTarget}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20">
            <h3 className="font-bold mb-2">Lead Magnet Idea</h3>
            <p className="text-indigo-100 text-sm mb-4">The AI suggests focusing on:</p>
            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <p className="font-bold text-center">{trend.suggestedLeadMagnets[0]}</p>
            </div>
          </div>
        </div>

        {/* Generator Workspace */}
        <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col min-h-[600px] shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/50">
            {[
              { id: 'video_script', name: 'Video Scripts', icon: Video },
              { id: 'landing_page_copy', name: 'Landing Page', icon: LayoutIcon },
              { id: 'cta_copy', name: 'CTA & Locker', icon: MousePointer2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-bold text-sm transition-all border-b-2 ${
                    isActive 
                      ? "text-indigo-400 border-indigo-500 bg-indigo-500/5" 
                      : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 flex flex-col">
            {!assets[activeTab] && !loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-200 mb-2">Ready to Generate</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">Click the button below to generate high-converting {activeTab.replace('_', ' ')} for this trend.</p>
                </div>
                <button 
                  onClick={handleGenerate}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-2xl flex items-center gap-3 transition-all transform active:scale-[0.98]"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Generate Assets</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Generated Content</span>
                    </div>
                    {modelUsed && (
                      <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-md border border-indigo-500/20 uppercase tracking-widest">
                        Model: {modelUsed.replace('gemini-', '')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleCopy}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-all flex items-center gap-2 text-xs font-bold"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? "Copied!" : "Copy All"}</span>
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saving || !assets[activeTab]}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>{saving ? "Saving..." : "Save to Library"}</span>
                    </button>
                    <button 
                      onClick={() => setIsExportModalOpen(true)}
                      disabled={!assets[activeTab]}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                    <button 
                      onClick={handleGenerate}
                      disabled={loading}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                      <span>Regenerate</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-6 font-mono text-sm text-slate-300 leading-relaxed overflow-y-auto whitespace-pre-wrap">
                  {loading ? (
                    <div className="flex items-center gap-2 text-indigo-400 italic">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini is thinking...</span>
                    </div>
                  ) : (
                    assets[activeTab]
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        content={assets[activeTab]}
        title={`${trend.trendName} - ${activeTab.replace('_', ' ')}`}
        tier={userTier}
      />
    </div>
  );
}
