import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Search = { language?: string; type?: string; level?: string; price?: string };

export default async function MarketplacePage({ searchParams }: { searchParams: Search }) {
  const priceFilter = searchParams.price === "free" ? { price: 0 } : searchParams.price === "paid" ? { price: { gt: 0 } } : {};

  const [courses, games] = await Promise.all([
    searchParams.type === "game"
      ? Promise.resolve([])
      : prisma.course.findMany({
          where: {
            isPublished: true, isMarketplace: true, approved: true,
            ...(searchParams.language ? { language: searchParams.language } : {}),
            ...(searchParams.level ? { level: searchParams.level as never } : {}),
            ...priceFilter,
          },
          include: { educator: { include: { user: true } }, _count: { select: { purchases: true } } },
          orderBy: { createdAt: "desc" }, take: 30,
        }),
    searchParams.type === "course"
      ? Promise.resolve([])
      : prisma.game.findMany({
          where: { isPublished: true, isMarketplace: true, approved: true, ...priceFilter },
          include: { educator: { include: { user: true } }, _count: { select: { purchases: true } } },
          orderBy: { createdAt: "desc" }, take: 30,
        }),
  ]);

  const languages = ["Spanish", "French", "German", "English", "Italian", "Japanese"];
  const featured = courses.slice(0, 3);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="font-heading font-bold text-3xl mb-6">Marketplace</h1>

        {/* Filter bar */}
        <form className="flex flex-wrap gap-2 mb-8" method="get">
          <select name="language" defaultValue={searchParams.language ?? ""} className="h-9 rounded-btn border border-border bg-card px-2 text-sm">
            <option value="">All languages</option>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select name="type" defaultValue={searchParams.type ?? ""} className="h-9 rounded-btn border border-border bg-card px-2 text-sm">
            <option value="">Courses and games</option>
            <option value="course">Courses</option>
            <option value="game">Games</option>
          </select>
          <select name="level" defaultValue={searchParams.level ?? ""} className="h-9 rounded-btn border border-border bg-card px-2 text-sm">
            <option value="">All levels</option>
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select name="price" defaultValue={searchParams.price ?? ""} className="h-9 rounded-btn border border-border bg-card px-2 text-sm">
            <option value="">Any price</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
          <button className="h-9 px-4 rounded-btn bg-primary text-white text-sm">Filter</button>
        </form>

        {featured.length > 0 && (
          <>
            <h2 className="font-heading font-semibold text-xl mb-3">⭐ Editor picks</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {featured.map((c) => <ItemCard key={c.id} kind="course" item={c} />)}
            </div>
          </>
        )}

        <h2 className="font-heading font-semibold text-xl mb-3">Browse all</h2>
        {courses.length === 0 && games.length === 0 ? (
          <EmptyState title="Nothing here yet" description="No published content matches your filters. Check back soon!" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => <ItemCard key={c.id} kind="course" item={c} />)}
            {games.map((g) => <ItemCard key={g.id} kind="game" item={g} />)}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function ItemCard({ kind, item }: { kind: "course" | "game"; item: any }) {
  return (
    <Link href={`/marketplace`}>
      <Card className="h-full">
        <div className="h-32 bg-primary-light rounded-t-card flex items-center justify-center text-4xl">
          {kind === "course" ? "📚" : "🎮"}
        </div>
        <CardContent className="pt-3">
          <div className="flex items-center justify-between mb-1">
            <Badge variant={kind === "course" ? "default" : "accent"}>{kind}</Badge>
            <span className="font-semibold text-sm">{item.price > 0 ? formatCurrency(item.price) : "Free"}</span>
          </div>
          <h3 className="font-heading font-semibold">{item.title}</h3>
          <p className="text-xs text-txt-secondary">
            by {item.educator.brandName ?? item.educator.user.name} · {item._count.purchases} students
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
