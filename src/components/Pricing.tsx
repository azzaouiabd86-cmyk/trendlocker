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
          setCurrentTier(userDoc.data().subscriptionTier || "free");
        } else {
          setCurrentTier("free");
        }
      } catch (error) {
        console.error("Error fetching user tier:", error);
        setCurrentTier("free");
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
      name: "Free", 
      id: "free",
      price: "$0", 
      period: "/mo",
      description: "Perfect for getting started and testing the waters.",
      services: [
        "50 Monthly AI Credits",
        "3 Trend Scans / Day",
        "5 Saved Campaigns",
        "Basic AI Model Quality",
        "3 preset Verticals",
        "US, UK, Global GEO Targets",
        "Export to Markdown",
        "1 Team Member"
      ], 
      priceNumber: "0.00",
      highlighted: false,
      isFree: true
    },
    { 
      name: "Pro", 
      id: "pro",
      price: "$29", 
      period: "/mo",
      description: "For serious marketers who want to dominate.",
      services: [
        "500 Monthly AI Credits",
        "25 Trend Scans / Day",
        "100 Saved Campaigns",
        "Standard AI Model Quality",
        "All + custom Verticals",
        "All preset GEO Targets",
        "Export to MD, PDF, JSON",
        "Landing Page Preview",
        "1 Team Member"
      ], 
      priceNumber: "29.00",
      highlighted: true,
      isFree: false
    },
    { 
      name: "Agency", 
      id: "agency",
      price: "$99", 
      period: "/mo",
      description: "For teams and agencies scaling their operations.",
      services: [
        "5,000 Monthly AI Credits",
        "Unlimited Trend Scans",
        "Unlimited Saved Campaigns",
        "Premium AI Model (Gemini Pro)",
        "All + custom Verticals",
        "All + custom GEO Targets",
        "Export to MD, PDF, JSON, HTML",
        "Landing Page Preview + Custom CSS",
        "API Access",
        "Up to 5 Team Members"
      ], 
      priceNumber: "99.00",
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

    const tierOrder = { free: 0, pro: 1, agency: 2 };
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
      // Update the user's tier in Firestore
      const userRef = doc(db, "users", auth.currentUser.uid);
      
      // Calculate new credits based on plan
      const newCredits = planId === 'agency' ? 5000 : planId === 'pro' ? 500 : 50;
      
      await updateDoc(userRef, {
        subscriptionTier: planId,
        apiCreditsRemaining: newCredits,
        updatedAt: new Date().toISOString()
      });
      
      setCurrentTier(planId);
      alert(`Successfully upgraded to ${planName} plan!`);
      navigate('/dashboard');
    } catch (error) {
      console.error("Error upgrading plan:", error);
      alert("Failed to upgrade plan. Please try again.");
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
            const tierOrder = { free: 0, pro: 1, agency: 2 };
            const currentOrder = tierOrder[(currentTier || "free") as keyof typeof tierOrder];
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
                  <span className="text-xl text-gray-500 font-medium">{plan.period}</span>
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
                  <a 
                    href={`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=aeazzaoui@gmail.com&item_name=${encodeURIComponent('NicheRadar ' + plan.name + ' Plan')}&amount=${plan.priceNumber}&currency_code=USD`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-4 rounded-lg text-xl font-bold tracking-wide text-center transition-all flex items-center justify-center gap-2 ${
                      plan.highlighted 
                        ? 'bg-[#FFC439] text-[#003087] hover:bg-[#F2B625]' 
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                  >
                    {plan.highlighted && !currentTier ? (
                      <>
                        Checkout with <span className="font-black italic tracking-tighter">PayPal</span>
                      </>
                    ) : (
                      getButtonText(plan.id, plan.isFree, plan.name)
                    )}
                  </a>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-lg flex items-center justify-center gap-2">
            <Shield className="w-5 h-5" /> Secure payments processed by PayPal
          </p>
        </div>
      </div>
    </div>
  );
}
