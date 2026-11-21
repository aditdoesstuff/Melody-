import { Camera, ClipboardList, Flower2, Gift, Mail, MapPin, Music, Palmtree, Plane, Shirt, Sparkles, Star, UtensilsCrossed, type LucideProps } from "lucide-react";

const MAP = { Camera, ClipboardList, Flower2, Gift, Mail, MapPin, Music, Palmtree, Plane, Shirt, Sparkles, Star, UtensilsCrossed };
export default function CatIcon({ name, ...rest }: { name: string } & LucideProps) {
  const Icon = MAP[name as keyof typeof MAP] ?? Star;
  return <Icon aria-hidden {...rest} />;
}
