"use client";
import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, Crown, Zap, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    key: "FREE",
    name: "Free",
    monthly: 0,
    yearly: 0,
    popular: false,
    icon: Sparkles,
    description: "Perfect for trying out EduPlay",
    features: ["1 class", "Up to 20 students per class", "Unlimited manual games", "15 AI games / month", "Core game types"],
    cta: "Get started free",
    color: "border-border",
  },
  {
    key: "PRO",
    name: "Pro",
    monthly: 12,
    yearly: 99,
    popular: true,
    icon: Zap,
    description: "For active teachers & tutors",
    features: ["Unlimited classes", "Unlimited students", "Unlimited AI games", "All game types", "PDF → game import (up to 10 pages)", "Full class analytics", "White-label branding"],
    cta: "Upgrade to Pro",
    color: "border-primary/40",
  },
  {
    key: "ULTIMATE",
    name: "Ultimate",
    monthly: 22,
    yearly: 179,
    popular: false,
    icon: Crown,
    description: "For power users & small teams",
    features: ["Everything in Pro", "Multi-chapter PDF import", "Exportable analytics (PDF/CSV)", "Co-teacher (up to 3 seats)", "Priority support", "Early access to new features"],
    cta: "Go Ultimate",
    color: "border-accent/40",
  },
];

