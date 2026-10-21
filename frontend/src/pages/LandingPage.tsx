import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  CheckCircle2,
  Star,
  Zap,
  BarChart3,
  Brain,
  ChevronRight,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// --- Floating product preview card ---
const ProductPreview: React.FC = () => (
  <div className="ambient-orb relative w-full max-w-md mx-auto">
    {/* Main interview card */}
    <div className="bg-white rounded-3xl border border-[#E8E6DF] shadow-xl p-6 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#2E8B68] animate-pulse"></div>
          <span className="text-xs font-semibold text-[#2E8B68] uppercase tracking-wider">Live Interview</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#777B73]">Q2 of 5</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-1.5 w-5 rounded-full ${i <= 2 ? 'bg-[#174D3A]' : 'bg-[#E8E6DF]'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-[#FAF8F3] rounded-2xl p-4 mb-4">
        <div className="flex gap-2 mb-2">
          <span className="bg-[#EAE5F7] text-[#5b4b8a] text-xs font-semibold px-2 py-0.5 rounded-lg">Behavioral</span>
        </div>
        <p className="text-sm font-medium text-[#282A27] leading-relaxed">
          Tell me about a time you led a team through a difficult technical challenge. What was your approach?
        </p>
      </div>

      {/* Answer area */}
      <div className="border border-[#E8E6DF] rounded-xl p-3 mb-4 min-h-[72px]">
        <p className="text-xs text-[#777B73] leading-relaxed">
          In my last role, our team faced a critical deadline with a complex API migration...
          <span className="inline-block w-0.5 h-3.5 bg-[#174D3A] ml-0.5 animate-pulse align-text-bottom"></span>
        </p>
      </div>

      {/* Score preview */}
      <div className="bg-[#E4F0E8] rounded-xl p-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[#174D3A]">Previous answer score</p>
          <p className="text-xs text-[#2E8B68]">Strong leadership narrative ✓</p>
        </div>
        <div className="w-10 h-10 bg-[#174D3A] rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-sm">8</span>
        </div>
      </div>
    </div>

    {/* Floating feedback card */}
    <div className="absolute -bottom-5 -left-8 bg-white rounded-2xl border border-[#E8E6DF] shadow-lg p-4 w-52 z-20">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 bg-[#EAE5F7] rounded-lg flex items-center justify-center">
          <Brain className="w-4 h-4 text-[#5b4b8a]" />
        </div>
        <span className="text-xs font-semibold text-[#282A27]">AI Insight</span>
      </div>
      <p className="text-xs text-[#777B73] leading-snug">Great use of the STAR framework. Add specific metrics.</p>
    </div>

    {/* Floating score card */}
    <div className="absolute -top-4 -right-6 bg-white rounded-2xl border border-[#E8E6DF] shadow-lg p-4 z-20">
      <p className="text-xs text-[#777B73] mb-1">Session Score</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-[#174D3A]">8.4</span>
        <span className="text-sm text-[#777B73]">/ 10</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <TrendingUp className="w-3 h-3 text-[#2E8B68]" />
        <span className="text-xs text-[#2E8B68] font-medium">+1.2 from last</span>
      </div>
    </div>
  </div>
);

// --- Benefits ---
const benefits = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'AI-Personalized Questions',
    description: 'Questions tailored to your role, experience, and interview type — no two sessions are alike.',
    color: 'bg-[#EAE5F7] text-[#5b4b8a]',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Instant Actionable Feedback',
    description: 'Get scored on relevance, communication, and depth immediately after every answer.',
    color: 'bg-[#fde8e4] text-[#c0624e]',
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: 'Confidence-Building Practice',
    description: 'Repeat, iterate, and improve. Build real muscle memory for interview scenarios.',
    color: 'bg-[#E4F0E8] text-[#174D3A]',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Progress Tracking',
    description: 'Track your score trends, identify weak spots, and watch yourself improve over time.',
    color: 'bg-[#FAF8F3] text-[#282A27]',
  },
];

// --- Steps ---
const steps = [
  {
    num: '01',
    title: 'Choose Your Role',
    description: 'Select your target job role, experience level, interview type, and difficulty.',
    color: 'bg-[#E4F0E8]',
  },
  {
    num: '02',
    title: 'Practice with AI Questions',
    description: 'Answer AI-generated questions in a focused, distraction-free interview environment.',
    color: 'bg-[#EAE5F7]',
  },
  {
    num: '03',
    title: 'Review & Improve',
    description: 'Get detailed feedback, suggested answers, and track your improvement over time.',
    color: 'bg-[#fde8e4]',
  },
];

