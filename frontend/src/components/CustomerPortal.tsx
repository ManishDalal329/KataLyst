import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Star, Sparkles, CheckCircle2, Clock, Calendar, Info, ShieldCheck, DollarSign, X, ArrowRight, Bookmark, Loader2, UserCheck, AlertCircle } from 'lucide-react';

const WORKER_AVATARS: Record<string, string> = {
  'Amit Kumar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'Ravi Malhotra': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'Pooja Verma': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'Meena Devi': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  'Sanjay Singh': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  'Lakshmi Narayan': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
  'Kavitha Reddy': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
  'Ananth Murthy': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
};

const COVER_GRADIENTS = [
  'from-[#E8E2D9] via-[#D5CCBF] to-[#A89680]/60',
  'from-[#D5CCBF] via-[#A89680]/50 to-[#8B7355]/40',
  'from-[#F4F0EA] via-[#E8E2D9] to-[#D5CCBF]',
  'from-[#A89680]/40 via-[#D5CCBF] to-[#E8E2D9]',
];

const FALLBACK_CATEGORIES = [
  { id: 'cat-1', name: 'Cleaning & Sanitation', base_rate: 699.0 },
  { id: 'cat-2', name: 'Plumbing Services', base_rate: 499.0 },
  { id: 'cat-3', name: 'Electrical Works', base_rate: 549.0 },
  { id: 'cat-4', name: 'Academic Tutoring', base_rate: 800.0 },
  { id: 'cat-5', name: 'Elder & Caregiving', base_rate: 1200.0 },
  { id: 'cat-6', name: 'Appliance Repair', base_rate: 750.0 }
];

