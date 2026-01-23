import SectionTitle from "../components/sections/SectionTitle";
import ServiceCards from "../components/sections/ServiceCards";

import HeroHeader from "../components/home/HeroHeader";

export default function HomePage() {
  return (
    <main className="hb-page">
      <HeroHeader />
      <SectionTitle
  title="BekvÃ¤ma bussresor  skrÃ¤ddarsydda fÃ¶r dig"
  subtitle="Trygg bestÃ¤llningstrafik fÃ¶r smÃ¥ och stora grupper, med paketresor som gÃ¶r allt enklare."
/>
      <ServiceCards />
</main>
  );
}