// --- Testimonials (static) ---
const testimonials = [
  { name: 'Priya S.', role: 'Frontend Engineer', quote: 'The AI feedback was shockingly specific. I landed my first FAANG offer after 3 weeks of practice.', rating: 5 },
  { name: 'Marcus T.', role: 'Product Manager', quote: 'The behavioral question training completely transformed how I structure my answers. Game changer.', rating: 5 },
  { name: 'Lin W.', role: 'Data Scientist', quote: 'Having a practice partner available at midnight before my interview was invaluable. Highly recommended.', rating: 5 },
];

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative isolate overflow-hidden px-6 pb-20 pt-28">
        <div aria-hidden="true" className="soft-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] opacity-70" />
        <div aria-hidden="true" className="ambient-orb pointer-events-none absolute -right-36 top-20 -z-10 h-96 w-96 rounded-full bg-[#d7ebdc]/65 blur-3xl" />
        <div aria-hidden="true" className="ambient-orb-delay pointer-events-none absolute -left-40 top-64 -z-10 h-80 w-80 rounded-full bg-[#e8e5f7]/65 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#E4F0E8] text-[#174D3A] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by AI Interview Intelligence
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-[#282A27] leading-[1.1] tracking-tight mb-6">
                Your Next Interview<br />
                <span className="text-[#2E8B68]">Could Change</span><br />
                Everything.
              </h1>

              <p className="text-lg text-[#777B73] leading-relaxed mb-8 max-w-lg">
                Practice smarter, speak with confidence, and discover what recruiters are really looking for.
                Your personal AI interview coach is here to help you get interview-ready.
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <Link
                  to="/interview/setup"
                  className="inline-flex items-center gap-2 bg-[#174D3A] text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-[#2E8B68] transition-colors shadow-md text-sm"
                >
                  Start Your First Interview
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 border border-[#E8E6DF] text-[#282A27] font-semibold px-7 py-3.5 rounded-xl hover:border-[#174D3A] hover:text-[#174D3A] transition-colors text-sm bg-white"
                >
                  Explore How It Works
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 text-sm text-[#777B73]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2E8B68]" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2E8B68]" />
                  <span>AI-powered feedback</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2E8B68]" />
                  <span>No signup needed</span>
                </div>
              </div>
            </div>

            {/* Right: Product preview */}
            <div className="relative hidden lg:flex justify-end pr-8">
              <ProductPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ─── BENEFITS ─── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#282A27] mb-3">Everything you need to ace your interview</h2>
            <p className="text-[#777B73] max-w-xl mx-auto">
              From AI-personalized questions to detailed feedback — it's all here.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="feature-card bg-[#FAF8F3] rounded-2xl border border-[#E8E6DF] p-6"
              >
                <div className={`w-10 h-10 rounded-xl ${benefit.color} flex items-center justify-center mb-4`}>
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-[#282A27] mb-2 text-sm">{benefit.title}</h3>
                <p className="text-xs text-[#777B73] leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#282A27] mb-3">How it works</h2>
            <p className="text-[#777B73]">Three simple steps to interview mastery.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-[#E8E6DF] z-0" />

            {steps.map((step, i) => (
              <div key={step.num} className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center mb-5 border border-[#E8E6DF]`}>
                  <span className="text-2xl font-bold text-[#174D3A]">{step.num}</span>
                </div>
                <h3 className="font-bold text-[#282A27] mb-2">{step.title}</h3>
                <p className="text-sm text-[#777B73] leading-relaxed">{step.description}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute right-0 top-8 translate-x-1/2 w-5 h-5 text-[#E8E6DF]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#282A27] mb-3">Loved by job seekers</h2>
            <p className="text-[#777B73]">Real results from real practice sessions.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="feature-card bg-[#FAF8F3] rounded-2xl border border-[#E8E6DF] p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#174D3A] text-[#174D3A]" />
                  ))}
                </div>
                <p className="text-sm text-[#282A27] leading-relaxed mb-5">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-sm text-[#282A27]">{t.name}</p>
                  <p className="text-xs text-[#777B73]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-[#174D3A] rounded-3xl p-14">
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Your dream role deserves<br />your best answer.
            </h2>
            <p className="text-[#a8c5b5] mb-8 text-base">
              Start practicing now and walk into your next interview with genuine confidence.
            </p>
            <Link
              to="/interview/setup"
              className="inline-flex items-center gap-2 bg-white text-[#174D3A] font-bold px-8 py-4 rounded-xl hover:bg-[#E4F0E8] transition-colors shadow-lg text-sm"
            >
              Start Practicing Today
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
