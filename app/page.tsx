import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gamepad2, Palette, Store, BarChart3, Users, Zap, Star } from "lucide-react";

const features = [
  { icon: Gamepad2, title: "8 Game Types", desc: "Flashcards, quizzes, dictation, memory, speed rounds and more." },
  { icon: Palette, title: "White-Label Branding", desc: "Your name, logo, colors, and even your own custom domain." },
  { icon: Store, title: "Marketplace", desc: "Sell your courses and games. Keep 75% of every sale." },
  { icon: BarChart3, title: "Deep Analytics", desc: "Track engagement, most-missed words, and student progress." },
  { icon: Users, title: "Class Management", desc: "Invite codes, assignments, leaderboards, and live sessions." },
  { icon: Zap, title: "Gamification", desc: "XP, levels, streaks, and badges keep students coming back." },
];

const steps = [
  { n: "1", title: "Create content", desc: "Add vocabulary sets and build interactive games in minutes." },
  { n: "2", title: "Invite students", desc: "Create classes with invite codes and assign games with due dates." },
  { n: "3", title: "Grow and earn", desc: "Track progress, sell on the marketplace, and build your brand." },
];

const testimonials = [
  { quote: "My students beg for homework now. The streak system is magic.", name: "Ana M., Spanish teacher" },
  { quote: "I white-labeled the app and sell my French courses under my own brand.", name: "Luc D., content creator" },
  { quote: "Setup took one afternoon. Analytics show me exactly which words to review.", name: "Sofia K., school director" },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-heading font-bold text-4xl md:text-5xl leading-tight mb-4">
              Build and sell <span className="text-primary">language learning games</span> under your own brand
            </h1>
            <p className="text-txt-secondary text-lg mb-6">
              EduPlay is the white-label platform for educators and creators. Create interactive courses, gamify learning, and get paid.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register"><Button size="lg">Get started free</Button></Link>
              <Link href="/marketplace"><Button size="lg" variant="outline">Browse marketplace</Button></Link>
            </div>
          </div>
          <div className="relative">
            <Card className="p-6 rotate-2">
              <div className="flex items-center justify-between mb-4">
                <span className="font-heading font-semibold">Speed Round ⚡</span>
                <span className="text-warning font-bold">🔥 12 day streak</span>
              </div>
              <div className="h-3 bg-primary-light rounded-pill mb-4"><div className="h-3 bg-primary rounded-pill w-2/3" /></div>
              <p className="text-2xl font-heading font-bold mb-2">¿Cómo se dice “apple”?</p>
              <div className="grid grid-cols-2 gap-2">
                {["manzana", "naranja", "pera", "uva"].map((w) => (
                  <div key={w} className="border border-border rounded-btn px-3 py-2 text-sm text-center">{w}</div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="font-heading font-bold text-3xl text-center mb-10">Everything you need to teach and earn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-5">
                  <div className="h-10 w-10 rounded-btn bg-primary-light flex items-center justify-center mb-3">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-txt-secondary">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-primary-light/50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-heading font-bold text-3xl text-center mb-10">How it works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((s) => (
                <div key={s.n} className="text-center">
                  <div className="h-12 w-12 rounded-pill bg-primary text-white font-heading font-bold flex items-center justify-center mx-auto mb-3">{s.n}</div>
                  <h3 className="font-heading font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-txt-secondary">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="font-heading font-bold text-3xl text-center mb-10">Loved by educators</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <CardContent className="pt-5">
                  <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}</div>
                  <p className="text-sm mb-3">“{t.quote}”</p>
                  <p className="text-xs text-txt-secondary font-medium">{t.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="font-heading font-bold text-3xl mb-3">Simple pricing</h2>
          <p className="text-txt-secondary mb-6">Start free. Upgrade when your classroom grows.</p>
          <Link href="/pricing"><Button size="lg">See plans</Button></Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
