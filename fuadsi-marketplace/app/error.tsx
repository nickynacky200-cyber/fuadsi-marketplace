"use client";
import { ErrorState } from "@/components/ui/primitives";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="container-x max-w-lg py-16"><ErrorState message="Something went wrong loading this page." onRetry={reset} /></div>;
}
