import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, onFirestoreConnectionChange, testConnection } from "./firebase";
import Layout from "./components/Layout";
import NicheRadar from "./components/NicheRadar";
import TrendFeed from "./components/TrendFeed";
import AssetGenerator from "./components/AssetGenerator";
import Library from "./components/Library";
import Settings from "./components/Settings";
import Usage from "./components/Usage";
import AdminDashboard from "./components/AdminDashboard";
import Auth from "./components/Auth";
import LandingPage from "./components/LandingPage";
import Pricing from "./components/Pricing";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsAndConditions from "./components/TermsAndConditions";
import ContactForm from "./components/ContactForm";
import ErrorBoundary from "./components/ErrorBoundary";
import { Loader2, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    const unsubscribeConn = onFirestoreConnectionChange((offline) => {
      setIsOffline(offline);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeConn();
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    await testConnection();
    setRetrying(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {isOffline && (
        <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-[100] shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              <span className="font-bold">Firestore Connection Error:</span> The client is offline. This usually means the Firestore Database has not been created yet in your Firebase Console.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : 'animate-none'}`} />
              {retrying ? 'Retrying...' : 'Retry'}
            </button>
            <a 
              href="https://console.firebase.google.com/project/proj-c829a/firestore" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-white text-red-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Create Database <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
      <Router>
        <Routes>
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard/radar" />} />
          <Route path="/login" element={!user ? <Auth /> : <Navigate to="/dashboard/radar" />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/contact" element={<ContactForm />} />
          <Route path="/dashboard" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route path="radar" element={<NicheRadar />} />
            <Route path="trends" element={<TrendFeed />} />
            <Route path="generate/:trendId" element={<AssetGenerator />} />
            <Route path="library" element={<Library />} />
            <Route path="settings" element={<Settings />} />
            <Route path="usage" element={<Usage />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route index element={<Navigate to="radar" />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