export const CustomerPortal: React.FC = () => {
  const { t } = useTranslation();
  const { user, quickLoginAs } = useAuth();
  const [categories, setCategories] = useState<any[]>(FALLBACK_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [workers, setWorkers] = useState<any[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  
  // Selected Worker for Booking Modal
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [bookingAddress, setBookingAddress] = useState('Flat 402, Green Park Heights, Sector 14');
  const [instructions, setInstructions] = useState('Please bring standard tools');
  const [bookingTime, setBookingTime] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  // Active Customer Bookings & Socket
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<any | null>(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('Excellent service!');

  // Tooltip hover state for AI match explanation
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    loadWorkers('');
    if (user) {
      loadMyBookings();
    }
  }, [user]);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => {
      if (user) loadMyBookings();
    };
    socket.on('global_booking_update', handleUpdate);
    return () => {
      socket.off('global_booking_update', handleUpdate);
    };
  }, [user]);

  const loadCategories = async () => {
    try {
      const data = await fetchApi('/categories');
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const loadWorkers = async (catName: string) => {
    setLoadingWorkers(true);
    try {
      const query = catName ? `?category=${encodeURIComponent(catName)}` : '';
      const data = await fetchApi(`/workers/search${query}`);
      if (Array.isArray(data)) {
        setWorkers(data);
      }
    } catch (e) {
      console.error('Failed to search workers', e);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const loadMyBookings = async () => {
    setLoadingBookings(true);
    try {
      const data = await fetchApi('/bookings/mine');
      if (Array.isArray(data)) {
        setMyBookings(data);
      }
    } catch (e) {
      console.error('Failed to load my bookings', e);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleCategoryClick = (catName: string) => {
    const newCat = selectedCategory === catName ? '' : catName;
    setSelectedCategory(newCat);
    loadWorkers(newCat);
  };

  const filteredWorkers = workers.filter((worker) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = worker.user?.name?.toLowerCase() || '';
    const skills = worker.skills?.toLowerCase() || '';
    const coop = worker.cooperative?.name?.toLowerCase() || '';
    return name.includes(q) || skills.includes(q) || coop.includes(q);
  });

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await quickLoginAs('9900112233', 'CUSTOMER');
    }

    setIsSubmitting(true);
    setBookingSuccessMsg('');
    try {
      const baseAmount = selectedWorker.categoryAmount || 699.0;
      await fetchApi('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          worker_id: selectedWorker.id,
          category_id: selectedWorker.categoryId || categories[0]?.id,
          scheduled_time: bookingTime,
          address: bookingAddress,
          instructions,
          amount: baseAmount
        })
      });

      setBookingSuccessMsg(t('success'));
      setTimeout(() => {
        setSelectedWorker(null);
        setBookingSuccessMsg('');
        loadMyBookings();
      }, 1500);
    } catch (e: any) {
      alert(e.message || t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingBooking) return;
    try {
      await fetchApi(`/bookings/${ratingBooking.id}/rate`, {
        method: 'POST',
        body: JSON.stringify({
          score: ratingScore,
          comment: ratingComment
        })
      });
      setRatingBooking(null);
      loadMyBookings();
    } catch (e: any) {
      alert(e.message || t('error'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            {t('status_completed')}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200">
            {t('status_in_progress')}
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-800 border border-blue-200">
            {t('status_accepted')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-50 text-red-800 border border-red-200">
            {t('status_cancelled')}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-stone-100 text-stone-700 border border-stone-200">
            {t('status_requested')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-10 py-4">
      
      {/* Customer Header Banner */}
      <div className="p-6 rounded-3xl border border-[#E8E2D9] bg-gradient-to-r from-white via-[#FAF8F5] to-[#F4F0EA] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[#8B7355]" />
            <h1 className="text-2xl font-extrabold text-[#2B2824]">{t('cust_portal_title')}</h1>
          </div>
          <p className="text-xs text-[#6E675F] mt-1">{t('cust_portal_sub')}</p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 text-[#857E75] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_worker_placeholder')}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E8E2D9] rounded-2xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B] shadow-sm"
          />
        </div>
      </div>

      {/* Category Selection Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#2B2824]">{t('service_categories')}</h2>
          </div>
          {selectedCategory && (
            <button
              onClick={() => handleCategoryClick('')}
              className="text-xs font-bold text-[#6B4F3B] hover:underline"
            >
              {t('all_categories')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <div
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border text-center ${
                  isSelected
                    ? 'border-[#6B4F3B] bg-[#F4F0EA] shadow-md scale-[1.02]'
                    : 'border-[#E8E2D9] bg-white hover:border-[#8B7355] hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="text-xs font-bold text-[#2B2824] mb-1 truncate">{cat.name}</div>
                <div className="text-[11px] font-extrabold text-[#6B4F3B]">₹{cat.base_rate} {t('base_rate_label')}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Smart Match Workers List */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#8B7355] animate-pulse" />
            <h2 className="text-xl font-extrabold text-[#2B2824]">
              {t('available_coop_workers')} {selectedCategory && `(${selectedCategory})`}
            </h2>
          </div>
          <span className="text-[11px] text-[#6E675F]">{t('smart_match_tooltip_title')}: 40% Proximity, 30% Rating, 20% Avail, 10% Skill</span>
        </div>

        {loadingWorkers ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-3xl border border-[#E8E2D9] bg-white p-5 space-y-4 animate-pulse">
                <div className="h-20 bg-stone-100 rounded-2xl"></div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-stone-200 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-stone-200 rounded w-2/3"></div>
                    <div className="h-2 bg-stone-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-8 bg-stone-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          /* Empty State */
          <div className="p-12 rounded-3xl bg-white border border-[#E8E2D9] text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#8B7355] mx-auto" />
            <div className="text-sm font-bold text-[#2B2824]">{t('no_workers_found')}</div>
            <button
              onClick={() => { setSelectedCategory(''); setSearchQuery(''); loadWorkers(''); }}
              className="px-4 py-2 rounded-full bg-[#6B4F3B] text-white text-xs font-bold"
            >
              {t('all_categories')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((worker, index) => {
              const matchedCategoryObj = categories.find(c => selectedCategory ? c.name === selectedCategory : true) || categories[0];
              const categoryAmount = matchedCategoryObj ? matchedCategoryObj.base_rate : 699.0;
              const categoryId = matchedCategoryObj ? matchedCategoryObj.id : '';
              const workerName = worker.user?.name || 'Worker Member';
              const avatarUrl = WORKER_AVATARS[workerName] || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250`;
              const gradientCover = COVER_GRADIENTS[index % COVER_GRADIENTS.length];

              return (
                <div
                  key={worker.id}
                  className="rounded-3xl border border-[#E8E2D9] bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Decorative Banner */}
                    <div className={`h-24 bg-gradient-to-r ${gradientCover} relative p-3 flex justify-between items-start`}>
                      <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm text-[10px] font-bold text-[#2B2824] shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-[#8B7355]" />
                        <span>{t('verified_member')}</span>
                      </div>

                      {/* Smart Match Score Badge with Tooltip */}
                      <div className="relative">
                        <div
                          onMouseEnter={() => setActiveTooltipId(worker.id)}
                          onMouseLeave={() => setActiveTooltipId(null)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#6B4F3B] text-white text-xs font-bold cursor-pointer shadow-md"
                        >
                          <Sparkles className="w-3 h-3 text-amber-200" />
                          <span>{worker.matchScore || 94}% {t('smart_match_score')}</span>
                        </div>

                        {/* Tooltip Popup explaining scoring logic */}
                        {activeTooltipId === worker.id && worker.matchBreakdown && (
                          <div className="absolute right-0 top-8 z-30 w-64 p-3 rounded-2xl bg-[#2B2824] border border-[#6E675F] shadow-2xl text-[11px] text-[#FAF8F5] space-y-1.5 pointer-events-none">
                            <div className="font-bold text-white text-xs border-b border-[#524B43] pb-1 mb-1 flex items-center justify-between">
                              <span>{t('smart_match_tooltip_title')}</span>
                              <span className="text-amber-300">{worker.matchScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('proximity_label')} (40%):</span>
                              <span className="font-mono text-white">{worker.matchBreakdown.proximityScore}% ({worker.matchBreakdown.distanceKm}km)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('rating_label')} (30%):</span>
                              <span className="font-mono text-white">{worker.matchBreakdown.ratingScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('availability_label')} (20%):</span>
                              <span className="font-mono text-white">{worker.matchBreakdown.availabilityScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('skills_label')} (10%):</span>
                              <span className="font-mono text-white">{worker.matchBreakdown.skillMatchScore}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Overlapping Avatar Photo */}
                    <div className="px-5 -mt-9 flex items-end justify-between relative z-10 mb-3">
                      <img
                        src={avatarUrl}
                        alt={workerName}
                        className="w-16 h-16 rounded-full border-4 border-white object-cover shadow-md bg-white"
                      />
                    </div>

                    {/* Card Content Details */}
                    <div className="px-5 space-y-3">
                      <div>
                        <h3 className="font-extrabold text-[#2B2824] text-lg leading-tight group-hover:text-[#6B4F3B] transition-colors">
                          {workerName}
                        </h3>
                        <p className="text-xs font-semibold text-[#8B7355] mt-0.5">{worker.cooperative?.name}</p>
                        <div className="flex items-center space-x-1 mt-1 text-[#6E675F] text-[11px]">
                          <MapPin className="w-3 h-3 text-[#8B7355]" />
                          <span>{worker.cooperative?.district}, {worker.cooperative?.state}</span>
                        </div>
                      </div>

                      {/* Skills Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {worker.skills?.split(',').map((skill: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#F4F0EA] border border-[#E8E2D9] text-[11px] font-medium text-[#6B4F3B]">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>

                      {/* Stats Divider Row */}
                      <div className="flex items-center justify-between text-xs pt-3 border-t border-[#E8E2D9]">
                        <div className="flex items-center space-x-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="font-extrabold text-[#2B2824] text-sm">{worker.rating_avg?.toFixed(1) || '4.9'}</span>
                          <span className="text-[#857E75] text-[11px]">(15+ jobs)</span>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[11px] text-[#6E675F]">{t('base_rate_label')}: </span>
                          <span className="text-base font-black text-[#2B2824]">₹{categoryAmount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA Button */}
                  <div className="p-5 pt-3">
                    <button
                      onClick={() => {
                        setSelectedWorker({
                          ...worker,
                          categoryAmount,
                          categoryId
                        });
                      }}
                      className="w-full py-3 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2 group-hover:shadow-lg"
                    >
                      <span>{t('book_service_btn')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Booking Transparent Price Breakdown Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50  flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm animate-fadeIn ">
          <div className="relative w-full max-w-lg p-6 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-5">
            
            <button
              onClick={() => setSelectedWorker(null)}
              className="absolute top-4 right-4 text-[#857E75] hover:text-[#2B2824] p-1 rounded-full hover:bg-[#F4F0EA]"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-[#2B2824]">{t('booking_modal_title')}</h3>
              <p className="text-xs text-[#6E675F] mt-0.5">{selectedWorker.user?.name} ({selectedWorker.cooperative?.name})</p>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold text-center">
                {bookingSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4">
                
                {/* Address & Instructions */}
                <div>
                  <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider mb-1">
                    {t('scheduled_time_label')}
                  </label>
                  <input
                    type="datetime-local"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider mb-1">
                    {t('address_label')}
                  </label>
                  <input
                    type="text"
                    value={bookingAddress}
                    onChange={(e) => setBookingAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                    placeholder={t('address_placeholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider mb-1">
                    {t('instructions_label')}
                  </label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                    placeholder={t('instructions_placeholder')}
                  />
                </div>

                {/* 80/15/5 Payout Breakdown Card */}
                <div className="p-4 rounded-2xl bg-[#F4F0EA] border border-[#E8E2D9] space-y-2.5">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#6B4F3B] border-b border-[#E8E2D9] pb-2">
                    <ShieldCheck className="w-4 h-4 text-[#8B7355]" />
                    <span>{t('transparent_price_breakdown')}</span>
                  </div>

                  <div className="flex justify-between text-xs text-[#524B43]">
                    <span>{t('worker_gets_share')}:</span>
                    <span className="font-bold text-[#2B2824]">₹{(selectedWorker.categoryAmount * 0.80).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-xs text-[#524B43]">
                    <span>{t('coop_fund_share')}:</span>
                    <span className="font-bold text-[#8B7355]">₹{(selectedWorker.categoryAmount * 0.15).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-xs text-[#524B43]">
                    <span>{t('platform_fee_share')}:</span>
                    <span className="font-bold text-[#6E675F]">₹{(selectedWorker.categoryAmount * 0.05).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-extrabold text-[#2B2824] pt-2 border-t border-[#E8E2D9]">
                    <span>{t('total_payable')}:</span>
                    <span className="text-[#6B4F3B] text-base font-black">₹{selectedWorker.categoryAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('creating_booking')}</span>
                    </>
                  ) : (
                    <span>{t('confirm_booking_btn')}</span>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Customer Booking History & Real-Time Status Tracker */}
      <section className="space-y-4 pt-6 border-t border-[#E8E2D9]">
        <h2 className="text-xl font-extrabold text-[#2B2824]">{t('my_bookings_title')}</h2>

        {loadingBookings ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="p-5 rounded-2xl bg-white border border-[#E8E2D9] animate-pulse h-20"></div>
            ))}
          </div>
        ) : myBookings.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-[#E8E2D9] text-center space-y-2">
            <Bookmark className="w-8 h-8 text-[#8B7355] mx-auto opacity-40" />
            <div className="text-sm font-bold text-[#2B2824]">{t('no_bookings_yet')}</div>
            <p className="text-xs text-[#6E675F] max-w-md mx-auto">{t('no_bookings_desc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myBookings.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-[#2B2824] text-base">{b.category?.name || 'Household Service'}</span>
                    {getStatusBadge(b.status)}
                  </div>

                  <p className="text-xs text-[#6E675F] mt-1">
                    {t('customer_label')}: <strong className="text-[#2B2824]">{b.worker?.user?.name}</strong> ({b.worker?.cooperative?.name})
                  </p>
                  <p className="text-[11px] text-[#857E75]">{b.address}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-base font-black text-[#6B4F3B]">₹{b.amount}</div>
                    {b.payout && (
                      <div className="text-[10px] text-[#6E675F]">{t('worker_gets_share')}: ₹{b.payout.worker_share}</div>
                    )}
                  </div>

                  {b.status === 'COMPLETED' && !b.rating && (
                    <button
                      onClick={() => setRatingBooking(b)}
                      className="px-3.5 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-xs font-bold transition-all"
                    >
                      {t('rate_service_btn')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rating Modal */}
      {ratingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm p-6 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-4">
            <button
              onClick={() => setRatingBooking(null)}
              className="absolute top-3 right-3 text-[#857E75] hover:text-[#2B2824]"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#2B2824] text-center">{t('rate_modal_title')}</h3>

            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  onClick={() => setRatingScore(s)}
                  className={`w-8 h-8 cursor-pointer transition-all ${
                    s <= ratingScore ? 'text-amber-500 fill-amber-500 scale-110' : 'text-[#D5CCBF]'
                  }`}
                />
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              className="w-full p-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
              rows={3}
              placeholder={t('rate_comment_placeholder')}
            />

            <button
              onClick={handleRatingSubmit}
              className="w-full py-3 rounded-full bg-[#6B4F3B] text-white font-bold text-xs shadow-md"
            >
              {t('submit_rating_btn')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerPortal;