const faqs = [
  { q: "Can I try EduPlay for free?", a: "Yes. The Free plan lets you create content and run one class with up to 20 students before upgrading." },
  { q: "How does the AI generation limit work?", a: "Free users get 15 AI-generated games or vocabulary sets per month. Pro and Ultimate users get unlimited AI generation." },
  { q: "What does white-label mean?", a: "On Pro and Ultimate plans, your students see your brand name, logo, and colors instead of EduPlay, optionally on your own domain." },
  { q: "Can I cancel anytime?", a: "Yes, you can cancel from the billing page. Your plan stays active until the end of the billing period — no questions asked." },
  { q: "What payment methods are accepted?", a: "We use Lemon Squeezy for secure payment processing. All major credit and debit cards are accepted." },
  { q: "Is there a student limit?", a: "Free plans are limited to ~20 students per class. Pro and Ultimate plans have no student limits." },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero section */}
        <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
          <Badge variant="accent" className="mb-4 text-xs">Simple, transparent pricing</Badge>
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-3">
            The right plan for{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              every teacher
            </span>
          </h1>
          <p className="text-txt-secondary text-lg max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, no surprises.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-10 mb-12">
            <span className={cn("text-sm transition-colors", !annual && "font-semibold text-foreground")}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn("w-12 h-6 rounded-full relative transition-colors", annual ? "bg-accent" : "bg-border")}
              aria-label="Toggle annual billing"
            >
              <span className={cn("absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-sm transition-all", annual ? "left-6" : "left-0.5")} />
            </button>
            <span className={cn("text-sm transition-colors flex items-center gap-1.5", annual && "font-semibold text-foreground")}>
              Annual
              {annual && <Badge variant="accent" className="text-[10px] px-1.5">Save ~31%</Badge>}
            </span>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid md:grid-cols-3 gap-5 lg:gap-6 items-start">
            {plans.map((p) => {
              const price = annual ? p.yearly : p.monthly;
              const Icon = p.icon;

              return (
                <Card
                  key={p.key}
                  className={cn(
                    "relative border-2 transition-all duration-200",
                    p.popular ? "border-primary shadow-lg shadow-primary/5 scale-[1.02]" : p.color,
                    p.popular ? "bg-card" : "bg-card/80"
                  )}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge variant="accent" className="text-xs px-3 py-0.5 shadow-md">Most popular</Badge>
                    </div>
                  )}

                  <CardContent className="pt-6 pb-6">
                    {/* Icon + name */}
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        p.key === "ULTIMATE" ? "bg-accent/10" : "bg-primary/10"
                      )}>
                        <Icon className={cn("h-4 w-4", p.key === "ULTIMATE" ? "text-accent" : "text-primary")} />
                      </div>
                      <h3 className="font-heading font-bold text-xl">{p.name}</h3>
                    </div>

                    <p className="text-xs text-txt-secondary mb-4">{p.description}</p>

                    {/* Price */}
                    <div className="mb-5">
                      <div className="flex items-baseline gap-0.5">
                        <span className="font-heading font-bold text-4xl">${price}</span>
                        <span className="text-txt-secondary text-sm">
                          /{annual ? "year" : "month"}
                        </span>
                      </div>
                      {annual && p.yearly > 0 && (
                        <p className="text-xs text-accent mt-0.5">
                          ~${Math.round(p.yearly / 12)}/mo billed annually
                        </p>
                      )}
                      {p.monthly === 0 && (
                        <p className="text-xs text-txt-secondary mt-0.5">Free forever</p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-txt-secondary">
                          <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link href={p.monthly === 0 ? "/auth/register" : "/dashboard/billing"}>
                      <Button
                        className="w-full gap-1.5"
                        variant={p.popular ? "primary" : p.key === "ULTIMATE" ? "accent" : "outline"}
                      >
                        {p.cta}
                        {p.monthly > 0 && <ArrowRight className="h-3.5 w-3.5" />}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Comparison table */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <h2 className="font-heading font-bold text-2xl text-center mb-8">Compare features</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Feature</th>
                    <th className="text-center py-3 px-4 font-medium">Free</th>
                    <th className="text-center py-3 px-4 font-medium text-primary">Pro</th>
                    <th className="text-center py-3 px-4 font-medium text-accent">Ultimate</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Classes", "1", "Unlimited", "Unlimited"],
                    ["Students per class", "~20", "Unlimited", "Unlimited"],
                    ["Manual word-list games", "Unlimited", "Unlimited", "Unlimited"],
                    ["AI-generated games", "15/month", "Unlimited", "Unlimited"],
                    ["PDF import", "—", "Up to 10 pages", "Multi-chapter"],
                    ["Game types", "Core 2–3", "All types", "All types"],
                    ["Class analytics", "Basic", "Full", "Full + export"],
                    ["Co-teacher seats", "—", "—", "Up to 3"],
                    ["White-label branding", "—", "✓", "✓"],
                    ["Priority support", "—", "—", "✓"],
                    ["Early access", "—", "—", "✓"],
                  ].map(([feature, free, pro, ultimate], i) => (
                    <tr key={feature} className={cn("border-b border-border last:border-0", i % 2 === 0 && "bg-muted/20")}>
                      <td className="py-2.5 px-4 font-medium">{feature}</td>
                      <td className="text-center py-2.5 px-4 text-txt-secondary">{free === "✓" ? <Check className="h-4 w-4 text-accent mx-auto" /> : free === "—" ? <span className="text-txt-secondary/40">—</span> : free}</td>
                      <td className="text-center py-2.5 px-4 text-txt-secondary">{pro === "✓" ? <Check className="h-4 w-4 text-accent mx-auto" /> : pro === "—" ? <span className="text-txt-secondary/40">—</span> : pro}</td>
                      <td className="text-center py-2.5 px-4 text-txt-secondary">{ultimate === "✓" ? <Check className="h-4 w-4 text-accent mx-auto" /> : ultimate === "—" ? <span className="text-txt-secondary/40">—</span> : ultimate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto px-4 pb-20">
          <h2 className="font-heading font-bold text-2xl text-center mb-2">Frequently asked questions</h2>
          <p className="text-txt-secondary text-sm text-center mb-8">Everything you need to know about our plans and billing.</p>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <Card key={f.q} className="overflow-hidden border-border">
                <button className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-medium text-sm">{f.q}</span>
                  <ChevronDown className={cn("h-4 w-4 text-txt-secondary transition-transform shrink-0 ml-4", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-txt-secondary leading-relaxed">{f.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
