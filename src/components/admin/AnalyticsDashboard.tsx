
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { Log, Subject } from '../../types';
import { Users, Eye, TrendingUp, Activity, BarChart2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { DBService } from '../../services/storage';

interface AnalyticsDashboardProps {
  logs: Log[];
  subjects: Subject[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ logs, subjects }) => {

  const [realtimeUsers, setRealtimeUsers] = useState(0);

  useEffect(() => {
    const unsubscribe = DBService.subscribeToActiveUsers((count) => {
        setRealtimeUsers(count);
    });
    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const totalSubjectViews = logs.filter(l => l.action === 'VIEW_SUBJECT').length;
    // Changed: 'DOWNLOAD_RESOURCE' is now interpreted as 'VIEW_FILE' in new system, checking both for backward compat
    const totalFileViews = logs.filter(l => l.action === 'VIEW_FILE' || l.action === 'DOWNLOAD_RESOURCE').length;
    
    // Engagement: File Views / Subject Views
    const engagementRate = totalSubjectViews > 0 ? ((totalFileViews / totalSubjectViews) * 100).toFixed(1) : '0';

    return {
      totalSubjectViews,
      totalFileViews,
      engagementRate,
      uniqueLoggers: new Set(logs.map(l => l.userId)).size,
    };
  }, [logs]);

  const subjectStats = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      if (log.action === 'VIEW_SUBJECT') {
        const subName = log.details.replace('Viewed subject: ', '');
        counts[subName] = (counts[subName] || 0) + 1;
      }
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topSubject = sorted.length > 0 ? sorted[0][0] : 'None';
    const chartData = sorted.slice(0, 5).map(([name, count]) => ({ name, count }));

    return { topSubject, chartData };
  }, [logs]);

  const activityTrend = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-GB');
    }).reverse();

    const dataMap = new Map(last7Days.map(date => [date, 0]));

    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('en-GB');
      if (dataMap.has(date)) {
        dataMap.set(date, dataMap.get(date)! + 1);
      }
    });

    return Array.from(dataMap.entries()).map(([date, count]) => ({ date, count }));
  }, [logs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600">
              <Eye size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Subject Views</p>
              <h3 className="text-2xl font-bold dark:text-white">{stats.totalSubjectViews}</h3>
            </div>
          </div>
        </motion.div>
        
        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-full text-green-600">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">File Opens</p>
              <h3 className="text-2xl font-bold dark:text-white">{stats.totalFileViews}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-full text-purple-600">
              <BarChart2 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Engagement Rate</p>
              <h3 className="text-2xl font-bold dark:text-white">{stats.engagementRate}%</h3>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-full text-amber-600 relative">
              <Users size={24} />
              <span className="absolute top-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Live Users</p>
              <h3 className="text-2xl font-bold dark:text-white">{realtimeUsers}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold dark:text-white flex items-center"><TrendingUp className="mr-2 text-indigo-500"/> Popular Subjects</h3>
             <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg">Top: {subjectStats.topSubject}</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectStats.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#888' }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#888' }}/>
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-[400px] flex flex-col">
          <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center">
            <Activity className="mr-2 text-green-500"/> User Activity (Last 7 Days)
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} allowDecimals={false}/>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false}/>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }}/>
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
