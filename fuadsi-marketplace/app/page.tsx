import { Flame } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { WhyChoose } from "@/components/home/WhyChoose";
import { CategoryRow } from "@/components/home/CategoryRow";
import { JoinBanner } from "@/components/home/JoinBanner";
import { TopSellers } from "@/components/home/TopSellers";
import { ProductSection } from "@/components/ProductSection";

export default function HomePage() {
  return (
    <div className="container-x space-y-4 py-3 md:space-y-5 md:py-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-5">
        <Hero />
        <WhyChoose />
      </div>
      <CategoryRow />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px]">
        <ProductSection
          title="Hot Deals"
          icon={<Flame className="h-6 w-6 fill-orange-500 text-orange-500" />}
          section="hot"
          href="/shop?section=hot"
          limit={4}
          cols="md:grid-cols-4"
          empty={{ title: "No deals yet", text: "When sellers mark items down, the best discounts will appear here." }}
        />
        <div className="space-y-4">
          <JoinBanner />
          <TopSellers />
        </div>
      </div>
      <ProductSection title="Recently Added" section="recent" href="/shop?sort=newest" limit={8} empty={{ title: "Nothing listed yet", text: "Be the first to list something for sale on FUADSI Marketplace." }} />
      <ProductSection title="Recommended Products" section="recommended" href="/shop?sort=popular" limit={8} empty={{ title: "Recommendations will appear here", text: "Popular listings, based on what students save and view, show up here." }} />
    </div>
  );
}
