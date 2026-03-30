import { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { LogIn, Loader2, Mail } from "lucide-react";
import { motion } from "motion/react";
import { handleFirestoreError, OperationType } from "../lib/utils";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [howDidYouFindUs, setHowDidYouFindUs] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showFirebaseLink, setShowFirebaseLink] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }

      if (userSnap && !userSnap.exists()) {
        // Create new user profile
        const userData = {
          id: user.uid,
          email: user.email,
          fullName: user.displayName,
          avatarUrl: user.photoURL,
          subscriptionTier: "free",
          apiCreditsRemaining: 50,
          createdAt: new Date().toISOString(),
        };
        try {
          await setDoc(userRef, userData);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      }

      navigate("/dashboard/radar");
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        console.log("Sign-in popup closed by user.");
      } else if (error.code === "auth/unauthorized-domain") {
        console.error("Auth error:", error);
        setErrorMsg("This domain is not authorized for Firebase Auth. Please add this app's URL to the Authorized Domains in your Firebase Console.");
      } else {
        console.error("Auth error:", error);
        setErrorMsg(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setShowFirebaseLink(false);

    try {
      let user;
      if (isSignUp) {
        if (password !== confirmPassword) {
          setErrorMsg("Passwords do not match.");
          setLoading(false);
          return;
        }
        if (!acceptedTerms) {
          setErrorMsg("You must accept the Terms and Conditions and Privacy Policy.");
          setLoading(false);
          return;
        }

        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;
        
        const userRef = doc(db, "users", user.uid);
        const userData = {
          id: user.uid,
          email: user.email,
          fullName: user.email?.split('@')[0] || "User",
          avatarUrl: null,
          country: country,
          phone: phone,
          howDidYouFindUs: howDidYouFindUs,
          subscriptionTier: "free",
          apiCreditsRemaining: 50,
          createdAt: new Date().toISOString(),
        };
        try {
          await setDoc(userRef, userData);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
      }
      navigate("/dashboard/radar");
    } catch (error: any) {
      console.error("Email auth error:", error);
      if (error.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already registered. Please log in instead.");
      } else if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        setErrorMsg("Invalid email or password.");
      } else if (error.code === "auth/weak-password") {
        setErrorMsg("Password should be at least 6 characters.");
      } else if (error.code === "auth/operation-not-allowed") {
        setErrorMsg("Email/password accounts are not enabled. You must enable this provider in your Firebase Console to continue.");
        setShowFirebaseLink(true);
      } else {
        setErrorMsg(error.message || "An error occurred during authentication.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
            <span className="font-bold text-3xl">N</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2 tracking-tight">Niche Raddar</h1>
          <p className="text-slate-400 text-center">Spot the trend. Generate the hook. Lock the content. Monetize the traffic.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center flex flex-col gap-2">
            <span>{errorMsg}</span>
            {showFirebaseLink && (
              <a 
                href="https://console.firebase.google.com/project/proj-c829a/authentication/providers" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-medium transition-colors border border-red-500/30"
              >
                Open Firebase Console →
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          {isSignUp && (
            <>
              <div>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <select
                  value={howDidYouFindUs}
                  onChange={(e) => setHowDidYouFindUs(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
                >
                  <option value="" disabled>How did you find us?</option>
                  <option value="google">Google Search</option>
                  <option value="social_media">Social Media</option>
                  <option value="friend">Friend / Referral</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-start gap-3 mt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                />
                <label htmlFor="terms" className="text-sm text-slate-400">
                  I accept the <a href="/terms" className="text-indigo-400 hover:underline">Terms and Conditions</a> and have read the <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a>.
                </label>
              </div>
            </>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Mail className="w-5 h-5" />
                <span>{isSignUp ? "Sign Up" : "Log In"}</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 mb-6 text-sm">
          <span className="text-slate-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-slate-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors border border-slate-700"
        >
          <LogIn className="w-5 h-5" />
          <span>Google</span>
        </button>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Secure authentication powered by Firebase.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
