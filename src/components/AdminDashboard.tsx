import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { 
  Users, 
  Activity, 
  Search, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Globe, 
  ArrowRightLeft,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    dau: 0,
    arpu: 0,
    grossMargin: 0,
    userTiers: [
      { name: 'Free', value: 0, color: '#94a3b8' },
      { name: 'Pro', value: 0, color: '#3b82f6' },
      { name: 'Agency', value: 0, color: '#8b5cf6' },
    ],
    assetTypes: [
      { name: 'Scripts', value: 0, color: '#10b981' },
      { name: 'Landing Pages', value: 0, color: '#f59e0b' },
      { name: 'CTAs', value: 0, color: '#ef4444' },
    ],
    scanVolume: [
      { name: 'Mon', scans: 0 },
      { name: 'Tue', scans: 0 },
      { name: 'Wed', scans: 0 },
      { name: 'Thu', scans: 0 },
      { name: 'Fri', scans: 0 },
      { name: 'Sat', scans: 0 },
      { name: 'Sun', scans: 0 },
    ],
    popularVerticals: [] as {name: string, volume: number}[],
    popularGeos: [] as {name: string, volume: number}[],
    popularCountries: [] as {name: string, users: number}[],
    totalScansDaily: 0,
    totalScansWeekly: 0,
    totalScansMonthly: 0,
    totalAssets: 0,
    aiCostPerUser: 0,
    conversionFreeToPro: 0,
    conversionProToAgency: 0
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          const isHardcodedAdmin = user.email === 'azzaouiabd86@gmail.com' && user.emailVerified;
          
          if (idTokenResult.claims.admin || isHardcodedAdmin) {
            setIsAdmin(true);
            fetchDashboardData();
          } else {
            setIsAdmin(false);
            setLoading(false);
          }
        } catch (error) {
          console.error("Error fetching custom claims:", error);
          const isHardcodedAdmin = user.email === 'azzaouiabd86@gmail.com' && user.emailVerified;
          if (isHardcodedAdmin) {
            setIsAdmin(true);
            fetchDashboardData();
          } else {
            setIsAdmin(false);
            setLoading(false);
          }
        }
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch Users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map(doc => doc.data());
      
      let freeCount = 0;
      let proCount = 0;
      let agencyCount = 0;
      let dauCount = 0;
      const countryCounts: Record<string, number> = {};
      
      const today = new Date().toISOString().split('T')[0];

      users.forEach(user => {
        if (user.subscriptionTier === 'pro') proCount++;
        else if (user.subscriptionTier === 'agency') agencyCount++;
        else freeCount++;

        if (user.lastLoginAt && new Date(user.lastLoginAt).toISOString().split('T')[0] === today) {
          dauCount++;
        }

        if (user.country) {
          const countryName = user.country.trim();
          if (countryName) {
            countryCounts[countryName] = (countryCounts[countryName] || 0) + 1;
          }
        }
      });
      
      const popularCountries = Object.entries(countryCounts)
        .map(([name, users]) => ({ name, users }))
        .sort((a, b) => b.users - a.users)
        .slice(0, 5);

      const totalUsers = users.length;
      
      // Fetch Trend Scans
      const scansSnapshot = await getDocs(collection(db, "trend_snapshots"));
      const scans = scansSnapshot.docs.map(doc => doc.data());
      
      const verticalCounts: Record<string, number> = {};
      const geoCounts: Record<string, number> = {};
      let scansAiCost = 0;
      
      scans.forEach(scan => {
        if (scan.vertical) {
          verticalCounts[scan.vertical] = (verticalCounts[scan.vertical] || 0) + 1;
        }
        if (scan.geoTarget) {
          geoCounts[scan.geoTarget] = (geoCounts[scan.geoTarget] || 0) + 1;
        }
        if (scan.estimatedCost) {
          scansAiCost += scan.estimatedCost;
        }
      });
      
      const popularVerticals = Object.entries(verticalCounts)
        .map(([name, volume]) => ({ name, volume }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);
        
      const popularGeos = Object.entries(geoCounts)
        .map(([name, volume]) => ({ name, volume }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);
        
      // Fetch Generated Assets
      const assetsSnapshot = await getDocs(collection(db, "generated_assets"));
      const assets = assetsSnapshot.docs.map(doc => doc.data());
      
      let scriptsCount = 0;
      let landingPagesCount = 0;
      let ctasCount = 0;
      let assetsAiCost = 0;
      
      assets.forEach(asset => {
        if (asset.assetType === 'video_script') scriptsCount++;
        else if (asset.assetType === 'landing_page_copy') landingPagesCount++;
        else if (asset.assetType === 'cta_copy') ctasCount++;
        
        if (asset.estimatedCost) {
          assetsAiCost += asset.estimatedCost;
        }
      });
      
      const totalAssets = assets.length;
      
      // Calculate derived metrics
      const dau = dauCount; 
      
      // Calculate Revenue (Mock calculation based on tiers)
      const monthlyRevenue = (proCount * 4.99) + (agencyCount * 29);
      const arpu = totalUsers > 0 ? monthlyRevenue / totalUsers : 0;
      
      // Calculate AI Cost
      const totalAiCost = scansAiCost + assetsAiCost;
      const aiCostPerUser = totalUsers > 0 ? totalAiCost / totalUsers : 0;
      
      // Gross Margin = (Rev - Cost) / Rev
      const grossMargin = monthlyRevenue > 0 ? ((monthlyRevenue - totalAiCost) / monthlyRevenue) * 100 : 0;
      
      // Conversions
      const conversionFreeToPro = freeCount > 0 ? (proCount / freeCount) * 100 : 0;
      const conversionProToAgency = proCount > 0 ? (agencyCount / proCount) * 100 : 0;

      // Calculate scan volume by day of week
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const scanVolumeMap: Record<string, number> = {
        'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
      };

      scans.forEach(scan => {
        if (scan.createdAt) {
          const date = new Date(scan.createdAt);
          const dayName = daysOfWeek[date.getDay()];
          scanVolumeMap[dayName]++;
        }
      });

      const scanVolume = [
        { name: 'Mon', scans: scanVolumeMap['Mon'] },
        { name: 'Tue', scans: scanVolumeMap['Tue'] },
        { name: 'Wed', scans: scanVolumeMap['Wed'] },
        { name: 'Thu', scans: scanVolumeMap['Thu'] },
        { name: 'Fri', scans: scanVolumeMap['Fri'] },
        { name: 'Sat', scans: scanVolumeMap['Sat'] },
        { name: 'Sun', scans: scanVolumeMap['Sun'] },
      ];

      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000;
      let dailyScans = 0;
      let weeklyScans = 0;
      let monthlyScans = 0;

      scans.forEach(scan => {
        if (scan.createdAt) {
          const scanDate = new Date(scan.createdAt);
          const diffDays = Math.round(Math.abs((now.getTime() - scanDate.getTime()) / oneDay));
          if (diffDays <= 1) dailyScans++;
          if (diffDays <= 7) weeklyScans++;
          if (diffDays <= 30) monthlyScans++;
        }
      });

      setMetrics({
        totalUsers,
        dau,
        arpu,
        grossMargin,
        userTiers: [
          { name: 'Free', value: freeCount, color: '#94a3b8' },
          { name: 'Pro', value: proCount, color: '#3b82f6' },
          { name: 'Agency', value: agencyCount, color: '#8b5cf6' },
        ],
        assetTypes: [
          { name: 'Scripts', value: scriptsCount, color: '#10b981' },
          { name: 'Landing Pages', value: landingPagesCount, color: '#f59e0b' },
          { name: 'CTAs', value: ctasCount, color: '#ef4444' },
        ],
        scanVolume,
        popularVerticals,
        popularGeos,
        popularCountries,
        totalScansDaily: dailyScans,
        totalScansWeekly: weeklyScans,
        totalScansMonthly: monthlyScans,
        totalAssets,
        aiCostPerUser,
        conversionFreeToPro,
        conversionProToAgency
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin === null) return null;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-white">Access Denied</h2>
        <p className="text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-400">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Internal analytics and platform metrics.</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Users</h3>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{metrics.totalUsers.toLocaleString()}</div>
          <div className="text-sm text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> Real-time
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Daily Active Users</h3>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{metrics.dau.toLocaleString()}</div>
          <div className="text-sm text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> ~25% DAU/MAU
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">ARPU</h3>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">${metrics.arpu.toFixed(2)}</div>
          <div className="text-sm text-slate-400">Revenue per User</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Gross Margin</h3>
            <PieChart className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{metrics.grossMargin.toFixed(1)}%</div>
          <div className="text-sm text-slate-400">Rev - AI - Infra / Rev</div>
        </div>
      </div>

      {/* Middle Section: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Tiers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Users by Tier</h3>
          <div className="h-64">
            {metrics.totalUsers > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={metrics.userTiers}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {metrics.userTiers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No user data available</div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {metrics.userTiers.map(tier => (
              <div key={tier.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                <span className="text-sm text-slate-300">{tier.name} ({tier.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trend Scans */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Total Trend Scans</h3>
            <div className="flex gap-4 text-sm">
              <span className="text-slate-400">Daily: <strong className="text-white">{metrics.totalScansDaily.toLocaleString()}</strong></span>
              <span className="text-slate-400">Weekly: <strong className="text-white">{metrics.totalScansWeekly.toLocaleString()}</strong></span>
              <span className="text-slate-400">Monthly: <strong className="text-white">{metrics.totalScansMonthly.toLocaleString()}</strong></span>
            </div>
          </div>
          <div className="h-64">
            {metrics.totalScansMonthly > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.scanVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                  />
                  <Bar dataKey="scans" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No scan data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Lists & More KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assets Generated */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" /> Assets Generated
          </h3>
          <div className="space-y-4">
            {metrics.totalAssets > 0 ? metrics.assetTypes.map(asset => (
              <div key={asset.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{asset.name}</span>
                  <span className="font-bold text-white">{asset.value.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full" style={{ width: `${(asset.value / Math.max(metrics.totalAssets, 1)) * 100}%`, backgroundColor: asset.color }} />
                </div>
              </div>
            )) : (
              <div className="text-slate-500 text-center py-4">No assets generated yet</div>
            )}
          </div>
        </div>

        {/* Popular Verticals & GEOs & Countries */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" /> Demographics & Targets
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">User Countries</h4>
              <div className="space-y-2">
                {metrics.popularCountries.length > 0 ? metrics.popularCountries.map((c, i) => (
                  <div key={c.name} className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">{i + 1}. {c.name}</span>
                    <span className="text-slate-500">{c.users.toLocaleString()} users</span>
                  </div>
                )) : (
                  <div className="text-slate-500 text-sm">No data</div>
                )}
              </div>
            </div>
            <div className="border-t border-slate-800 pt-4">
              <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Top Verticals (Scans)</h4>
              <div className="space-y-2">
                {metrics.popularVerticals.length > 0 ? metrics.popularVerticals.map((v, i) => (
                  <div key={v.name} className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">{i + 1}. {v.name}</span>
                    <span className="text-slate-500">{v.volume.toLocaleString()} scans</span>
                  </div>
                )) : (
                  <div className="text-slate-500 text-sm">No data</div>
                )}
              </div>
            </div>
            <div className="border-t border-slate-800 pt-4">
              <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Top Geos (Scans)</h4>
              <div className="space-y-2">
                {metrics.popularGeos.length > 0 ? metrics.popularGeos.map((g, i) => (
                  <div key={g.name} className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">{i + 1}. {g.name}</span>
                    <span className="text-slate-500">{g.volume.toLocaleString()} scans</span>
                  </div>
                )) : (
                  <div className="text-slate-500 text-sm">No data</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Unit Economics & Conversion */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-400" /> Economics & Conversion
          </h3>
          <div className="space-y-6">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">AI Cost per User</span>
                <span className="text-white font-bold">${metrics.aiCostPerUser.toFixed(4)}</span>
              </div>
              <p className="text-xs text-slate-500">Total Gemini API spend / Active Users</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Conversion Rates</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Free → Pro</span>
                    <span className="font-bold text-emerald-400">{metrics.conversionFreeToPro.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${metrics.conversionFreeToPro}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Pro → Agency</span>
                    <span className="font-bold text-indigo-400">{metrics.conversionProToAgency.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${metrics.conversionProToAgency}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
