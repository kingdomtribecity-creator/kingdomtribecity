import Link from "next/link";

const COLUMNS = [
  {
    title: "Ecosystem",
    links: [
      { href: "/programs", label: "Rooted and Built" },
      { href: "/expressions/young-and-yielded", label: "Young & Yielded" },
      { href: "/expressions/kingdom-warrior-woman", label: "Kingdom Warrior Woman" },
      { href: "/expressions/kingdom-leaders", label: "Kingdom Leaders" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/events", label: "Events" },
      { href: "/resources", label: "Resource Library" },
      { href: "/testimonies", label: "Testimonies" },
      { href: "/vision", label: "Our Vision" },
    ],
  },
  {
    title: "Get involved",
    links: [
      { href: "/sign-up", label: "Start Your Journey" },
      { href: "/give", label: "Give" },
      { href: "/sign-in", label: "Sign in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-heading text-lg font-semibold">Kingdom Tribe City</p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              The operating system for spiritual formation — planting, rooting,
              forming, and sending Kingdom Ambassadors into every sphere of
              influence.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-medium">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kingdom Tribe City. All rights reserved.</p>
          <p>Planted → Rooted → Formed → Fruitful → Sent</p>
        </div>
      </div>
    </footer>
  );
}
