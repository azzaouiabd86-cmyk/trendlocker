import { Check, ChevronLeft, Shield, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function Pricing() {
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserTier = async (uid: string) => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          setCurrentTier(userDoc.data().subscriptionTier || "starter");
        } else {
          setCurrentTier("starter");
        }
      } catch (error) {
        console.error("Error fetching user tier:", error);
        setCurrentTier("starter");
      }
      setLoading(false);
    };

    // Listen to auth state changes to fetch tier when user logs in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserTier(user.uid);
      } else {
        setCurrentTier(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const plans = [
    { 
      name: "Starter", 
      id: "starter",
      price: "$0", 
      period: "",
      description: "Explore, Don't Execute",
      services: [
        "15 Lifetime AI Credits (No monthly reset)",
        "1 Trend Scan / Day",
        "View top 3 trends only",
        "US & Global GEO Targeting only",
        "Watermarked PDF Export only",
        "Blurred / Hidden Lead Magnets",
        "1 Team Member"
      ], 
      priceNumber: "0.00",
      highlighted: false,
      isFree: true
    },
    { 
      name: "Pro", 
      id: "pro",
      price: "$4.99", 
      period: "/mo",
      description: "The Affiliate's Arsenal",
      services: [
        "500 Monthly AI Credits",
        "25 Trend Scans / Day",
        "Full feed + Virality scores",
        "Unlocks Tier 1 Europe (FR, DE, UK, etc.)",
        "Export to MD, PDF, JSON",
        "Fully generated Lead Magnets",
        "1 Team Member"
      ], 
      priceNumber: "4.99",
      highlighted: true,
      isFree: false
    },
    { 
      name: "Agency", 
      id: "agency",
      price: "$29", 
      period: "/mo",
      description: "Full Scale Operations",
      services: [
        "5,000 Monthly AI Credits",
        "Unlimited Trend Scans",
        "Full feed + Custom scans",
        "All + Custom GEO Targeting",
        "HTML Landing Pages + API Export",
        "AI Custom Lead Magnet Suggestions",
        "Up to 5 Team Members"
      ], 
      priceNumber: "29.00",
      highlighted: false,
      isFree: false
    },
  ];

  const getButtonText = (planId: string, isFree: boolean, planName: string) => {
    if (!currentTier) {
      return isFree ? "Get Started Free" : `Choose ${planName}`;
    }

    if (currentTier === planId) {
      return "Current Plan";
    }

    const tierOrder = { starter: 0, pro: 1, agency: 2 };
    const currentOrder = tierOrder[currentTier as keyof typeof tierOrder] || 0;
    const planOrder = tierOrder[planId as keyof typeof tierOrder] || 0;

    if (planOrder > currentOrder) {
      return `Upgrade to ${planName}`;
    } else {
      return `Downgrade to ${planName}`;
    }
  };

  const handleDowngrade = (planName: string) => {
    // In a real app, this would open a modal to confirm downgrade or redirect to a billing portal
    alert(`To downgrade to ${planName}, please contact support or manage your subscription in the billing portal.`);
  };

  const handleUpgrade = async (planId: string, planName: string) => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    setProcessing(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error("Error upgrading plan:", error);
      alert(`Failed to start checkout process: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-900 selection:text-white pb-24">
      {/* Simple Nav */}
      <nav className="p-6 border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back to Home
          </Link>
          {currentTier && (
            <Link to="/dashboard" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Go to Dashboard
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl sm:text-6xl font-bold mb-6 tracking-tight">Simple, transparent pricing</h2>
          <p className="text-xl text-gray-400">Choose the plan that best fits your needs. Upgrade or downgrade at any time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentTier === plan.id;
            const tierOrder = { starter: 0, pro: 1, agency: 2 };
            const currentOrder = tierOrder[(currentTier || "starter") as keyof typeof tierOrder];
            const planOrder = tierOrder[plan.id as keyof typeof tierOrder];
            const isDowngrade = currentTier && planOrder < currentOrder;
            const isUpgrade = currentTier && planOrder > currentOrder;

            return (
              <div 
                key={plan.name} 
                className={`relative flex flex-col p-8 sm:p-10 rounded-2xl border ${
                  plan.highlighted 
                    ? 'bg-gradient-to-b from-blue-900/40 to-black border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]' 
                    : 'bg-black border-gray-800'
                } ${isCurrentPlan ? 'ring-2 ring-emerald-500' : ''}`}
              >
                {plan.highlighted && !isCurrentPlan && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wider uppercase">
                    Most Popular
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wider uppercase">
                    Current Plan
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 h-12">{plan.description}</p>
                </div>
                
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-6xl font-bold tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-xl text-gray-500 font-medium">{plan.period}</span>}
                </div>
                
                <ul className="mb-10 flex-1 space-y-4">
                  {plan.services.map((service) => (
                    <li key={service} className="flex items-start gap-3 text-lg text-gray-300">
                      <Check className={`w-6 h-6 shrink-0 ${plan.highlighted ? 'text-blue-400' : 'text-gray-500'}`} />
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
                
                {isCurrentPlan ? (
                  <button 
                    disabled
                    className="w-full py-4 rounded-lg text-xl font-bold tracking-wide text-center transition-all flex items-center justify-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : isDowngrade ? (
                  <button 
                    onClick={() => handleDowngrade(plan.name)}
                    className="w-full py-4 rounded-lg text-xl font-bold tracking-wide text-center transition-all flex items-center justify-center gap-2 bg-gray-800 text-gray-300 hover:bg-gray-700"
                  >
                    {getButtonText(plan.id, plan.isFree, plan.name)}
                  </button>
                ) : isUpgrade ? (
                  <button 
                    onClick={() => handleUpgrade(plan.id, plan.name)}
                    disabled={processing}
                    className={`w-full py-4 rounded-lg text-xl font-bold tracking-wide text-center transition-all flex items-center justify-center gap-2 ${
                      plan.highlighted 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    } ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : getButtonText(plan.id, plan.isFree, plan.name)}
                  </button>
                ) : plan.isFree ? (
                  <Link 
                    to="/login"
                    className="w-full py-4 rounded-lg text-xl font-bold tracking-wide text-center transition-all flex items-center justify-center gap-2 bg-gray-800 text-white hover:bg-gray-700"
                  >
                    {getButtonText(plan.id, plan.isFree, plan.name)}
                  </Link>
                ) : (
                  <button 
                    onClick={() => handleUpgrade(plan.id, plan.name)}
                    disabled={processing}
                    className={`w-full py-4 rounded-lg text-xl font-bold tracking-wide text-center transition-all flex items-center justify-center gap-2 ${
                      plan.highlighted 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    } ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : getButtonText(plan.id, plan.isFree, plan.name)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-lg flex items-center justify-center gap-2">
            <Shield className="w-5 h-5" /> Secure payments processed by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
