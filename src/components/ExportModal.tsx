import { useState } from "react";
import { X, FileText, Download, FileJson, FileCode, File } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  tier: string;
}

export default function ExportModal({ isOpen, onClose, content, title, tier }: ExportModalProps) {
  const [format, setFormat] = useState<'markdown' | 'pdf' | 'json' | 'html'>('markdown');

  if (!isOpen) return null;

  const handleExport = () => {
    let exportContent = content;
    let mimeType = "text/markdown";
    let extension = "md";

    if (format === 'json') {
      exportContent = JSON.stringify({ title, content }, null, 2);
      mimeType = "application/json";
      extension = "json";
    } else if (format === 'html') {
      exportContent = `<!DOCTYPE html><html><head><title>${title}</title></head><body>${content.replace(/\\n/g, '<br/>')}</body></html>`;
      mimeType = "text/html";
      extension = "html";
    } else if (format === 'pdf') {
      // Basic placeholder for PDF export, usually requires a library like jspdf
      alert("PDF export requires a backend service or additional client-side library. Exporting as TXT instead.");
      mimeType = "text/plain";
      extension = "txt";
    }

    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-50">Export Asset</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 mb-8">
            <button
              onClick={() => setFormat('markdown')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                format === 'markdown' ? "bg-indigo-600/10 border-indigo-600 text-indigo-400" : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <FileText className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold">Markdown (.md)</div>
                <div className="text-xs opacity-70">Best for Notion, GitHub, and text editors</div>
              </div>
            </button>

            <button
              onClick={() => setFormat('pdf')}
              disabled={tier === 'free'}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                tier === 'free' ? "opacity-50 cursor-not-allowed bg-slate-800/20 border-slate-800 text-slate-500" :
                format === 'pdf' ? "bg-indigo-600/10 border-indigo-600 text-indigo-400" : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <File className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold flex items-center gap-2">
                  PDF Document 
                  {tier === 'free' && <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">Pro+</span>}
                </div>
                <div className="text-xs opacity-70">Best for sharing and printing</div>
              </div>
            </button>

            <button
              onClick={() => setFormat('json')}
              disabled={tier === 'free'}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                tier === 'free' ? "opacity-50 cursor-not-allowed bg-slate-800/20 border-slate-800 text-slate-500" :
                format === 'json' ? "bg-indigo-600/10 border-indigo-600 text-indigo-400" : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <FileJson className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold flex items-center gap-2">
                  JSON Data
                  {tier === 'free' && <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">Pro+</span>}
                </div>
                <div className="text-xs opacity-70">Best for developers and API integration</div>
              </div>
            </button>

            <button
              onClick={() => setFormat('html')}
              disabled={tier !== 'agency'}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                tier !== 'agency' ? "opacity-50 cursor-not-allowed bg-slate-800/20 border-slate-800 text-slate-500" :
                format === 'html' ? "bg-indigo-600/10 border-indigo-600 text-indigo-400" : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <FileCode className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold flex items-center gap-2">
                  HTML Code
                  {tier !== 'agency' && <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">Agency</span>}
                </div>
                <div className="text-xs opacity-70">Best for direct website embedding</div>
              </div>
            </button>
          </div>

          <button
            onClick={handleExport}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download {format.toUpperCase()}</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
