'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '@/lib/api-client';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Users,
  Layers,
  ArrowUpRight,
  Activity,
  Zap,
  Check,
  Building,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

export default function AnalyticsDashboard({ role = 'admin' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('30d');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/analytics?range=${range}`;
      if (selectedYear !== 'all') url += `&year=${selectedYear}`;
      if (selectedBranch !== 'all') url += `&branch=${selectedBranch}`;

      const res = await apiRequest(url);
      if (res && res.success) {
        setData(res);
      } else {
        setError(res?.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Analytics load error:', err);
      setError(err.message || 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  }, [range, selectedYear, selectedBranch]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Compute SVG smooth curve path for timeline
  const trendChartData = useMemo(() => {
    if (!data?.timeline || data.timeline.length === 0) return null;
    const timeline = data.timeline;
    const width = 650;
    const height = 190;
    const paddingX = 40;
    const paddingY = 25;

    const maxVal = Math.max(
      ...timeline.map((d) => Math.max(d.submitted || 0, d.resolved || 0)),
      4 // minimum scale of 4 for nice spacing
    );

    const stepX = (width - paddingX * 2) / (timeline.length - 1 || 1);

    const getX = (idx) => paddingX + idx * stepX;
    const getY = (val) => height - paddingY - (val / maxVal) * (height - paddingY * 2);

    // Create SVG points
    const submittedPoints = timeline.map((d, i) => ({ x: getX(i), y: getY(d.submitted), ...d }));
    const resolvedPoints = timeline.map((d, i) => ({ x: getX(i), y: getY(d.resolved), ...d }));

    // Helper for smooth Bezier curve
    const createCurvedPath = (points) => {
      if (points.length === 0) return '';
      if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        path += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      return path;
    };

    const submittedPath = createCurvedPath(submittedPoints);
    const resolvedPath = createCurvedPath(resolvedPoints);

    // Area fill paths
    const submittedArea =
      submittedPoints.length > 0
        ? `${submittedPath} L ${submittedPoints[submittedPoints.length - 1].x} ${height - paddingY} L ${submittedPoints[0].x} ${height - paddingY} Z`
        : '';

    const resolvedArea =
      resolvedPoints.length > 0
        ? `${resolvedPath} L ${resolvedPoints[resolvedPoints.length - 1].x} ${height - paddingY} L ${resolvedPoints[0].x} ${height - paddingY} Z`
        : '';

    return {
      width,
      height,
      maxVal,
      submittedPoints,
      resolvedPoints,
      submittedPath,
      resolvedPath,
      submittedArea,
      resolvedArea,
      paddingX,
      paddingY,
    };
  }, [data]);

  // Compute Donut Chart slices using strokeDasharray
  const donutData = useMemo(() => {
    if (!data?.statusDistribution) return [];
    const total = data.overview?.total || 0;
    if (total === 0) return [];

    const circumference = 2 * Math.PI * 40; // radius = 40
    let accumulatedAngle = 0;

    return data.statusDistribution.map((item) => {
      const fraction = item.count / total;
      const strokeLength = fraction * circumference;
      const spaceLength = circumference - strokeLength;
      const dashArray = `${strokeLength} ${spaceLength}`;
      const dashOffset = -accumulatedAngle;
      accumulatedAngle += strokeLength;

      return {
        ...item,
        dashArray,
        dashOffset,
        fraction,
      };
    });
  }, [data]);

  const handlePrintExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 300);
  };

  const handleCsvExport = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Grievances', data.overview.total],
      ['Resolved', data.overview.resolved],
      ['Pending', data.overview.pending],
      ['Under Repair', data.overview.in_progress],
      ['Rejected', data.overview.rejected],
      ['Resolution Rate', `${data.overview.resolution_rate}%`],
      ['Avg Resolution Time (Hours)', data.overview.avg_resolution_hours],
      ['Fastest Resolution Time (Hours)', data.overview.fastest_resolution_hours || 'N/A'],
      ['Active Backlog', data.overview.active_backlog],
      ['Unattended (>48h)', data.overview.pending_over_48h],
      [],
      ['Category Breakdown', 'Count', 'Resolution Rate'],
      ...(data.categoryStats || []).map((c) => [c.name, c.total, `${c.resolutionRate}%`]),
      [],
      ['Year Breakdown', 'Count', 'Share'],
      ...(data.yearStats || []).map((y) => [y.year, y.count, `${y.percentage}%`]),
      [],
      ['Branch Breakdown', 'Count', 'Share'],
      ...(data.branchStats || []).map((b) => [b.branch, b.count, `${b.percentage}%`]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `resolvex_analytics_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-3xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-center space-y-4">
        <AlertTriangle className="mx-auto text-red-600 dark:text-red-400" size={36} />
        <h3 className="text-lg font-bold text-red-900 dark:text-red-200">Unable to load analytics</h3>
        <p className="text-sm text-red-600 dark:text-red-300 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2"
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  const { overview, statusDistribution, categoryStats, yearStats, branchStats, slaStats, topIssues } = data || {};

  return (
    <div className="space-y-6">
      {/* Header Bar with Filters & Action Controls - Crisp Institutional Style */}
      <div className="rounded-xl bg-[#1B2A4A] border border-[#24375D] p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#24375D] text-[#D4A017] border border-[#D4A017]/30">
              <Activity size={13} className="text-[#D4A017]" />
              <span>Real-Time Intelligence &amp; Redressal Trends</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Department Grievance Analytics
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Visual insights into issue resolution velocities, cohort workloads, and recurring infrastructure bottlenecks across AIML &amp; AI.
            </p>
          </div>

          {/* Time Range Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Range Toggle */}
            <div className="bg-[#24375D] p-1 rounded-lg border border-white/10 flex items-center">
              {[
                { key: '7d', label: '7 Days' },
                { key: '14d', label: '14 Days' },
                { key: '30d', label: '30 Days' },
                { key: 'all', label: 'All Time' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setRange(t.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    range === t.key
                      ? 'bg-[#D4A017] text-[#1B2A4A] shadow-sm'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Quick Cohort Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-[#24375D] border border-white/20 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#D4A017]"
            >
              <option value="all" className="bg-[#1B2A4A] text-white">All Years</option>
              <option value="1" className="bg-[#1B2A4A] text-white">1st Year</option>
              <option value="2" className="bg-[#1B2A4A] text-white">2nd Year</option>
              <option value="3" className="bg-[#1B2A4A] text-white">3rd Year</option>
              <option value="4" className="bg-[#1B2A4A] text-white">4th Year</option>
            </select>

            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-[#24375D] border border-white/20 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#D4A017]"
            >
              <option value="all" className="bg-[#1B2A4A] text-white">All Branches</option>
              <option value="AIML" className="bg-[#1B2A4A] text-white">AIML</option>
              <option value="AI" className="bg-[#1B2A4A] text-white">AI</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              title="Refresh Data"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Export CSV */}
            <button
              onClick={handleCsvExport}
              title="Export as CSV"
              className="px-3.5 py-1.5 rounded-lg bg-[#D4A017] hover:bg-[#C9A227] text-[#1B2A4A] text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Volume */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Grievances
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#FAF3DE] text-[#D4A017] flex items-center justify-center">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {overview?.total || 0}
            </span>
            <span className="text-xs font-medium text-slate-500">
              filed overall
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Today's Submissions</span>
            <span className="font-bold text-[#1B2A4A]">
              +{overview?.submitted_today || 0} today
            </span>
          </div>
        </div>

        {/* Card 2: Resolution Rate */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resolution Rate
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">
              {overview?.resolution_rate || 0}%
            </span>
            <span className="text-xs font-medium text-slate-500">
              ({overview?.resolved || 0} of {overview?.total || 0})
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Target Efficiency</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <CheckCircle2 size={12} /> {overview?.resolution_rate >= 75 ? 'Optimal Health' : 'Needs Action'}
            </span>
          </div>
        </div>

        {/* Card 3: Avg Resolution Speed */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Turnaround
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {overview?.avg_resolution_hours > 0 ? `${overview.avg_resolution_hours}h` : '< 24h'}
            </span>
            <span className="text-xs font-medium text-slate-500">
              avg per ticket
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Speed Rating</span>
            <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
              <Zap size={12} /> Fast SLA
            </span>
          </div>
        </div>

        {/* Card 4: Active Workload Backlog */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Workload
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-600">
              {overview?.active_backlog || 0}
            </span>
            <span className="text-xs font-medium text-slate-500">
              open issues
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Unattended &gt;48h</span>
            <span className={`font-semibold ${overview?.pending_over_48h > 0 ? 'text-red-500' : 'text-slate-400'}`}>
              {overview?.pending_over_48h || 0} delayed
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Intake & Resolution Trend (Interactive SVG Chart) + Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Col span 2) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={18} />
                  Intake vs Resolution Timeline
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daily comparison of grievances submitted vs grievances successfully redressed
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block shadow-sm"></span>
                  <span className="text-slate-700 dark:text-slate-300">Submitted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
                  <span className="text-slate-700 dark:text-slate-300">Resolved</span>
                </div>
              </div>
            </div>

            {/* SVG Visual Canvas */}
            <div className="relative w-full overflow-hidden mt-4 pt-2">
              {trendChartData && (
                <svg
                  viewBox={`0 0 ${trendChartData.width} ${trendChartData.height}`}
                  className="w-full h-52 overflow-visible"
                >
                  <defs>
                    <linearGradient id="submittedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y =
                      trendChartData.height -
                      trendChartData.paddingY -
                      pct * (trendChartData.height - trendChartData.paddingY * 2);
                    const val = Math.round(pct * trendChartData.maxVal);
                    return (
                      <g key={i}>
                        <line
                          x1={trendChartData.paddingX}
                          y1={y}
                          x2={trendChartData.width - trendChartData.paddingX}
                          y2={y}
                          stroke="currentColor"
                          className="text-slate-100 dark:text-slate-800/80"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={trendChartData.paddingX - 10}
                          y={y + 3}
                          fontSize="9"
                          textAnchor="end"
                          className="fill-slate-400 dark:fill-slate-500 font-medium"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Submitted Area & Line */}
                  <path d={trendChartData.submittedArea} fill="url(#submittedGradient)" />
                  <path
                    d={trendChartData.submittedPath}
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="drop-shadow-sm transition-all"
                  />

                  {/* Resolved Area & Line */}
                  <path d={trendChartData.resolvedArea} fill="url(#resolvedGradient)" />
                  <path
                    d={trendChartData.resolvedPath}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="drop-shadow-sm transition-all"
                  />

                  {/* Points for Submitted */}
                  {trendChartData.submittedPoints.map((pt, idx) => (
                    <circle
                      key={`sub-${idx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPoint?.idx === idx && hoveredPoint?.type === 'sub' ? 5 : 3}
                      fill="#6366F1"
                      className="cursor-pointer transition-all hover:scale-125"
                      onMouseEnter={() => setHoveredPoint({ idx, type: 'sub', pt })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}

                  {/* Points for Resolved */}
                  {trendChartData.resolvedPoints.map((pt, idx) => (
                    <circle
                      key={`res-${idx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPoint?.idx === idx && hoveredPoint?.type === 'res' ? 5 : 3}
                      fill="#10B981"
                      className="cursor-pointer transition-all hover:scale-125"
                      onMouseEnter={() => setHoveredPoint({ idx, type: 'res', pt })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </svg>
              )}

              {/* Tooltip on Hover */}
              {hoveredPoint && (
                <div
                  className="absolute pointer-events-none px-3 py-2 bg-slate-900/90 text-white rounded-xl shadow-xl text-xs backdrop-blur-md border border-slate-700 transform -translate-x-1/2 -translate-y-full -top-2 transition-all z-20"
                  style={{
                    left: `${(hoveredPoint.pt.x / (trendChartData?.width || 1)) * 100}%`,
                  }}
                >
                  <p className="font-bold text-slate-200">{hoveredPoint.pt.label}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px]">
                    <span className="text-indigo-400">
                      Filed: <b>{hoveredPoint.pt.submitted}</b>
                    </span>
                    <span className="text-emerald-400">
                      Resolved: <b>{hoveredPoint.pt.resolved}</b>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date Axis Badges at Bottom */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span>{data?.timeline?.[0]?.label || 'Start'}</span>
            <span>{data?.timeline?.[Math.floor((data?.timeline?.length || 1) / 2)]?.label || 'Mid'}</span>
            <span>{data?.timeline?.[data?.timeline?.length - 1]?.label || 'Today'}</span>
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChartIcon className="text-purple-600 dark:text-purple-400" size={18} />
                  Status Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Current distribution of active and resolved issues
                </p>
              </div>
            </div>

            {/* Donut SVG */}
            <div className="relative flex items-center justify-center my-4">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="14"
                  fill="transparent"
                />

                {/* Slices */}
                {donutData.map((slice) => (
                  <circle
                    key={slice.key}
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={slice.color}
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={slice.dashArray}
                    strokeDashoffset={slice.dashOffset}
                    className="cursor-pointer transition-all duration-300 hover:opacity-80"
                    onMouseEnter={() => setHoveredStatus(slice)}
                    onMouseLeave={() => setHoveredStatus(null)}
                  />
                ))}
              </svg>

              {/* Center Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {hoveredStatus ? hoveredStatus.label : 'Resolution'}
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {hoveredStatus ? hoveredStatus.count : `${overview?.resolution_rate || 0}%`}
                </span>
                <span className="text-[10px] text-slate-400">
                  {hoveredStatus ? `${hoveredStatus.percentage}% of total` : 'Rate'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {statusDistribution?.map((item) => (
              <div
                key={item.key}
                onMouseEnter={() => setHoveredStatus(item)}
                onMouseLeave={() => setHoveredStatus(null)}
                className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                  hoveredStatus?.key === item.key
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
                  <span className="text-slate-400 text-[11px]">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Category Performance & Cohort Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Progress Bars */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="text-cyan-600 dark:text-cyan-400" size={18} />
                Category Workload & Resolution Efficiency
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ticket volume and completion rate across academic domains
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {categoryStats && categoryStats.length > 0 ? (
              categoryStats.map((cat, idx) => (
                <div key={cat.name} className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 dark:text-slate-400">
                        {cat.total} tickets ({cat.percentage}%)
                      </span>
                      <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[11px]">
                        {cat.resolutionRate}% resolved
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar: Total representation + Resolved fill */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500 rounded-l-full"
                      style={{ width: `${(cat.resolved / (cat.total || 1)) * 100}%` }}
                      title={`Resolved: ${cat.resolved}`}
                    ></div>
                    <div
                      className="bg-amber-400 h-full transition-all duration-500"
                      style={{ width: `${(cat.pending / (cat.total || 1)) * 100}%` }}
                      title={`Pending: ${cat.pending}`}
                    ></div>
                    <div
                      className="bg-blue-400 h-full transition-all duration-500 rounded-r-full"
                      style={{ width: `${(cat.in_progress / (cat.total || 1)) * 100}%` }}
                      title={`Under Repair: ${cat.in_progress}`}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span className="text-emerald-600 dark:text-emerald-400">✓ {cat.resolved} Resolved</span>
                    <span className="text-amber-600 dark:text-amber-400">⏳ {cat.pending} Pending</span>
                    <span className="text-blue-600 dark:text-blue-400">🔧 {cat.in_progress} Under Repair</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No category data recorded yet.</p>
            )}
          </div>
        </div>

        {/* Cohort Insights: Year-wise & Branch Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="text-indigo-600 dark:text-indigo-400" size={18} />
                  Cohort Distribution (Year & Branch)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Issue distribution across academic batches and program branches
                </p>
              </div>
            </div>

            {/* Year-wise Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {yearStats?.map((y, idx) => (
                <div
                  key={y.year}
                  className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-center"
                >
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    {y.year}
                  </span>
                  <span className="text-xl font-extrabold text-indigo-900 dark:text-indigo-300 block mt-1">
                    {y.count}
                  </span>
                  <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                    {y.percentage}% share
                  </span>
                </div>
              ))}
            </div>

            {/* Branch Split: AIML vs AI */}
            <div className="space-y-3 mb-6">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Branch Comparison
              </span>
              <div className="grid grid-cols-2 gap-4">
                {branchStats?.map((b) => (
                  <div
                    key={b.branch}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {b.branch}
                      </span>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        {b.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-[#1B2A4A] h-full rounded-full transition-all duration-500"
                        style={{ width: `${b.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 block">
                      {b.count} grievances filed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submitter Role Balance */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Submitters:</span>
            </div>
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
              <span>
                🎓 CRs: <b>{data?.roleStats?.[0]?.count || 0}</b>
              </span>
              <span>
                📚 Faculty: <b>{data?.roleStats?.[1]?.count || 0}</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recurring Bottlenecks (Hotspots) & SLA Turnaround Speed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Recurring Issue Types */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={18} />
                Recurring Hotspots & Bottlenecks
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Most frequent infrastructure & hardware complaints flagged across campus
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {topIssues && topIssues.length > 0 ? (
              topIssues.map((issue, idx) => (
                <div
                  key={issue.type}
                  className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {issue.type}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    {issue.count} incidents
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No recurring issue patterns identified yet.</p>
            )}
          </div>
        </div>

        {/* SLA Turnaround Speed Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="text-cyan-500" size={18} />
                  Resolution SLA & Velocity Tiers
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Turnaround time distribution for resolved cases
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                  &lt; 24 Hours
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                  {slaStats?.under_24h || 0}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  ⚡ Express Resolution
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-center">
                <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block">
                  1 - 3 Days
                </span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 block mt-1">
                  {slaStats?.one_to_three_days || 0}
                </span>
                <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">
                  Standard Turnaround
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  &gt; 3 Days
                </span>
                <span className="text-2xl font-black text-slate-700 dark:text-slate-300 block mt-1">
                  {slaStats?.over_three_days || 0}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Complex Hardware
                </span>
              </div>
            </div>
          </div>

          {/* Quick Notice on Backlog Health */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-700 font-medium flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#1B2A4A]" />
              SLA Standard: AI/AIML Department targets 48-hour resolution for all standard lab &amp; classroom grievances.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
