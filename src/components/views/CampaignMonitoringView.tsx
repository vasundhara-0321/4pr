import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  DollarSign,
  Activity,
  Layers,
  ArrowUpDown,
  ExternalLink,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Campaign, CampaignStatus, CampaignChannel } from '../../types';

interface CampaignMonitoringViewProps {
  campaigns: Campaign[];
  onSelectCampaign: (campaign: Campaign) => void;
}

export const CampaignMonitoringView: React.FC<CampaignMonitoringViewProps> = ({
  campaigns,
  onSelectCampaign
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof Campaign>('currentSpend');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.channel.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchChannel = channelFilter === 'ALL' || c.channel === channelFilter;

      return matchSearch && matchStatus && matchChannel;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal === null || aVal === undefined) aVal = -1;
      if (bVal === null || bVal === undefined) bVal = -1;

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [campaigns, searchTerm, statusFilter, channelFilter, sortField, sortAsc]);

  const handleSort = (field: keyof Campaign) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const statusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'HEALTHY':
        return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">● Healthy</span>;
      case 'WARNING':
        return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">▲ Warning</span>;
      case 'CRITICAL':
        return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">■ Critical</span>;
      case 'MISSING_DATA':
        return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">✕ Telemetry Gap</span>;
      case 'PAUSED':
        return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">❚❚ Paused</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by campaign name or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Filter className="h-3.5 w-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-8.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Statuses ({campaigns.length})</option>
              <option value="HEALTHY">Healthy</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
              <option value="MISSING_DATA">Missing Data</option>
              <option value="PAUSED">Paused</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium ml-2">
              <Layers className="h-3.5 w-3.5" />
              <span>Channel:</span>
            </div>
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value)}
              className="h-8.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Channels</option>
              <option value="Google Search">Google Search</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="TikTok Ads">TikTok Ads</option>
              <option value="LinkedIn Ads">LinkedIn Ads</option>
              <option value="Google PMax">Google PMax</option>
              <option value="Bing Search">Bing Search</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    <span>Campaign ID & Name</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Channel</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  onClick={() => handleSort('currentSpend')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Daily Spend ($)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  onClick={() => handleSort('currentClicks')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Clicks</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  onClick={() => handleSort('currentConversions')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Conversions</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  onClick={() => handleSort('currentCvr')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>CVR (%)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-center"
                  onClick={() => handleSort('healthScore')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Health Score</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No campaigns found matching search filters.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map(c => {
                  const overBudget = c.currentSpend > c.dailyBudget * 1.25;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCampaign(c)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* ID & Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{c.id}</div>
                      </td>

                      {/* Channel */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 font-medium">{c.channel}</span>
                      </td>

                      {/* Spend */}
                      <td className="py-3.5 px-4 text-right">
                        <div className={`font-mono font-bold ${overBudget ? 'text-rose-600' : 'text-slate-900'}`}>
                          ${c.currentSpend.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Budget: ${c.dailyBudget.toFixed(2)}
                        </div>
                      </td>

                      {/* Clicks */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono text-slate-800">{c.currentClicks.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">CTR {c.currentCtr.toFixed(2)}%</div>
                      </td>

                      {/* Conversions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono text-slate-800">{c.currentConversions.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">CPA ${c.currentCpa.toFixed(2)}</div>
                      </td>

                      {/* CVR */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-800">
                        {c.currentCvr.toFixed(2)}%
                      </td>

                      {/* Health Score */}
                      <td className="py-3.5 px-4 text-center">
                        {c.healthScore !== null ? (
                          <div className="inline-flex items-center gap-1.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              c.healthScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                              c.healthScore >= 50 ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {c.healthScore}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md" title="Requires min 3 historical days">
                            Calibrating
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {statusBadge(c.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onSelectCampaign(c);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          Telemetry →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
