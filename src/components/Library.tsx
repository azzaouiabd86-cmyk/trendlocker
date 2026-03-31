import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { GeneratedAsset } from "../types";
import { 
  FileText, 
  Video, 
  Layout as LayoutIcon, 
  MousePointer2, 
  Clock, 
  Loader2,
  Trash2,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { handleFirestoreError, OperationType } from "../lib/utils";

export default function Library() {
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "generated_assets"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assetData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GeneratedAsset[];
      
      // Sort client-side to avoid needing a composite index
      assetData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAssets(assetData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "generated_assets");
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video_script': return Video;
      case 'landing_page_copy': return LayoutIcon;
      case 'cta_copy': return MousePointer2;
      default: return FileText;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-50 mb-3 tracking-tight">My Library</h1>
        <p className="text-slate-400 text-lg">Your saved campaigns and generated assets.</p>
      </div>
      
      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-900 border border-slate-800 rounded-3xl border-dashed">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-500 font-medium">No saved assets yet. Start by scanning for trends!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {assets.map((asset) => {
              const Icon = getIcon(asset.assetType);
              return (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 line-clamp-1">{asset.title}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleCopy(asset.content, asset.id)}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-all"
                        title="Copy content"
                      >
                        {copiedId === asset.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 max-h-40 overflow-y-auto">
                    <p className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                      {asset.content}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
