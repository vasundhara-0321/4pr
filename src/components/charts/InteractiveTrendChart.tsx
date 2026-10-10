import React, { useState } from 'react';
import { DailyMetric } from '../../types';

interface InteractiveTrendChartProps {
  metrics: DailyMetric[];
  title?: string;
  metricType?: 'spend' | 'conversions' | 'clicks' | 'cvr';
  anomalyDate?: string;
  anomalyValue?: number;
}

export const InteractiveTrendChart: React.FC<InteractiveTrendChartProps> = ({
  metrics,
  title,
  metricType = 'spend',
  anomalyDate,
  anomalyValue
}) => {
  const [selectedTab, setSelectedTab] = useState<'spend' | 'conversions' | 'clicks' | 'cvr'>(metricType);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!metrics || metrics.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
        No historical data points available to plot.
      </div>
    );
  }

  // Extract values
  const getVal = (m: DailyMetric) => {
    switch (selectedTab) {
      case 'spend': return m.spend;
      case 'conversions': return m.conversions;
      case 'clicks': return m.clicks;
      case 'cvr': return m.cvr;
    }
  };

  const getFormat = (val: number) => {
    switch (selectedTab) {
      case 'spend': return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'conversions': return `${Math.round(val)} conv`;
      case 'clicks': return `${Math.round(val)} clicks`;
      case 'cvr': return `${val.toFixed(2)}%`;
    }
  };

  const values = metrics.map(getVal);
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
  const mean = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
  
  const variance = validValues.length > 1
    ? validValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (validValues.length - 1)
    : 0;
  const stdDev = Math.sqrt(variance);

  const baselineUpper = mean + 1.8 * stdDev;
  const baselineLower = Math.max(0, mean - 1.8 * stdDev);

  const maxVal = Math.max(...values, baselineUpper, anomalyValue || 0) * 1.15 || 10;
  const minVal = 0;

  const width = 640;
  const height = 200;
  const paddingX = 40;
  const paddingY = 24;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const getX = (idx: number) => paddingX + (idx / (metrics.length - 1 || 1)) * chartW;
  const getY = (val: number) => paddingY + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

  // Build SVG path
  const linePoints = metrics.map((m, i) => `${getX(i)},${getY(getVal(m))}`).join(' ');

  // Baseline envelope area
  const upperEnvelopePoints = metrics.map((_, i) => `${getX(i)},${getY(baselineUpper)}`).join(' ');
  const lowerEnvelopePoints = [...metrics].reverse().map((_, i) => {
    const revIndex = metrics.length - 1 - i;
    return `${getX(revIndex)},${getY(baselineLower)}`;
  }).join(' ');

  const envelopePolygon = `${upperEnvelopePoints} ${lowerEnvelopePoints}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title || 'Historical Trend & Baseline Envelope'}</h4>
          <p className="text-xs text-slate-500">
            Shaded blue zone represents the 1.8-sigma expected control band (Mean: {getFormat(mean)})
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(['spend', 'conversions', 'clicks', 'cvr'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedTab(tab)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedTab === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'spend' ? 'Spend' : tab === 'conversions' ? 'Conversions' : tab === 'clicks' ? 'Clicks' : 'CVR'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 select-none overflow-visible"
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingY + chartH * (1 - pct);
            const val = minVal + pct * (maxVal - minVal);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[9px] font-mono"
                >
                  {getFormat(val)}
                </text>
              </g>
            );
          })}

          {/* Expected Baseline Band (Polygon) */}
          <polygon
            points={envelopePolygon}
            fill="#e0e7ff"
            fillOpacity="0.45"
          />

          {/* Baseline Mean Line */}
          <line
            x1={paddingX}
            y1={getY(mean)}
            x2={width - paddingX}
            y2={getY(mean)}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />

          {/* Actual Trend Line */}
          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={linePoints}
          />

          {/* Data Points */}
          {metrics.map((m, i) => {
            const val = getVal(m);
            const x = getX(i);
            const y = getY(val);
            const isAnomaly = (val > baselineUpper && selectedTab !== 'conversions') || 
                              (val < baselineLower && (selectedTab === 'conversions' || selectedTab === 'cvr')) ||
                              m.date === anomalyDate ||
                              m.isMissing;

            const isHovered = hoveredIndex === i;

            return (
              <g key={m.date} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                {/* Invisible hover area */}
                <circle cx={x} cy={y} r="14" fill="transparent" />

                {/* Anomaly halo pulse */}
                {isAnomaly && (
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill="#ef4444"
                    fillOpacity="0.25"
                    className="animate-pulse"
                  />
                )}

                {/* Data point circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : isAnomaly ? 4.5 : 3}
                  fill={isAnomaly ? '#ef4444' : isHovered ? '#1d4ed8' : '#2563eb'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* X-axis date labels */}
                {(i === 0 || i === Math.floor(metrics.length / 2) || i === metrics.length - 1) && (
                  <text
                    x={x}
                    y={height - 6}
                    textAnchor="middle"
                    className="fill-slate-400 text-[10px]"
                  >
                    {m.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredIndex !== null && metrics[hoveredIndex] && (
          <div
            className="pointer-events-none absolute top-2 right-2 rounded-lg border border-slate-200 bg-white/95 p-2 shadow-md backdrop-blur-xs text-xs"
          >
            <div className="font-semibold text-slate-800">{metrics[hoveredIndex].date}</div>
            <div className="mt-1 flex items-center justify-between gap-4 text-slate-600">
              <span>Observed {selectedTab.toUpperCase()}:</span>
              <span className="font-mono font-bold text-slate-900">{getFormat(getVal(metrics[hoveredIndex]))}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-500">
              <span>Expected Mean:</span>
              <span className="font-mono">{getFormat(mean)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-500">
              <span>Normal Band:</span>
              <span className="font-mono">{getFormat(baselineLower)} – {getFormat(baselineUpper)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            Actual Metric
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 border-b border-dashed border-slate-400"></span>
            Rolling Baseline Mean
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-xs bg-indigo-100 border border-indigo-200"></span>
            Normal Control Envelope
          </span>
        </div>
        <div className="flex items-center gap-1 text-rose-600 font-medium">
          <span className="h-2 w-2 rounded-full bg-rose-500"></span>
          Statistical Deviation Outlier
        </div>
      </div>
    </div>
  );
};
