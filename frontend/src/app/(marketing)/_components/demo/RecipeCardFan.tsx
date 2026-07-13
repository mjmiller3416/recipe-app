import Image from "next/image";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AIR_FRYER_POTATOES,
  APPLE_COBBLER,
  FISH_SANDWICHES,
  RIBEYE_STEAK,
  SHRIMP_PASTA,
  type DemoRecipe,
} from "./data";

interface FanCard {
  recipe: DemoRecipe;
  /** Transform applied to the positioning wrapper (rotation + offset) */
  wrapper: string;
  z: string;
  hiddenOnMobile?: boolean;
}

const FAN: FanCard[] = [
  { recipe: APPLE_COBBLER, wrapper: "-rotate-6 translate-y-4", z: "z-0", hiddenOnMobile: true },
  { recipe: RIBEYE_STEAK, wrapper: "-ml-6 -rotate-3 translate-y-2", z: "z-10" },
  { recipe: SHRIMP_PASTA, wrapper: "-ml-6", z: "z-20" },
  { recipe: FISH_SANDWICHES, wrapper: "-ml-6 rotate-3 translate-y-2", z: "z-10" },
  { recipe: AIR_FRYER_POTATOES, wrapper: "-ml-6 rotate-6 translate-y-4", z: "z-0", hiddenOnMobile: true },
];

/** A fanned hand of recipe cards — the collection you're about to build. */
export function RecipeCardFan() {
  return (
    <div aria-hidden className="relative flex items-start justify-center pb-4">
      <div className="absolute inset-x-16 inset-y-0 rounded-full bg-primary/10 blur-3xl" />
      {FAN.map(({ recipe, wrapper, z, hiddenOnMobile }) => (
        <div
          key={recipe.name}
          className={cn("relative", wrapper, z, hiddenOnMobile && "hidden sm:block")}
        >
          <Card className="w-28 gap-2 p-2 pb-3 shadow-elevated transition-transform duration-300 hover:-translate-y-2 sm:w-36">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-elevated">
              <Image src={recipe.image} alt="" fill sizes="144px" className="object-cover" />
            </div>
            <span className="truncate px-1 text-xs font-medium text-foreground">{recipe.name}</span>
          </Card>
        </div>
      ))}
    </div>
  );
}
