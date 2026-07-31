import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductMap from "@/components/ProductMap";

export const metadata: Metadata = {
  title: "产品说明思维导图",
};

export default function ProductMapPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/ops" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-brand-deep">
        <ArrowLeft size={14} />返回运营看板
      </Link>
      <ProductMap />
    </div>
  );
}
