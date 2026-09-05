import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Star, Sparkles, CheckCircle2, Clock, Calendar, Info, ShieldCheck, DollarSign, X, ArrowRight, Bookmark } from 'lucide-react';

const WORKER_AVATARS: Record<string, string> = {
  'Amit Kumar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'Ravi Malhotra': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'Pooja Verma': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'Meena Devi': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  'Sanjay Singh': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  'Lakshmi Narayan': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
};

const COVER_GRADIENTS = [
  'from-[#E8E2D9] via-[#D5CCBF] to-[#A89680]/60',
  'from-[#D5CCBF] via-[#A89680]/50 to-[#8B7355]/40',
  'from-[#F4F0EA] via-[#E8E2D9] to-[#D5CCBF]',
  'from-[#A89680]/40 via-[#D5CCBF] to-[#E8E2D9]',
];

export const CustomerPortal: React.FC = () => {
  const { user, quickLoginAs } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [workers, setWorkers] = useState<any[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  // Selected Worker for Booking Modal
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [bookingAddress, setBookingAddress] = useState('Flat 402, Green Park Heights, Sector 14');
  const [instructions, setInstructions] = useState('Please bring standard tools');
  const [bookingTime, setBookingTime] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  // Active Customer Bookings & Socket
  const [myBookings, setMyBookings] = useState<any[]>([]);
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
    socket.on('global_booking_update', () => {
      if (user) loadMyBookings();
    });
    return () => {
      socket.off('global_booking_update');
    };
  }, [user]);

  const loadCategories = async () => {
    try {
      const data = await fetchApi('/categories');
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const loadWorkers = async (catName: string) => {
    setLoadingWorkers(true);
    try {
      const query = catName ? `?category=${encodeURIComponent(catName)}` : '';
      const data = await fetchApi(`/workers/search${query}`);
      setWorkers(data);
    } catch (e) {
      console.error('Failed to search workers', e);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const loadMyBookings = async () => {
    try {
      const data = await fetchApi('/bookings/mine');
      setMyBookings(data);
    } catch (e) {
      console.error('Failed to load my bookings', e);
    }
  };

  const handleCategoryClick = (catName: string) => {
    const newCat = selectedCategory === catName ? '' : catName;
    setSelectedCategory(newCat);
    loadWorkers(newCat);
  };

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

      setBookingSuccessMsg('Booking requested successfully! Worker notified.');
      setTimeout(() => {
        setSelectedWorker(null);
        setBookingSuccessMsg('');
        loadMyBookings();
      }, 1500);
    } catch (e: any) {
      alert(e.message || 'Failed to request booking');
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
      alert(e.message || 'Failed to submit rating');
    }
  };

  return (
    <div className="space-y-10 py-4">

      {/* Category Selection Carousel/Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#2B2824]">Browse Household & Community Services</h2>
            <p className="text-xs text-[#6E675F]">Select a category to view smart AI-ranked cooperative workers near you</p>
          </div>
          {selectedCategory && (
            <button
              onClick={() => handleCategoryClick('')}
              className="text-xs font-bold text-[#6B4F3B] hover:underline"
            >
              Clear Filter
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
                className={`p-4 rounded-2xl cursor-pointer transition-all border text-center ${isSelected
                  ? 'border-[#6B4F3B] bg-[#F4F0EA] shadow-md'
                  : 'border-[#E8E2D9] bg-white hover:border-[#8B7355] hover:bg-[#FAF8F5]'
                  }`}
              >
                <div className="text-xs font-bold text-[#2B2824] mb-1 truncate">{cat.name}</div>
                <div className="text-[11px] font-extrabold text-[#6B4F3B]">₹{cat.base_rate} base</div>
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
              AI Smart-Ranked Cooperative Workers {selectedCategory && `(${selectedCategory})`}
            </h2>
          </div>
          <span className="text-[11px] text-[#6E675F]">Ranked by Proximity (40%), Rating (30%), Availability (20%), Skill (10%)</span>
        </div>

        {loadingWorkers ? (
          <div className="p-12 text-center text-[#6E675F] text-sm">Searching cooperative worker database...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((worker, index) => {
              const matchedCategoryObj = categories.find(c => selectedCategory ? c.name === selectedCategory : true) || categories[0];
              const categoryAmount = matchedCategoryObj ? matchedCategoryObj.base_rate : 699.0;
              const categoryId = matchedCategoryObj ? matchedCategoryObj.id : '';
              const workerName = worker.user?.name || 'Worker Member';
              const avatarUrl = WORKER_AVATARS[workerName] || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250`;
              const gradientCover = COVER_GRADIENTS[index % COVER_GRADIENTS.length];

              return (
                /* Card matching Image 5 (Reference 5) design */
                <div
                  key={worker.id}
                  className="rounded-3xl border border-[#E8E2D9] bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >

                  <div>
                    {/* Top Decorative Banner */}
                    <div className={`h-24 bg-gradient-to-r ${gradientCover} relative p-3 flex justify-between items-start`}>
                      <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm text-[10px] font-bold text-[#2B2824] shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-[#8B7355]" />
                        <span>Verified Member</span>
                      </div>

                      {/* Smart Match Score Badge with Tooltip */}
                      <div className="relative">
                        <div
                          onMouseEnter={() => setActiveTooltipId(worker.id)}
                          onMouseLeave={() => setActiveTooltipId(null)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#6B4F3B] text-white text-xs font-bold cursor-pointer shadow-md"
                        >
                          <Sparkles className="w-3 h-3 text-amber-200" />
                          <span>{worker.matchScore || 92}% Match</span>
                        </div>

                        {/* Tooltip Popup explaining scoring logic */}
                        {activeTooltipId === worker.id && worker.matchBreakdown && (
                          <div className="absolute right-0 top-8 z-30 w-64 p-3 rounded-2xl bg-[#2B2824] border border-[#6E675F] shadow-2xl text-[11px] text-[#FAF8F5] space-y-1.5 pointer-events-none">
                            <div className="font-bold text-white text-xs border-b border-[#524B43] pb-1 mb-1 flex items-center justify-between">
                              <span>Smart Match Transparency</span>
                              <span className="text-amber-300">{worker.matchScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Proximity Score (40%):</span>
                              <span className="font-mono text-white">{worker.matchBreakdown.proximityScore}% ({worker.matchBreakdown.distanceKm}km)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rating Score (30%):</span>
                              <span className="font-mono text-white">{worker.matchBreakdown.ratingScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Availability (20%):</span>
                              <span className="font-mono text-white">{worker.matchBreakdown.availabilityScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Exact Skill Match (10%):</span>
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
                        {worker.skills.split(',').map((skill: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#F4F0EA] border border-[#E8E2D9] text-[11px] font-medium text-[#6B4F3B]">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>

                      {/* Stats Divider Row */}
                      <div className="flex items-center justify-between text-xs pt-3 border-t border-[#E8E2D9]">
                        <div className="flex items-center space-x-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="font-extrabold text-[#2B2824] text-sm">{worker.rating_avg.toFixed(1)}</span>
                          <span className="text-[#857E75] text-[11px]">(15+ jobs)</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-[#6E675F]">Base Rate: </span>
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
                      <span>Book Service & View Breakdown</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-5">

            <button
              onClick={() => setSelectedWorker(null)}
              className="absolute top-4 right-4 text-[#857E75] hover:text-[#2B2824] p-1 rounded-full hover:bg-[#F4F0EA]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-[#2B2824]">Confirm Booking & Transparent Pricing</h3>
              <p className="text-xs text-[#6E675F] mt-0.5">Booking with {selectedWorker.user?.name} ({selectedWorker.cooperative?.name})</p>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-[#F4F0EA] border border-[#8B7355]/40 text-[#6B4F3B] text-sm font-bold text-center">
                {bookingSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4">

                {/* Address & Instructions */}
                <div>
                  <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider mb-1">Service Address</label>
                  <input
                    type="text"
                    value={bookingAddress}
                    onChange={(e) => setBookingAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6E675F] uppercase tracking-wider mb-1">Instructions / Notes</label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
                  />
                </div>

                {/* 80/15/5 Payout Breakdown Card */}
                <div className="p-4 rounded-2xl bg-[#F4F0EA] border border-[#E8E2D9] space-y-2.5">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#6B4F3B] border-b border-[#E8E2D9] pb-2">
                    <ShieldCheck className="w-4 h-4 text-[#8B7355]" />
                    <span>Transparent Payout Guarantee (Cooperative Model)</span>
                  </div>

                  <div className="flex justify-between text-xs text-[#524B43]">
                    <span>Worker Direct Share (80%):</span>
                    <span className="font-bold text-[#2B2824]">₹{(selectedWorker.categoryAmount * 0.80).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-xs text-[#524B43]">
                    <span>Cooperative Welfare Fund (15%):</span>
                    <span className="font-bold text-[#8B7355]">₹{(selectedWorker.categoryAmount * 0.15).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-xs text-[#524B43]">
                    <span>Platform Tech Maintenance (5%):</span>
                    <span className="font-bold text-[#6E675F]">₹{(selectedWorker.categoryAmount * 0.05).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-extrabold text-[#2B2824] pt-2 border-t border-[#E8E2D9]">
                    <span>Total Service Rate:</span>
                    <span className="text-[#6B4F3B] text-base font-black">₹{selectedWorker.categoryAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-extrabold text-sm shadow-md transition-all"
                >
                  {isSubmitting ? 'Confirming Booking...' : 'Confirm Booking & Notify Worker'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Customer Booking History & Real-Time Status Tracker */}
      {user && (
        <section className="space-y-4 pt-6 border-t border-[#E8E2D9]">
          <h2 className="text-xl font-extrabold text-[#2B2824]">My Active & Past Bookings</h2>

          {myBookings.length === 0 ? (
            <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] text-center text-[#6E675F] text-xs">
              No bookings requested yet. Click "Book Service" above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map((b) => (
                <div key={b.id} className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-[#2B2824] text-base">{b.category?.name || 'Household Service'}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${b.status === 'COMPLETED' ? 'bg-[#F4F0EA] text-[#6B4F3B] border border-[#8B7355]/40' :
                        b.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          b.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            'bg-stone-100 text-stone-700'
                        }`}>
                        {b.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#6E675F] mt-1">Worker: <strong className="text-[#2B2824]">{b.worker?.user?.name}</strong> ({b.worker?.cooperative?.name})</p>
                    <p className="text-[11px] text-[#857E75]">{b.address}</p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-base font-black text-[#6B4F3B]">₹{b.amount}</div>
                      {b.payout && (
                        <div className="text-[10px] text-[#6E675F]">Worker 80%: ₹{b.payout.worker_share}</div>
                      )}
                    </div>

                    {b.status === 'COMPLETED' && !b.rating && (
                      <button
                        onClick={() => setRatingBooking(b)}
                        className="px-3.5 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-xs font-bold transition-all"
                      >
                        Rate Service
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Rating Modal */}
      {ratingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2824]/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm p-6 rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl space-y-4">
            <button
              onClick={() => setRatingBooking(null)}
              className="absolute top-3 right-3 text-[#857E75] hover:text-[#2B2824]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#2B2824] text-center">Rate Your Service Experience</h3>

            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  onClick={() => setRatingScore(s)}
                  className={`w-8 h-8 cursor-pointer transition-all ${s <= ratingScore ? 'text-amber-500 fill-amber-500 scale-110' : 'text-[#D5CCBF]'
                    }`}
                />
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              className="w-full p-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs text-[#2B2824] focus:outline-none focus:border-[#6B4F3B]"
              rows={3}
              placeholder="Leave feedback..."
            />

            <button
              onClick={handleRatingSubmit}
              className="w-full py-3 rounded-full bg-[#6B4F3B] text-white font-bold text-xs shadow-md"
            >
              Submit Rating & Review
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerPortal;

