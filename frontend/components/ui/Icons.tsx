import {
  Wifi, CookingPot, Car, Waves, Bath, Snowflake, Flame, WashingMachine, Laptop, Tv, FlameKindling,
  Umbrella, Sailboat, Mountain, Trees, Utensils, PawPrint, Dumbbell, PlugZap, Coffee, Check,
  Eye, TentTree, Palmtree, Wheat, Building2, Home, Tent, Droplets, MountainSnow, Gem, type LucideIcon,
} from "lucide-react";

const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi, "cooking-pot": CookingPot, car: Car, waves: Waves, bath: Bath, snowflake: Snowflake,
  flame: Flame, "washing-machine": WashingMachine, laptop: Laptop, tv: Tv, "flame-kindling": FlameKindling,
  umbrella: Umbrella, sailboat: Sailboat, mountain: Mountain, trees: Trees, utensils: Utensils,
  "paw-print": PawPrint, dumbbell: Dumbbell, "plug-zap": PlugZap, coffee: Coffee,
};

export function AmenityIcon({ name, className = "size-6" }: { name: string; className?: string }) {
  const Icon = AMENITY_ICONS[name] ?? Check;
  return <Icon className={className} strokeWidth={1.5} aria-hidden />;
}

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "amazing-views": Eye,
  cabins: TentTree,
  beachfront: Palmtree,
  countryside: Wheat,
  design: Building2,
  "tiny-homes": Home,
  pools: Droplets,
  mountains: MountainSnow,
  lakefront: Sailboat,
  unique: Gem,
};
export { Tent };
