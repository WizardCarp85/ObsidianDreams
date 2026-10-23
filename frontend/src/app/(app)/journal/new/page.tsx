import { DreamForm } from "@/components/DreamForm";
import type { Metadata } from "next";

// This page uses Date() client-side and must not be statically prerendered
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Dream — Stardrift",
  description: "Log a new dream entry",
};

export default function NewDreamPage() {
  return <DreamForm mode="new" />;
}
