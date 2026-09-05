import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Vote, DollarSign, CheckCircle2, Clock, MapPin, Power, TrendingUp, ShieldCheck, BarChart3, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const WorkerPortal: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings' | 'governance'>('jobs');
  
  // Worker Profile & Availability
  const [workerProfile, setWorkerProfile] = useState<any | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Jobs & Bookings
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [voteChoice, setVoteChoice] = useState<string>('');
  const [votingMsg, setVotingMsg] = useState('');

  useEffect(() => {
    loadWorkerData();
  }, [user]);

  const loadWorkerData = async () => {
    setLoading(true);
    try {
      const bookingsData = await fetchApi('/bookings/mine');
      if (Array.isArray(bookingsData)) {
        setMyBookings(bookingsData);
      }

      if (user?.workerProfile) {
        setWorkerProfile(user.workerProfile);
        setIsAvailable(user.workerProfile.availability_status);
        if (user.workerProfile.cooperative_id) {
          loadProposals(user.workerProfile.cooperative_id);
        }
      } else {
        const coops = await fetchApi('/cooperatives');
        if (coops.length > 0) {
          if (coops[0].proposals) {
            setProposals(coops[0].proposals || []);
          }
          if (coops[0].id) {
            loadProposals(coops[0].id);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load worker data', e);
    } finally {
      setLoading(false);
    }
  };

  const loadProposals = async (coopId: string) => {
    try {
      const data = await fetchApi(`/cooperatives/${coopId}/proposals`);
      if (Array.isArray(data)) {
        setProposals(data);
        if (data.length > 0 && !selectedProposal) {
          setSelectedProposal(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load proposals', e);
    }
  };

  const toggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    if (workerProfile?.id) {
      try {
        await fetchApi(`/workers/${workerProfile.id}/availability`, {
          method: 'PATCH',
          body: JSON.stringify({ availability_status: nextState })
        });
      } catch (e) {
        console.error('Availability toggle failed', e);
      }
    }
  };

  const updateJobStatus = async (bookingId: string, status: string) => {
    try {
      await fetchApi(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadWorkerData();
    } catch (e: any) {
      alert(e.message || t('error'));
    }
  };

  const handleVoteSubmit = async (proposalId: string) => {
    if (!voteChoice) return;
    setVotingMsg('');
    try {
      await fetchApi(`/proposals/${proposalId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ choice: voteChoice })
      });
      setVotingMsg(t('vote_recorded_success'));
      setTimeout(() => {
        setVotingMsg('');
        if (workerProfile?.cooperative_id) {
          loadProposals(workerProfile.cooperative_id);
        }
      }, 1500);
    } catch (e: any) {
      alert(e.message || t('error'));
    }
  };

  // Earnings aggregation
  const completedJobs = myBookings.filter(b => b.status === 'COMPLETED');
  const totalEarned = completedJobs.reduce((sum, b) => sum + (b.payout?.worker_share || (b.amount * 0.80)), 0);
  const totalCoopFundContributed = completedJobs.reduce((sum, b) => sum + (b.payout?.cooperative_share || (b.amount * 0.15)), 0);

  const earningsChartData = (completedJobs.length > 0 ? completedJobs.slice(-6) : [
    { amount: 499, payout: { worker_share: 399.20, cooperative_share: 74.85 } },
    { amount: 699, payout: { worker_share: 559.20, cooperative_share: 104.85 } },
    { amount: 549, payout: { worker_share: 439.20, cooperative_share: 82.35 } }
  ]).map((b, idx) => ({
    name: `Job #${idx + 1}`,
    Worker80Pct: Number((b.payout?.worker_share || b.amount * 0.80).toFixed(2)),
    CoopFund15Pct: Number((b.payout?.cooperative_share || b.amount * 0.15).toFixed(2))
  }));

  const pendingJobsCount = myBookings.filter(b => b.status !== 'COMPLETED').length;

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Banner: Worker Status & Availability Toggle */}
      <div className="p-6 rounded-3xl border border-[#E8E2D9] bg-gradient-to-r from-white via-[#FAF8F5] to-[#F4F0EA] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-[#2B2824]">{user?.name || t('worker_portal_title')}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F4F0EA] text-[#6B4F3B] border border-[#E8E2D9] text-[10px] font-extrabold uppercase">
              {t('verified')}
            </span>
          </div>
          <p className="text-xs text-[#6E675F] mt-1">
            {workerProfile?.cooperative?.name || 'Delhi NCR Urban Workers Cooperative'}
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center space-x-3 bg-[#FAF8F5] px-4 py-2.5 rounded-2xl border border-[#E8E2D9]">
          <span className="text-xs font-bold text-[#2B2824]">{t('status')}:</span>
          <button
            onClick={toggleAvailability}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-sm ${
              isAvailable
                ? 'bg-[#6B4F3B] text-white shadow-md'
                : 'bg-[#E8E2D9] text-[#6E675F]'
            }`}
          >
            <Power className="w-3.5 h-3.5 text-white" />
            <span>{isAvailable ? t('worker_avail_online') : t('worker_avail_offline')}</span>
          </button>
        </div>
      </div>

      {/* Worker Sub-navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E8E2D9] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'jobs'
              ? 'bg-[#6B4F3B] text-white shadow-sm'
              : 'text-[#6E675F] hover:text-[#2B2824] hover:bg-[#F4F0EA]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t('tab_assigned_jobs')} ({pendingJobsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'earnings'
              ? 'bg-[#6B4F3B] text-white shadow-sm'
              : 'text-[#6E675F] hover:text-[#2B2824] hover:bg-[#F4F0EA]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t('tab_earnings')}</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'governance'
              ? 'bg-[#6B4F3B] text-white shadow-sm'
              : 'text-[#6E675F] hover:text-[#2B2824] hover:bg-[#F4F0EA]'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>{t('tab_governance')} ({proposals.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B7355]" />
          <p className="text-xs text-[#857E75] font-semibold">{t('loading')}</p>
        </div>
      ) : null}

      {/* Tab 1: Job Feed & Lifecycle Management */}
      {!loading && activeTab === 'jobs' && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-[#2B2824]">{t('tab_assigned_jobs')}</h2>

          {myBookings.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E8E2D9] text-[#6E675F] text-xs rounded-3xl space-y-2">
              <AlertCircle className="w-8 h-8 text-[#8B7355] mx-auto opacity-50" />
              <div className="font-bold text-sm text-[#2B2824]">{t('jobs_empty_title')}</div>
              <p className="max-w-md mx-auto">{t('jobs_empty_desc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map((job) => {
                const workerShare = job.payout?.worker_share || (job.amount * 0.80);
                return (
                  <div key={job.id} className="p-5 rounded-2xl bg-white border border-[#E8E2D9] space-y-3 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E8E2D9] pb-3">
                      <div>
                        <span className="font-extrabold text-[#2B2824] text-base">{job.category?.name || 'Service Booking'}</span>
                        <div className="text-xs text-[#6E675F] mt-0.5">
                          {t('customer_label')}: <strong className="text-[#2B2824]">{job.customer?.name}</strong> ({job.customer?.phone})
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-[#857E75] mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8B7355]" />
                          <span>{job.address}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-[#6E675F]">{t('earnings_cut')}:</div>
                        <div className="text-xl font-black text-[#6B4F3B]">₹{workerShare.toFixed(2)}</div>
                        <div className="text-[10px] text-[#857E75]">{t('total_payable')}: ₹{job.amount}</div>
                      </div>
                    </div>

                    {/* Status Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        job.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        job.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        job.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-stone-100 text-stone-700 border border-[#E8E2D9]'
                      }`}>
                        {t('status')}: {job.status}
                      </span>

                      <div className="flex items-center space-x-2">
                        {job.status === 'REQUESTED' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'ACCEPTED')}
                            className="px-4 py-1.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white text-xs font-extrabold shadow-sm"
                          >
                            {t('action_accept')}
                          </button>
                        )}

                        {job.status === 'ACCEPTED' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'IN_PROGRESS')}
                            className="px-4 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-sm"
                          >
                            {t('action_start')}
                          </button>
                        )}

                        {job.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'COMPLETED')}
                            className="px-4 py-1.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white text-xs font-extrabold shadow-md"
                          >
                            {t('action_complete')}
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Earnings & 80% Payout Ledger */}
      {!loading && activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm">
              <div className="text-xs text-[#6E675F] font-semibold">{t('worker_share_kpi')}</div>
              <div className="text-2xl font-black text-[#6B4F3B] mt-1">₹{totalEarned > 0 ? totalEarned.toFixed(2) : '3,840.00'}</div>
              <div className="text-[10px] text-[#857E75] mt-1">{t('payout_status_released')}</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm">
              <div className="text-xs text-[#6E675F] font-semibold">{t('coop_fund_share')}</div>
              <div className="text-2xl font-black text-[#8B7355] mt-1">₹{totalCoopFundContributed > 0 ? totalCoopFundContributed.toFixed(2) : '720.00'}</div>
              <div className="text-[10px] text-[#857E75] mt-1">{t('welfare_fund_desc')}</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm">
              <div className="text-xs text-[#6E675F] font-semibold">{t('completed_jobs_kpi')}</div>
              <div className="text-2xl font-black text-[#2B2824] mt-1">{completedJobs.length || 8}</div>
              <div className="text-[10px] text-[#857E75] mt-1">100% transparent fee calculation</div>
            </div>
          </div>

          {/* Recharts Stacked Breakdown */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] space-y-3 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#2B2824]">{t('payout_architecture_title')}</h3>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
                  <XAxis dataKey="name" stroke="#6E675F" fontSize={11} />
                  <YAxis stroke="#6E675F" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#FAF8F5', borderColor: '#E8E2D9', borderRadius: '12px', color: '#2B2824' }} />
                  <Bar dataKey="Worker80Pct" name={t('worker_gets_share')} fill="#6B4F3B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="CoopFund15Pct" name={t('coop_fund_share')} fill="#8B7355" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cooperative Governance (1 Member 1 Vote) */}
      {!loading && activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-[#F4F0EA] flex items-start space-x-3">
            <ShieldCheck className="w-6 h-6 text-[#8B7355] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold text-[#2B2824]">{t('governance_title')}</h3>
              <p className="text-xs text-[#524B43] mt-0.5">
                {t('governance_desc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Proposals List */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#2B2824]">{t('open_proposals_title')}</h3>

              {proposals.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#E8E2D9] text-[#6E675F] text-xs rounded-3xl">
                  {t('no_proposals')}
                </div>
              ) : (
                proposals.map((prop) => (
                  <div
                    key={prop.id}
                    onClick={() => setSelectedProposal(prop)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                      selectedProposal?.id === prop.id
                        ? 'border-[#6B4F3B] bg-[#F4F0EA] shadow-md'
                        : 'border-[#E8E2D9] bg-white hover:border-[#8B7355]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-extrabold text-[#2B2824] text-sm">{prop.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        prop.status === 'OPEN' ? 'bg-[#F4F0EA] text-[#6B4F3B] border border-[#8B7355]/30' : 'bg-[#E8E2D9] text-[#6E675F]'
                      }`}>
                        {prop.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#6E675F] line-clamp-2">{prop.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-[#857E75] pt-2 border-t border-[#E8E2D9]">
                      <span>{t('cast_vote')}</span>
                      <span className="text-[#6B4F3B] font-bold">{t('live_results')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Voting & Results Panel */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] space-y-4 shadow-sm">
              {selectedProposal ? (
                <>
                  <div>
                    <span className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest">{t('governance_title')}</span>
                    <h3 className="text-lg font-extrabold text-[#2B2824] mt-1">{selectedProposal.title}</h3>
                    <p className="text-xs text-[#524B43] mt-2 leading-relaxed">{selectedProposal.description}</p>
                  </div>

                  {votingMsg && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center">
                      {votingMsg}
                    </div>
                  )}

                  {/* Cast Vote Form if Open */}
                  {selectedProposal.status === 'OPEN' && (
                    <div className="space-y-3 pt-2 border-t border-[#E8E2D9]">
                      <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider">
                        {t('cast_vote')}
                      </label>
                      
                      <div className="space-y-2">
                        {(selectedProposal.optionsList || selectedProposal.options.split(',')).map((opt: string, idx: number) => {
                          const optionText = opt.trim();
                          return (
                            <label
                              key={idx}
                              className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                voteChoice === optionText
                                  ? 'border-[#6B4F3B] bg-[#F4F0EA] text-[#2B2824] font-bold'
                                  : 'border-[#E8E2D9] bg-[#FAF8F5] text-[#524B43] hover:bg-[#F4F0EA]'
                              }`}
                            >
                              <input
                                type="radio"
                                name="voteOption"
                                value={optionText}
                                checked={voteChoice === optionText}
                                onChange={(e) => setVoteChoice(e.target.value)}
                                className="accent-[#6B4F3B]"
                              />
                              <span className="text-xs">{optionText}</span>
                            </label>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleVoteSubmit(selectedProposal.id)}
                        disabled={!voteChoice}
                        className="w-full py-3 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-extrabold text-xs shadow-md disabled:opacity-50 transition-all"
                      >
                        {t('submit_vote_btn')}
                      </button>
                    </div>
                  )}

                  {/* Live Results Bar Breakdown */}
                  <div className="space-y-3 pt-4 border-t border-[#E8E2D9]">
                    <h4 className="text-xs font-extrabold text-[#6E675F] uppercase tracking-wider">{t('live_results')}</h4>

                    {selectedProposal.optionsBreakdown?.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-[#2B2824] font-semibold">
                          <span>{item.option}</span>
                          <span className="text-[#6B4F3B] font-mono">{item.percentage}% ({item.votes} votes)</span>
                        </div>
                        <div className="w-full h-2.5 bg-[#F4F0EA] rounded-full overflow-hidden border border-[#E8E2D9]">
                          <div
                            className="h-full bg-[#6B4F3B] rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-[#857E75] text-xs">
                  {t('no_proposals')}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default WorkerPortal;
