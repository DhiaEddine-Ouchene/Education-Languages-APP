"use client";
import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  { key: "STARTER", name: "Starter", monthly: 19, yearly: 182, popular: false, features: ["50 students", "Basic games", "Your branding"] },
  { key: "PRO", name: "Pro", monthly: 49, yearly: 470, popular: true, features: ["Unlimited students", "White-label", "Custom domain", "All 8 game types", "Advanced analytics"] },
  { key: "SCHOOL", name: "School", monthly: 199, yearly: 1910, popular: false, features: ["Multi-teacher", "LMS ready", "Priority support"] },
];

const faqs = [
  { q: "Can I try EduPlay for free?", a: "Yes. The Free plan lets you create content and run one class before upgrading." },
  { q: "What does white-label mean?", a: "On Pro and School plans, students see your brand name, logo, and colors instead of EduPlay, optionally on your own domain." },
  { q: "How do marketplace payouts work?", a: "You keep 75% of every sale. Payouts are sent monthly via Stripe Connect." },
  { q: "Can I cancel anytime?", a: "Yes, you can cancel from the billing page. Your plan stays active until the end of the period." },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="font-heading font-bold text-4xl text-center mb-3">Pricing</h1>
        <p className="text-txt-secondary text-center mb-8">Choose the plan that fits your classroom or business.</p>

        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={cn("text-sm", !annual && "font-semibold")}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={cn("w-12 h-6 rounded-pill relative transition-colors", annual ? "bg-primary" : "bg-border")}
            aria-label="Toggle annual billing"
          >
            <span className={cn("absolute top-0.5 h-5 w-5 bg-white rounded-pill transition-all", annual ? "left-6" : "left-0.5")} />
          </button>
          <span className={cn("text-sm", annual && "font-semibold")}>Annual <Badge variant="accent">Save 20%</Badge></span>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((p) => (
            <Card key={p.key} className={cn("relative", p.popular && "border-primary border-2")}>
              {p.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>}
              <CardContent className="pt-6">
                <h3 className="font-heading font-semibold text-xl mb-2">{p.name}</h3>
                <p className="mb-4">
                  <span className="font-heading font-bold text-4xl">${annual ? Math.round(p.yearly / 12) : p.monthly}</span>
                  <span className="text-txt-secondary text-sm">/mo{annual && ", billed annually"}</span>
                </p>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-accent" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/auth/register?plan=${p.key}`}>
                  <Button className="w-full" variant={p.popular ? "primary" : "outline"}>Choose {p.name}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="font-heading font-bold text-2xl text-center mb-6">Frequently asked questions</h2>
        <div className="max-w-2xl mx-auto space-y-2">
          {faqs.map((f, i) => (
            <Card key={f.q} className="overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span className="font-medium text-sm">{f.q}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", openFaq === i && "rotate-180")} />
              </button>
              {openFaq === i && <p className="px-4 pb-4 text-sm text-txt-secondary">{f.a}</p>}
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
