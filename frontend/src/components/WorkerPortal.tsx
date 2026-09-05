import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Vote, DollarSign, CheckCircle2, Clock, MapPin, Power, TrendingUp, ShieldCheck, BarChart3, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const WorkerPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings' | 'governance'>('jobs');
  
  // Worker Profile & Availability
  const [workerProfile, setWorkerProfile] = useState<any | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  
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
    try {
      const bookingsData = await fetchApi('/bookings/mine');
      setMyBookings(bookingsData);

      if (user?.workerProfile) {
        setWorkerProfile(user.workerProfile);
        setIsAvailable(user.workerProfile.availability_status);
        if (user.workerProfile.cooperative_id) {
          loadProposals(user.workerProfile.cooperative_id);
        }
      } else {
        // Fallback fetch coops to get worker profile
        const coops = await fetchApi('/cooperatives');
        if (coops.length > 0 && coops[0].proposals) {
          setProposals(coops[0].proposals || []);
        }
      }
    } catch (e) {
      console.error('Failed to load worker data', e);
    }
  };

  const loadProposals = async (coopId: string) => {
    try {
      const data = await fetchApi(`/cooperatives/${coopId}/proposals`);
      setProposals(data);
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
      alert(e.message || 'Status update failed');
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
      setVotingMsg('Vote cast successfully (1 Member 1 Vote)!');
      setTimeout(() => {
        setVotingMsg('');
        setSelectedProposal(null);
        if (workerProfile?.cooperative_id) {
          loadProposals(workerProfile.cooperative_id);
        }
      }, 1500);
    } catch (e: any) {
      alert(e.message || 'Voting failed');
    }
  };

  // Earnings aggregation
  const completedJobs = myBookings.filter(b => b.status === 'COMPLETED');
  const totalEarned = completedJobs.reduce((sum, b) => sum + (b.payout?.worker_share || (b.amount * 0.80)), 0);
  const totalCoopFundContributed = completedJobs.reduce((sum, b) => sum + (b.payout?.cooperative_share || (b.amount * 0.15)), 0);

  const earningsChartData = completedJobs.slice(-6).map((b, idx) => ({
    name: `Job #${idx + 1}`,
    Worker80Pct: Number((b.payout?.worker_share || b.amount * 0.80).toFixed(2)),
    CoopFund15Pct: Number((b.payout?.cooperative_share || b.amount * 0.15).toFixed(2))
  }));

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Banner: Worker Status & Availability Toggle */}
      <div className="p-6 rounded-3xl border border-[#E8E2D9] bg-gradient-to-r from-white via-[#FAF8F5] to-[#F4F0EA] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-[#2B2824]">{user?.name || 'Worker Member Dashboard'}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F4F0EA] text-[#6B4F3B] border border-[#E8E2D9] text-[10px] font-extrabold uppercase">
              VERIFIED MEMBER
            </span>
          </div>
          <p className="text-xs text-[#6E675F] mt-1">
            Affiliation: <strong className="text-[#8B7355]">{workerProfile?.cooperative?.name || 'Delhi NCR Urban Workers Cooperative'}</strong>
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center space-x-3 bg-[#FAF8F5] px-4 py-2.5 rounded-2xl border border-[#E8E2D9]">
          <span className="text-xs font-bold text-[#2B2824]">Duty Status:</span>
          <button
            onClick={toggleAvailability}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-sm ${
              isAvailable
                ? 'bg-[#6B4F3B] text-white shadow-md'
                : 'bg-[#E8E2D9] text-[#6E675F]'
            }`}
          >
            <Power className="w-3.5 h-3.5 text-white" />
            <span>{isAvailable ? 'AVAILABLE FOR JOBS' : 'OFFLINE'}</span>
          </button>
        </div>
      </div>

      {/* Worker Sub-navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E8E2D9] pb-3">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            activeTab === 'jobs'
              ? 'bg-[#6B4F3B] text-white shadow-sm'
              : 'text-[#6E675F] hover:text-[#2B2824] hover:bg-[#F4F0EA]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Job Requests ({myBookings.filter(b => b.status !== 'COMPLETED').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            activeTab === 'earnings'
              ? 'bg-[#6B4F3B] text-white shadow-sm'
              : 'text-[#6E675F] hover:text-[#2B2824] hover:bg-[#F4F0EA]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Earnings & 80% Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            activeTab === 'governance'
              ? 'bg-[#6B4F3B] text-white shadow-sm'
              : 'text-[#6E675F] hover:text-[#2B2824] hover:bg-[#F4F0EA]'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>Coop Governance Polls ({proposals.length})</span>
        </button>
      </div>

      {/* Tab 1: Job Feed & Lifecycle Management */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-[#2B2824]">Incoming & Active Job Bookings</h2>

          {myBookings.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#E8E2D9] text-[#6E675F] text-xs rounded-3xl">
              No active job requests. Ensure duty status is set to AVAILABLE to receive matches.
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
                        <div className="text-xs text-[#6E675F] mt-0.5">Customer: <strong className="text-[#2B2824]">{job.customer?.name}</strong> ({job.customer?.phone})</div>
                        <div className="flex items-center space-x-1 text-xs text-[#857E75] mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8B7355]" />
                          <span>{job.address}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-[#6E675F]">Your 80% Share:</div>
                        <div className="text-xl font-black text-[#6B4F3B]">₹{workerShare.toFixed(2)}</div>
                        <div className="text-[10px] text-[#857E75]">Gross Total: ₹{job.amount}</div>
                      </div>
                    </div>

                    {/* Status Actions */}
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        job.status === 'COMPLETED' ? 'bg-[#F4F0EA] text-[#6B4F3B] border border-[#8B7355]/40' :
                        job.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        job.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-stone-100 text-stone-700 border border-[#E8E2D9]'
                      }`}>
                        Status: {job.status}
                      </span>

                      <div className="flex items-center space-x-2">
                        {job.status === 'REQUESTED' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'ACCEPTED')}
                            className="px-4 py-1.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white text-xs font-extrabold shadow-sm"
                          >
                            Accept Job
                          </button>
                        )}

                        {job.status === 'ACCEPTED' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'IN_PROGRESS')}
                            className="px-4 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-sm"
                          >
                            Start Job
                          </button>
                        )}

                        {job.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'COMPLETED')}
                            className="px-4 py-1.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white text-xs font-extrabold shadow-md"
                          >
                            Mark Completed (Trigger 80/15/5 Payout)
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
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm">
              <div className="text-xs text-[#6E675F] font-semibold">Total Direct Earnings (80%)</div>
              <div className="text-2xl font-black text-[#6B4F3B] mt-1">₹{totalEarned.toFixed(2)}</div>
              <div className="text-[10px] text-[#857E75] mt-1">Released straight to worker account</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm">
              <div className="text-xs text-[#6E675F] font-semibold">Coop Welfare Contribution (15%)</div>
              <div className="text-2xl font-black text-[#8B7355] mt-1">₹{totalCoopFundContributed.toFixed(2)}</div>
              <div className="text-[10px] text-[#857E75] mt-1">Accumulated for health & equipment</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm">
              <div className="text-xs text-[#6E675F] font-semibold">Completed Jobs</div>
              <div className="text-2xl font-black text-[#2B2824] mt-1">{completedJobs.length}</div>
              <div className="text-[10px] text-[#857E75] mt-1">100% transparent fee calculation</div>
            </div>
          </div>

          {/* Recharts Stacked Breakdown */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] space-y-3 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#2B2824]">Payout Distribution per Job (80% Worker vs 15% Coop Fund)</h3>
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
                  <XAxis dataKey="name" stroke="#6E675F" fontSize={11} />
                  <YAxis stroke="#6E675F" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#FAF8F5', borderColor: '#E8E2D9', borderRadius: '12px', color: '#2B2824' }} />
                  <Bar dataKey="Worker80Pct" name="Worker Share (80%)" fill="#6B4F3B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="CoopFund15Pct" name="Coop Fund (15%)" fill="#8B7355" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cooperative Governance (1 Member 1 Vote) */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-[#E8E2D9] bg-[#F4F0EA] flex items-start space-x-3">
            <ShieldCheck className="w-6 h-6 text-[#8B7355] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold text-[#2B2824]">Democratic Worker Governance (1 Member = 1 Vote)</h3>
              <p className="text-xs text-[#524B43] mt-0.5">
                Every worker member gets equal voting power on rate changes, fund spending, and member approvals.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Proposals List */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#2B2824]">Active Cooperative Proposals</h3>

              {proposals.map((prop) => (
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
                    <span>Total Votes Cast: {prop.totalVotes || prop.votes?.length || 0}</span>
                    <span className="text-[#6B4F3B] font-bold">Click to Vote / View Results</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Voting & Results Panel */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] space-y-4 shadow-sm">
              {selectedProposal ? (
                <>
                  <div>
                    <span className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest">Cooperative Proposal Poll</span>
                    <h3 className="text-lg font-extrabold text-[#2B2824] mt-1">{selectedProposal.title}</h3>
                    <p className="text-xs text-[#524B43] mt-2 leading-relaxed">{selectedProposal.description}</p>
                  </div>

                  {votingMsg && (
                    <div className="p-3 rounded-2xl bg-[#F4F0EA] border border-[#8B7355]/30 text-[#6B4F3B] text-xs font-bold text-center">
                      {votingMsg}
                    </div>
                  )}

                  {/* Cast Vote Form if Open */}
                  {selectedProposal.status === 'OPEN' && (
                    <div className="space-y-3 pt-2 border-t border-[#E8E2D9]">
                      <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider">Cast Your Member Vote</label>
                      
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
                        Submit Democratic Vote
                      </button>
                    </div>
                  )}

                  {/* Live Results Bar Breakdown */}
                  <div className="space-y-3 pt-4 border-t border-[#E8E2D9]">
                    <h4 className="text-xs font-extrabold text-[#6E675F] uppercase tracking-wider">Live Vote Distribution</h4>

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
                  Select an active proposal on the left to cast your vote or inspect live member poll results.
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

