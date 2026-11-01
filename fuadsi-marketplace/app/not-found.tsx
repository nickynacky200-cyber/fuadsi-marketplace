import Link from "next/link";
import { EmptyState } from "@/components/ui/primitives";

export default function NotFound() {
  return <div className="container-x max-w-lg py-16"><EmptyState image="logo" title="Page not found" text="The page you're looking for doesn't exist or has moved." action={<Link href="/" className="btn btn-primary">Back to home</Link>} /></div>;
}
