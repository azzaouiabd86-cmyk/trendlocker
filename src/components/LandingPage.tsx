import { Link } from "react-router-dom";
import { TrendingUp, Target, Zap, Shield, Star, ChevronRight, BarChart3, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-900 selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold tracking-wider uppercase">Niche Raddar</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8 text-lg">
              <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
              <a href="#reviews" className="hover:text-blue-400 transition-colors">Reviews</a>
              <Link to="/pricing" className="hover:text-blue-400 transition-colors">Pricing</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-lg hover:text-blue-400 transition-colors hidden sm:block">Login</Link>
              <Link to="/login" className="bg-blue-900 text-white px-6 py-2.5 rounded-md hover:bg-blue-800 transition-all font-semibold tracking-wide flex items-center gap-2">
                Get Started <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden py-24 sm:py-32 lg:pb-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-300 mb-8">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-semibold tracking-wider uppercase">The #1 Trend Discovery Tool</span>
          </div>
          <h2 className="text-5xl sm:text-7xl font-bold mb-8 leading-tight tracking-tight">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Trending Niches</span><br />
            Before Anyone Else
          </h2>
          <p className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Stop guessing. Start scaling. Get real-time, data-driven insights to find high-converting niches, generate lead magnets, and dominate your market.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <Link to="/login" className="w-full sm:w-auto bg-blue-600 px-8 py-4 text-xl rounded-md hover:bg-blue-500 transition-all font-bold tracking-wide shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              Start Scanning Now
            </Link>
            <Link to="/pricing" className="w-full sm:w-auto bg-transparent border border-blue-800 px-8 py-4 text-xl rounded-md hover:bg-blue-900/30 transition-all font-bold tracking-wide">
              View Pricing
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#050505] border-y border-blue-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h3 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">Everything You Need to Win</h3>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Powerful tools designed for marketers, creators, and entrepreneurs who want an unfair advantage.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "Real-Time Global Data", desc: "Monitor trends across TikTok, Google, and Reddit as they happen." },
              { icon: Target, title: "Laser-Targeted Niches", desc: "Filter by vertical and geography to find exactly what your audience wants." },
              { icon: Zap, title: "Instant Lead Magnets", desc: "Use AI to instantly generate high-converting lead magnets for any trend." },
              { icon: BarChart3, title: "Virality Scoring", desc: "Proprietary algorithms score trends based on momentum and search volume." },
              { icon: Shield, title: "Data-Driven Decisions", desc: "Eliminate the guesswork and base your campaigns on hard data." },
              { icon: TrendingUp, title: "First-Mover Advantage", desc: "Spot the wave before it peaks and establish your authority early." }
            ].map((feature, idx) => (
              <div key={idx} className="bg-black border border-blue-900/50 p-8 rounded-xl hover:border-blue-500/50 transition-colors group">
                <div className="w-14 h-14 bg-blue-900/30 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h4 className="text-2xl font-bold mb-4 tracking-wide">{feature.title}</h4>
                <p className="text-gray-400 text-lg leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl sm:text-5xl font-bold mb-16 text-center tracking-tight">Trusted by Top Marketers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah Jenkins", role: "E-com Founder", text: "Niche Raddar helped me find a micro-trend in the pet space that generated $40k in its first month. Absolutely invaluable tool." },
              { name: "Marcus Thorne", role: "Affiliate Marketer", text: "The AI lead magnet generator alone is worth 10x the subscription price. It saves me hours of research and writing every week." },
              { name: "Elena Rodriguez", role: "Content Creator", text: "I use this daily to plan my TikTok content. My engagement has skyrocketed since I started riding the trends Niche Raddar finds." }
            ].map((review, idx) => (
              <div key={idx} className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 p-8 rounded-xl">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-blue-500 text-blue-500" />)}
                </div>
                <p className="text-xl text-gray-300 mb-8 italic">"{review.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-xl font-bold">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-lg font-bold">{review.name}</h5>
                    <p className="text-blue-400">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-900/20 border-t border-blue-900/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-5xl font-bold mb-8 tracking-tight">Ready to find your next winning niche?</h3>
          <p className="text-2xl text-gray-300 mb-10">Join thousands of marketers who are already using Niche Raddar to scale their businesses.</p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-blue-600 px-10 py-5 text-2xl rounded-md hover:bg-blue-500 transition-all font-bold tracking-wide shadow-[0_0_30px_rgba(37,99,235,0.4)]">
            Create Your Free Account <ChevronRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-blue-900/50 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold tracking-wider uppercase">Niche Raddar</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-lg text-gray-400">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link>
          </div>
          <p className="text-gray-500 text-lg">&copy; {new Date().getFullYear()} Niche Raddar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
