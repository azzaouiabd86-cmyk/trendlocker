import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { User } from "firebase/auth";
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  CreditCard, 
  Calendar,
  Loader2,
  Sparkles
} from "lucide-react";
import { handleFirestoreError, OperationType } from "../lib/utils";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  subscriptionTier: string;
  apiCreditsRemaining: number;
  createdAt: string;
}

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}`);
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-50 mb-3 tracking-tight">Settings</h1>
        <p className="text-slate-400 text-lg">Manage your account and subscription.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6">
            <div className="relative inline-block">
              {profile?.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.fullName} 
                  className="w-24 h-24 rounded-full border-4 border-indigo-600/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold">
                  {profile?.fullName?.[0] || profile?.email?.[0] || "U"}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-4 border-slate-900" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-slate-50">{profile?.fullName || "User"}</h2>
              <p className="text-slate-500 text-sm">{profile?.email}</p>
            </div>

            <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Credits</p>
                <p className="text-lg font-bold text-indigo-400">{profile?.apiCreditsRemaining}</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tier</p>
                <p className="text-lg font-bold text-emerald-500 capitalize">{profile?.subscriptionTier}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <span>Account Information</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-slate-300 flex items-center gap-3">
                    <UserIcon className="w-4 h-4 text-slate-600" />
                    <span>{profile?.fullName}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-slate-300 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-600" />
                    <span>{profile?.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Member Since</label>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-slate-300 flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800 space-y-6">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <span>Subscription Plan</span>
              </h2>
              
              <div className="p-6 bg-indigo-600/10 border border-indigo-600 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-indigo-400 font-bold text-lg capitalize">{profile?.subscriptionTier} Plan</p>
                    <p className="text-slate-400 text-sm">You have {profile?.apiCreditsRemaining} intelligence credits remaining this month.</p>
                  </div>
                </div>
                <button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
