import Link from "next/link";
import { BRAND_GRADIENT } from "@/lib/gradients";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <Link href="/" className="mb-10 font-heading text-lg font-semibold tracking-tight">
          Kingdom Tribe City
        </Link>
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
      <div
        className="hidden flex-col justify-end p-12 text-white lg:flex"
        style={{ backgroundImage: BRAND_GRADIENT }}
      >
        <blockquote className="font-heading text-3xl leading-snug">
          &ldquo;Before you build externally, God builds internally.&rdquo;
        </blockquote>
        <p className="mt-4 max-w-md text-white/80">
          Planted, rooted, formed, fruitful, sent — the pathway to becoming a
          Kingdom Ambassador starts here.
        </p>
      </div>
    </div>
  );
}
