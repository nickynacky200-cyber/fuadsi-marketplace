import { Building2, BookOpen, Cpu, Laptop, MoreHorizontal, Shirt, ShoppingBag, Smartphone, Sparkles, UtensilsCrossed, Wrench, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { Smartphone, Laptop, Shirt, ShoppingBag, UtensilsCrossed, BookOpen, Cpu, Sparkles, Building2, Wrench, MoreHorizontal };
export const CATEGORY_ICON_NAMES = Object.keys(ICONS);

export function CategoryIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && ICONS[name]) || MoreHorizontal;
  return <Icon className={className} aria-hidden />;
}
