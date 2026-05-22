import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Focus, BrainCircuit, Coffee, Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#64748b", "#10b981", "#f59e0b"];

export default function Dashboard() {
  const [deepWorkScore, setDeepWorkScore] = useState(0);
  const [focusTime, setFocusTime] = useState("0m");
  const [idleTime, setIdleTime] = useState("0m");
  const [fragmentation, setFragmentation] = useState("Low");
  const [appData, setAppData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        
        // Fetch analytics score
        const scoreRes = await fetch(`${apiUrl}/analytics/focus-score`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (scoreRes.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const scoreData = await scoreRes.json();
        
        // Fetch today's activity
        const activityRes = await fetch(`${apiUrl}/activity/today`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const activityData = await activityRes.json();

        // Update state
        setDeepWorkScore(scoreData.deepWorkScore || 0);
        
        const formatTime = (seconds) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          return h > 0 ? `${h}h ${m}m` : `${m}m`;
        };

        setFocusTime(formatTime(scoreData.focusTime || 0));
        setIdleTime(formatTime(scoreData.idleTime || 0));
        setFragmentation(scoreData.fragmented ? "High (Needs Focus)" : "Good (Steady)");

        // Process pie chart data
        const appUsage = {};
        if (Array.isArray(activityData)) {
          activityData.forEach(act => {
            if (!act.isIdle) {
              appUsage[act.appName] = (appUsage[act.appName] || 0) + act.duration;
            }
          });
        }

        const pieData = Object.keys(appUsage)
          .map(name => ({ name, value: appUsage[name] }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // top 5 apps

        if (pieData.length === 0) {
           pieData.push({ name: "No Activity", value: 1 }); // fallback
        }

        setAppData(pieData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-textMuted">Loading your dashboard...</div>;
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SignalPulse
          </h1>
          <p className="text-textMuted mt-1">Your digital wellness overview</p>
        </div>
        <div className="flex items-center space-x-4">
          <a 
            href="/Signal Pulse Tracker Setup.exe"
            download
            className="flex items-center text-sm bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-primary/25 mr-2"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Tracker
          </a>
          <button 
            onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}
            className="text-sm text-textMuted hover:text-white transition-colors mr-4"
          >
            Logout
          </button>
          <div className="px-4 py-2 rounded-full glass-panel text-sm font-medium">
            <span className="text-emerald-400 mr-2">●</span> Tracker Active
          </div>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Deep Work Score" value={deepWorkScore} icon={<BrainCircuit className="w-6 h-6 text-accent" />} trend="Daily stat" />
        <MetricCard title="Focus Time" value={focusTime} icon={<Focus className="w-6 h-6 text-primary" />} trend="> 30m sessions" />
        <MetricCard title="Idle Time" value={idleTime} icon={<Coffee className="w-6 h-6 text-amber-500" />} trend="Away from keyboard" />
        <MetricCard title="Fragmentation" value={fragmentation} icon={<Activity className="w-6 h-6 text-emerald-500" />} trend={fragmentation.includes("High") ? "Try Focus Mode" : "Keep it up"} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <h2 className="text-xl font-semibold mb-6">Activity Timeline</h2>
          <div className="h-64 flex items-center justify-center border border-dashed border-slate-700 rounded-lg text-textMuted">
            {/* Timeline Placeholder - Would use Recharts AreaChart with real timeseries data */}
            Start working to populate your timeline!
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-6">App Usage</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {appData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(value) => {
                    const m = Math.floor(value / 60);
                    return m > 0 ? `${m} mins` : `${value} secs`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
             {appData.map((entry, index) => (
               <div key={entry.name} className="flex items-center">
                 <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                 <span className="text-textMuted truncate max-w-[100px]" title={entry.name}>{entry.name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend }) {
  return (
    <div className="glass-panel p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-800/50 rounded-lg group-hover:bg-slate-700/50 transition-colors">
          {icon}
        </div>
      </div>
      <h3 className="text-textMuted font-medium mb-1">{title}</h3>
      <div className="flex items-end space-x-3">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-xs text-emerald-400 mb-1">{trend}</span>
      </div>
    </div>
  );
}
