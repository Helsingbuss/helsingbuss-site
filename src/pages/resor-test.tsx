import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";
import TripGrid, { TripCardProps } from "@/components/trips/TripCards";

const demo: TripCardProps[] = [
  {
    id: "ex1",
    image: "https://images.unsplash.com/photo-1501117716987-c8e4f3b4fb54?q=80&w=1680&auto=format&fit=crop",
    banner: { text: "Boka tidigt och spara upp 25% per person" },
    tripKind: "Shoppingressa, Sverige",
    location: "Shoppingressa, Sverige",
    title: "Gekås Ullared",
    headline: "Häng med till Gekås Ullared",
    excerpt: "Följ med på en riktig fyndjakt till Gekås Ullared – Sveriges mest älskade shoppingparadis.",
    highlight: "Bussresa",
    priceFrom: 295,
    ctaHref: "#",
  },
  {
    id: "ex2",
    image: "https://images.unsplash.com/photo-1549633372-57e7e5d4e4cd?q=80&w=1680&auto=format&fit=crop",
    ribbon: { text: "Gör ett klipp!", angle: -12 },
    tripKind: "shopping",
    location: "Weekend",
    title: "Billiga weekendresor",
    headline: "Fynda till cityresan",
    excerpt: "Riktigt bra erbjudanden just nu – välj mellan populära storstäder.",
    highlight: "Paketresa",
    priceFrom: 2298,
    ctaHref: "#",
  },
  {
    id: "ex3",
    image: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?q=80&w=1680&auto=format&fit=crop",
    ribbon: { text: "Res 10 för 9!", angle: -10 },
    tripKind: "dagsresa",
    location: "Familjepaket",
    title: "Res med bästa gänget!",
    excerpt: "Perfekt för kompisgänget eller stora familjen – prisvärt och enkelt.",
    highlight: "Grupperbjudande",
    priceFrom: 0,
    ctaHref: "#",
  },
];

export default function ResorTestPage() {
  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="p-6 space-y-6">
          <h1 className="text-xl font-semibold text-[#194C66]">Exempel – Trip Cards</h1>
          {/* Byt mellan 3 / 4 / 5 här för antal per rad */}
          <TripGrid items={demo} cols={3} />
        </main>
      </div>
    </>
  );
}
