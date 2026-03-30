import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
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
import { Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
