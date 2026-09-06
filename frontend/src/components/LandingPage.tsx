import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowRight, DollarSign, Vote, CheckCircle2, Sparkles, Building2, ChevronRight, XCircle, Layers } from 'lucide-react';
import FlowingCanvas from './FlowingCanvas';

interface LandingPageProps {
  onStartBooking: () => void;
  onExploreGov: () => void;
}

/* 3D Interactive Tilt Card Component */
const TiltCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [shadow, setShadow] = useState('0 10px 30px -15px rgba(0,0,0,0.5)');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`);
    setShadow(`${-rotateY * 2}px ${rotateX * 2 + 25}px 40px -10px rgba(220, 180, 120, 0.25)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setShadow('0 10px 30px -15px rgba(0,0,0,0.5)');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, boxShadow: shadow, transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out' }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </div>
  );
};

/* Animated 3D Wave Particle Canvas (Matching Reference Image 2 Card Ribbons) */
const CardWaveCanvas: React.FC<{ seed: number }> = ({ seed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth || 300;
      canvas.height = canvas.parentElement.clientHeight || 240;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      time += 0.015;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h * 0.45;
      const numPoints = 160;

      ctx.save();

      // Draw smooth continuous organic 3D ribbons
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        const layerOffset = layer * 0.45;

        for (let i = 0; i <= numPoints; i++) {
          const t = (i / numPoints) * Math.PI * 2;
          let x = 0;
          let y = 0;

          if (seed === 0) {
            // Torus Mobius loop ribbon (Card 1)
            const r = Math.min(w, h) * 0.32 + Math.sin(t * 3 + time + layerOffset) * 12;
            x = cx + Math.cos(t + time * 0.4) * r + Math.sin(t * 2 + time) * 14;
            y = cy + Math.sin(t + time * 0.4) * (r * 0.65) + Math.cos(t * 3 + time) * 10;
          } else if (seed === 1) {
            // Vertical S-curve ribbon loop (Card 2)
            const r = Math.min(w, h) * 0.35;
            x = cx + Math.sin(t * 2 + time + layerOffset) * (r * 0.8);
            y = cy + (t - Math.PI) * (r * 0.5) + Math.cos(t * 3 + time) * 12;
          } else {
            // Double helix parametric spiral (Card 3)
            const r = Math.min(w, h) * 0.3;
            x = cx + Math.cos(t * 3 + time + layerOffset) * (r * 0.85) + Math.sin(t + time) * 12;
            y = cy + Math.sin(t * 2 + time * 0.8) * (r * 0.65);
          }

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = layer === 0 ? 'rgba(235, 195, 140, 0.85)' : layer === 1 ? 'rgba(185, 145, 95, 0.55)' : 'rgba(139, 115, 85, 0.3)';
        ctx.lineWidth = layer === 0 ? 3 : 1.5;
        ctx.shadowColor = 'rgba(235, 195, 140, 0.6)';
        ctx.shadowBlur = 12;
        ctx.stroke();
      }

      // Sparkle particles floating around ribbon
      for (let p = 0; p < 20; p++) {
        const pt = (p / 20) * Math.PI * 2;
        const px = cx + Math.cos(pt * (seed + 2) + time * 0.7) * (w * 0.32);
        const py = cy + Math.sin(pt * (seed + 1) + time * 0.5) * (h * 0.32);

        ctx.beginPath();
        ctx.arc(px, py, 2 + Math.sin(time + p) * 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 215, 160, 0.85)';
        ctx.shadowColor = 'rgba(245, 215, 160, 0.8)';
        ctx.shadowBlur = 8;
        ctx.fill();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [seed]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity duration-500" />;
};

export const LandingPage: React.FC<LandingPageProps> = ({ onStartBooking, onExploreGov }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-24 py-6 sm:py-12">

      {/* Hero Section with Continuously Flowing Canvas */}
      <section className="relative min-h-[520px] sm:min-h-[580px] flex flex-col items-center justify-center text-center px-4 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xl transition-colors duration-200">

        {/* Animated Canvas background */}
        <FlowingCanvas className="opacity-80" />

        {/* Ambient atmospheric lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[var(--accent)]/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Content container */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-8 py-12 flex flex-col items-center">

          {/* Top Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[var(--border)] border border-[var(--border)] text-[var(--accent)] text-xs font-semibold tracking-wide shadow-sm backdrop-blur-md animate-float">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>National Worker Cooperative Platform</span>
          </div>

          {/* Main Title Hierarchy */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-[var(--text-primary)] tracking-tight leading-[1.1] max-w-3xl">
            Fair Household Services Built Around{' '}
            <span className="gradient-text font-black">Worker Cooperatives</span>
          </h1>

          {/* Subtitle with refined readability */}
          <p className="text-[var(--text-secondary)] text-base sm:text-lg font-normal leading-relaxed max-w-2xl text-balance">
            {t('hero_desc')}
          </p>

          {/* Single Clear CTA with Dynamic Ambient Glow & Secondary Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">

            {/* Primary Action: Floating Glow Pill Button */}
            <div className="cta-glow-wrapper">
              <button
                onClick={onStartBooking}
                className="relative z-10 flex items-center space-x-3 px-8 py-4 rounded-full bg-[var(--accent)] hover:opacity-90 text-[var(--accent-cta-text)] font-extrabold text-base shadow-xl transition-all transform hover:scale-[1.03] active:scale-95 group"
              >
                <span>Explore Services & Book</span>
                <div className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4 stroke-[3] text-[var(--accent-cta-text)]" />
                </div>
              </button>
            </div>

            {/* Secondary Action Link */}
            <button
              onClick={onExploreGov}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-full bg-[var(--surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm transition-all shadow-sm"
            >
              <Building2 className="w-4 h-4 text-[var(--accent)]" />
              <span>Ministry & Admin Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            </button>

          </div>

        </div>
      </section>

      {/* SECTION 1: Upper 2 Cards */}
      <section className="space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold text-[var(--accent)] uppercase tracking-widest bg-[var(--border)] px-3 py-1 rounded-full border border-[var(--border)]">
            Cooperative Economics
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Why KataLyst Disrupts Traditional Gig Platforms
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Comparing typical commercial gig apps vs. democratic worker cooperative platform model
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Left Upper Card: Corporate Gig Platforms */}
          <div className="rounded-[32px] bg-[var(--surface)] border border-[var(--border)] p-7 space-y-6 shadow-xl flex flex-col justify-between group hover:border-[var(--accent)] transition-all duration-300">
            <div className="space-y-6">
              {/* Upper Visual Header Box */}
              <div className="h-52 rounded-2xl bg-[var(--border)] border border-[var(--border)] relative overflow-hidden flex items-center justify-center p-6 group-hover:scale-[1.01] transition-transform duration-300">
                <span className="absolute top-4 left-4 px-3 py-1 bg-rose-950/40 text-rose-400 border border-rose-500/20 text-[10px] font-semibold uppercase tracking-wider rounded-full backdrop-blur-md">
                  Corporate Gig Platforms
                </span>

                {/* Subtle 3D Friction Graphic Illustration */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-xl" />
                  <div className="w-24 h-24 rounded-3xl bg-[var(--surface)] border border-rose-500/20 shadow-xl flex flex-col items-center justify-center space-y-1 transform rotate-6 group-hover:rotate-12 transition-transform">
                    <XCircle className="w-9 h-9 text-rose-400" />
                    <span className="text-[10px] font-mono font-medium text-rose-400">30% CUT</span>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Commercial / Corporate Gig Apps</h3>

              <ul className="space-y-3.5 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start space-x-3">
                  <XCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong className="text-[var(--text-primary)] font-medium">20-30% Commission Fee</strong> taken by corporate shareholders</span>
                </li>
                <li className="flex items-start space-x-3">
                  <XCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong className="text-[var(--text-primary)] font-medium">Zero Worker Ownership</strong> — gig workers treated as disposable contractors</span>
                </li>
                <li className="flex items-start space-x-3">
                  <XCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong className="text-[var(--text-primary)] font-medium">Arbitrary Rate Drops & Bans</strong> without any democratic right to appeal</span>
                </li>
                <li className="flex items-start space-x-3">
                  <XCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>No insurance or welfare funds reinvested into worker families</span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <button className="px-5 py-2 rounded-xl bg-[var(--border)] text-xs font-semibold text-[var(--text-primary)] border border-[var(--border)] transition-all shadow-sm">
                Learn More
              </button>
            </div>
          </div>

          {/* Right Upper Card: KataLyst Cooperatives */}
          <div className="rounded-[32px] bg-[var(--surface)] border border-[var(--border)] p-7 space-y-6 shadow-xl flex flex-col justify-between group hover:border-[var(--accent)] transition-all duration-300">
            <div className="space-y-6">
              {/* Upper Visual Header Box */}
              <div className="h-52 rounded-2xl bg-[var(--border)] border border-[var(--border)] relative overflow-hidden flex items-center justify-center p-6 group-hover:scale-[1.01] transition-transform duration-300">
                <span className="absolute top-4 left-4 px-3 py-1 bg-[var(--accent)] text-[var(--accent-cta-text)] text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-md">
                  KataLyst Model
                </span>

                {/* Glossy 3D Gold/Bronze Token Illustration */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[var(--accent)]/20 blur-xl animate-pulse" />
                  <div className="w-24 h-24 rounded-3xl bg-[var(--surface)] border border-[var(--accent)]/40 shadow-2xl flex flex-col items-center justify-center space-y-1 transform -rotate-6 group-hover:-rotate-12 transition-transform">
                    <CheckCircle2 className="w-10 h-10 text-[var(--accent)]" />
                    <span className="text-[10px] font-mono font-bold text-[var(--accent)]">80% WORKER</span>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">KataLyst Cooperatives</h3>

              <ul className="space-y-3.5 text-sm text-[var(--text-primary)]">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                  <span><strong className="text-[var(--text-primary)] font-extrabold">80% Direct to Worker</strong> — maximum earnings per booking</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                  <span><strong className="text-[var(--text-primary)] font-extrabold">15% Cooperative Fund</strong> — worker health insurance & equipment grants</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                  <span><strong className="text-[var(--text-primary)] font-extrabold">5% Platform Fee</strong> — lean open-technology maintenance</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                  <span><strong className="text-[var(--text-primary)] font-extrabold">1-Member-1-Vote Governance</strong> — workers vote on rate revisions</span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <button className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-cta-text)] text-xs font-bold transition-all shadow-md">
                Learn More
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: Lower 3 Cards */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold text-[var(--accent)] uppercase tracking-widest bg-[var(--border)] px-3 py-1 rounded-full border border-[var(--border)]">
            Core Platform Pillars
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Built for Transparency, Equity & Intelligence
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Card 1: Transparent 80/15/5 Split */}
          <TiltCard className="rounded-[32px] bg-gradient-to-b from-[#131D21] via-[#0E1619] to-[#091012] border border-[#22333B] p-7 h-[420px] flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-2xl">
            <CardWaveCanvas seed={0} />
            <div className="z-10 flex justify-between items-start">
              <span className="px-3 py-1 rounded-full bg-[#8B7355]/15 border border-[#8B7355]/30 text-[#DBC5A5] text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
                01 / Financial Split
              </span>
              <DollarSign className="w-5 h-5 text-[#DBC5A5]" />
            </div>

            <div className="z-10 space-y-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-amber-200 transition-colors tracking-tight font-serif">
                {t('split_card_title', 'Transparent 80/15/5 Split')}
              </h3>
              <p className="text-xs sm:text-sm text-[#9BB0B9] leading-relaxed">
                {t('split_card_desc', 'Every booking receipt explicitly breaks down worker earnings, cooperative reserve funds, and platform maintenance fee before payment.')}
              </p>
            </div>
          </TiltCard>

          {/* Card 2: Democratic Governance */}
          <TiltCard className="rounded-[32px] bg-gradient-to-b from-[#131D21] via-[#0E1619] to-[#091012] border border-[#22333B] p-7 h-[420px] flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-2xl">
            <CardWaveCanvas seed={1} />
            <div className="z-10 flex justify-between items-start">
              <span className="px-3 py-1 rounded-full bg-[#8B7355]/15 border border-[#8B7355]/30 text-[#DBC5A5] text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
                02 / Governance
              </span>
              <Vote className="w-5 h-5 text-[#DBC5A5]" />
            </div>

            <div className="z-10 space-y-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-amber-200 transition-colors tracking-tight font-serif">
                {t('governance_card_title', 'Democratic Governance')}
              </h3>
              <p className="text-xs sm:text-sm text-[#9BB0B9] leading-relaxed">
                {t('governance_card_desc', 'Workers vote on rate changes, equipment investments, and new member approvals. One member equals one vote.')}
              </p>
            </div>
          </TiltCard>

          {/* Card 3: AI Smart Match Scoring */}
          <TiltCard className="rounded-[32px] bg-gradient-to-b from-[#131D21] via-[#0E1619] to-[#091012] border border-[#22333B] p-7 h-[420px] flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-2xl">
            <CardWaveCanvas seed={2} />
            <div className="z-10 flex justify-between items-start">
              <span className="px-3 py-1 rounded-full bg-[#8B7355]/15 border border-[#8B7355]/30 text-[#DBC5A5] text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
                03 / Match Engine
              </span>
              <Sparkles className="w-5 h-5 text-[#DBC5A5]" />
            </div>

            <div className="z-10 space-y-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-amber-200 transition-colors tracking-tight font-serif">
                {t('match_card_title', 'AI Smart Match Scoring')}
              </h3>
              <p className="text-xs sm:text-sm text-[#9BB0B9] leading-relaxed">
                {t('match_card_desc', 'Transparent algorithm ranks workers by proximity, rating, availability, and skill match with clear score tooltips.')}
              </p>
            </div>
          </TiltCard>

        </div>
      </section>

    </div>
  );
};

export default LandingPage;
