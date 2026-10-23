import Link from "next/link";
import { Moon, Mic, BarChart3, Lock, Star, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    icon: Mic,
    title: "Log in seconds",
    desc: "Type or speak your dream the moment you wake up. Voice-to-text transcribes it instantly.",
    color: "#b9a6f5",
  },
  {
    icon: BarChart3,
    title: "See your patterns",
    desc: "AI-powered insights reveal recurring symbols, mood trends, and sleep quality correlations.",
    color: "#6fe3d9",
  },
  {
    icon: Lock,
    title: "Private & yours",
    desc: "Your dreams are encrypted and stored securely. Only you can see them.",
    color: "#f3d98b",
  },
];

const TESTIMONIALS = [
  {
    name: "Maya K.",
    text: "I've been journaling dreams for years. ObsidianDreams is the first app that actually helps me see patterns I'd never noticed.",
    stars: 5,
  },
  {
    name: "Jordan R.",
    text: "The voice recording feature is a game-changer. I barely wake up enough to speak — now I don't have to type at 3am.",
    stars: 5,
  },
  {
    name: "Sam T.",
    text: "The design is so peaceful. It actually feels right to open this app in the middle of the night.",
    stars: 5,
  },
];

// Floating star orbs — decorative
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  duration: Math.random() * 3 + 2,
  delay: Math.random() * 4,
  opacity: Math.random() * 0.5 + 0.1,
}));

export default function LandingPage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0b1024 0%, #1b2a6b 45%, #0f1535 100%)" }}
    >
      {/* Aurora blobs */}
      <div className="aurora-bg" aria-hidden="true" />

      {/* Star field */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        {STARS.map((s) => (
          <div
            key={s.id}
            className="star"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              "--duration": `${s.duration}s`,
              "--delay": `${s.delay}s`,
              "--opacity": s.opacity,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6c8eff, #b9a6f5)" }}
            >
              <Moon size={18} className="text-white" />
            </div>
            <span
              className="text-lg font-bold"
              style={{ fontFamily: "Quicksand, sans-serif", color: "#eaf0ff" }}
            >
              Obsidian<span style={{ color: "#b9a6f5" }}>Dreams</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="btn-ghost text-sm py-2 px-4">
              Sign in
            </Link>
            <Link href="/sign-up" className="btn-primary text-sm py-2 px-4">
              Get started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="text-center px-6 pt-16 pb-24 max-w-4xl mx-auto fade-up">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
            style={{
              background: "rgba(185, 166, 245, 0.12)",
              border: "1px solid rgba(185, 166, 245, 0.25)",
              color: "#b9a6f5",
              fontFamily: "Quicksand, sans-serif",
              fontWeight: 600,
            }}
          >
            <Star size={14} className="fill-current" />
            Your personal dream journal
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold mb-6"
            style={{ fontFamily: "Quicksand, sans-serif", lineHeight: 1.1 }}
          >
            <span style={{ color: "#eaf0ff" }}>Understand the stories</span>
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #6c8eff, #b9a6f5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              your mind tells at night.
            </span>
          </h1>

          <p
            className="text-xl mb-10 max-w-2xl mx-auto"
            style={{ color: "#aeb8e0", lineHeight: 1.7 }}
          >
            Log your dreams in seconds by typing or speaking. Discover patterns, 
            track moods, and unlock AI-powered insights into your inner world.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/sign-up" className="btn-primary text-base px-8 py-4">
              Start journaling — it&apos;s free
            </Link>
            <Link href="/sign-in" className="btn-secondary text-base px-8 py-4">
              I have an account
            </Link>
          </div>

          <p className="mt-5 text-sm" style={{ color: "#7781ac" }}>
            No credit card required · Private by design
          </p>
        </section>

        {/* Preview card */}
        <section className="px-6 pb-20 max-w-3xl mx-auto">
          <div
            className="glass-card p-6"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ background: "linear-gradient(135deg, #6c8eff, #b9a6f5)" }}
              >
                🌙
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ fontFamily: "Quicksand, sans-serif", color: "#eaf0ff" }}
                >
                  Flying over the ocean
                </p>
                <p className="text-xs" style={{ color: "#7781ac" }}>
                  Last night · Lucid · Peaceful
                </p>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: "#aeb8e0", lineHeight: 1.7 }}>
              I was soaring high above endless dark water, feeling completely weightless. The stars 
              were close enough to touch. I knew I was dreaming and chose to keep flying toward 
              the horizon where the sky glowed faintly gold...
            </p>
            <div className="flex items-center gap-2">
              <span className="badge badge-lucid">🌙 Lucid</span>
              <span className="badge badge-peaceful">😌 Peaceful</span>
              <span className="tag-chip">#flying</span>
              <span className="tag-chip">#ocean</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 pb-24 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass-card p-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <h3
                  className="font-semibold text-lg mb-2"
                  style={{ fontFamily: "Quicksand, sans-serif", color: "#eaf0ff" }}
                >
                  {title}
                </h3>
                <p className="text-sm" style={{ color: "#aeb8e0", lineHeight: 1.7 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 pb-24 max-w-6xl mx-auto">
          <h2
            className="text-3xl font-bold text-center mb-12"
            style={{ fontFamily: "Quicksand, sans-serif", color: "#eaf0ff" }}
          >
            Loved by dreamers
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, text, stars }) => (
              <div key={name} className="glass-card p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={14} style={{ color: "#f3d98b", fill: "#f3d98b" }} />
                  ))}
                </div>
                <p className="text-sm mb-4" style={{ color: "#aeb8e0", lineHeight: 1.7 }}>
                  &ldquo;{text}&rdquo;
                </p>
                <p className="text-sm font-semibold" style={{ color: "#b9a6f5", fontFamily: "Quicksand, sans-serif" }}>
                  {name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-24 text-center max-w-2xl mx-auto">
          <div
            className="glass-card p-12"
            style={{ position: "relative", overflow: "hidden" }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: "radial-gradient(circle at 50% 0%, #b9a6f5, transparent 60%)" }}
              aria-hidden="true"
            />
            <Moon
              size={40}
              className="mx-auto mb-4"
              style={{ color: "#b9a6f5", position: "relative" }}
            />
            <h2
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: "Quicksand, sans-serif", color: "#eaf0ff", position: "relative" }}
            >
              Ready to explore your dreams?
            </h2>
            <p className="mb-8" style={{ color: "#aeb8e0", position: "relative" }}>
              Join thousands of dreamers who journal every night.
            </p>
            <Link
              href="/sign-up"
              className="btn-primary inline-flex items-center gap-2"
              style={{ position: "relative" }}
            >
              Begin tonight <ChevronRight size={18} />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="text-center py-8 px-6"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            color: "#7781ac",
            fontSize: "0.8rem",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Moon size={14} style={{ color: "#b9a6f5" }} />
            <span style={{ fontFamily: "Quicksand, sans-serif", color: "#aeb8e0", fontWeight: 600 }}>
              ObsidianDreams
            </span>
          </div>
          <p>© {new Date().getFullYear()} ObsidianDreams · Private by design</p>
        </footer>
      </div>
    </div>
  );
}
