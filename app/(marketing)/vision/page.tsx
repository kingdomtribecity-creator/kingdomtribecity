import type { Metadata } from "next";
import { PathwayStrip } from "@/components/marketing/pathway-strip";
import { BRAND_GRADIENT } from "@/lib/gradients";

export const metadata: Metadata = { title: "Our Vision" };

export default function VisionPage() {
  return (
    <div>
      <section className="text-white" style={{ backgroundImage: BRAND_GRADIENT }}>
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
            Our Vision
          </p>
          <h1 className="mt-6 font-heading text-4xl font-semibold leading-tight sm:text-5xl">
            Raising Kingdom Ambassadors for every sphere of society.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-6 px-4 py-16 text-lg leading-relaxed text-muted-foreground sm:px-6">
        <p>
          Kingdom Tribe City exists to raise and equip Kingdom Ambassadors.
          The vision is not simply gathering believers, but forming people
          who are deeply rooted in Christ, spiritually mature, transformed in
          identity and character, equipped for their God-given assignments,
          and deployed as Kingdom representatives into every sphere of
          influence.
        </p>
        <p>
          Our core philosophy is simple: before people build externally, God
          builds internally. God plants people, roots them, forms them, and
          releases them to bear fruit. Our job is to give that internal work
          structure, community, and momentum.
        </p>
        <p>
          The end product is a believer who carries the nature, wisdom,
          excellence, creativity, and influence of Christ into families,
          healthcare, business, technology, government, education, media,
          ministry, and nations.
        </p>
      </section>

      <section className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-heading text-2xl font-semibold">The transformation pathway</h2>
          <PathwayStrip className="mt-10" />
        </div>
      </section>
    </div>
  );
}
