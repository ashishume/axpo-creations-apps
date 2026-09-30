import { motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles, Brain, LayoutGrid } from "lucide-react";
import { APPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ProductAction = {
  label: string;
  href: string;
  /** external: new tab; route: SPA Link; page: full-page navigation to a static page. */
  kind: "external" | "route" | "page";
  variant?: "default" | "outline" | "ghost";
  className?: string;
};

type ProductCard = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  logoSrc: string;
  category: { label: string; icon: typeof Sparkles };
  platforms: string;
  features: string[];
  actions: ProductAction[];
  accent: {
    glow: string;
    badge: string;
    check: string;
    hover: string;
    logoShadow: string;
  };
};

const products: ProductCard[] = [
  {
    id: "tracker",
    title: APPS.tracker.name,
    tagline: "Expense manager",
    description:
      "Smart expense tracking, group splits, and lending insights in one app. Personal budgets, shared bills, and optional premium Lend with AI-powered reports.",
    logoSrc: "/axpo-mark.png",
    category: { label: "AI • Finance", icon: Sparkles },
    platforms: "Android & iOS",
    features: [
      "Expense tracker: income, categories, fixed costs, investments & monthly CSV export",
      "Expense splitter: groups, flexible splits, balances, settlements & activity logs",
      "Premium Lend: contacts, loans, due dates, insights & regenerable AI report",
      "Voice input, receipt scan, Google or email sign-in, light/dark theme",
    ],
    actions: [
      { label: "App Store", href: APPS.tracker.iosUrl, kind: "external" },
      { label: "Google Play", href: APPS.tracker.androidUrl, kind: "external", variant: "outline" },
      { label: "Explore AXPO", href: "/expense-tracker-app", kind: "route", variant: "ghost" },
    ],
    accent: {
      glow: "from-primary/16 to-cyan-300/10",
      badge: "bg-primary/90",
      check: "text-green-500",
      hover: "hover:shadow-primary/10 hover:border-primary/25",
      logoShadow: "drop-shadow-[0_8px_18px_rgba(68,34,112,0.22)]",
    },
  },
  {
    id: "mindstrike",
    title: APPS.mindstrike.name,
    tagline: "Arena for minds",
    description:
      "Quick maths challenges for iPhone. Step into a 90-second ranked duel or practise at your own pace, and follow your progress one session at a time.",
    logoSrc: "/mindstrike/icon.png",
    category: { label: "Game • Puzzle", icon: Brain },
    platforms: "iPhone • iOS 17+",
    features: [
      "90-second ranked maths duels with live players or simulated opponents",
      "Climb seven leagues as your Power Rating grows",
      "Solo practice: five difficulties, 30–120 second timers & personal bests",
      "Six colour themes, avatars, training goals, music & haptics",
    ],
    actions: [
      { label: "App Store", href: APPS.mindstrike.iosUrl, kind: "external", className: "bg-teal-600 hover:bg-teal-700" },
      { label: "Learn more", href: APPS.mindstrike.siteUrl, kind: "page", variant: "outline" },
    ],
    accent: {
      glow: "from-teal-400/20 to-amber-300/10",
      badge: "bg-teal-600 hover:bg-teal-600",
      check: "text-teal-500",
      hover: "hover:shadow-teal-500/10 hover:border-teal-500/30",
      logoShadow: "drop-shadow-[0_8px_18px_rgba(21,124,112,0.28)]",
    },
  },
];

function ActionButton({ action }: { action: ProductAction }) {
  const content = (
    <>
      {action.label}
      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
    </>
  );
  const className = "inline-flex items-center justify-center";

  return (
    <Button asChild variant={action.variant ?? "default"} className={cn("w-full group", action.className)}>
      {action.kind === "external" ? (
        <a href={action.href} target="_blank" rel="noopener noreferrer" className={className}>
          {content}
        </a>
      ) : action.kind === "route" ? (
        <Link href={action.href} className={className}>
          {content}
        </Link>
      ) : (
        // Static pages live outside the SPA, so use a normal anchor.
        <a href={action.href} className={className}>
          {content}
        </a>
      )}
    </Button>
  );
}

export function Features() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="apps" className="relative py-24 bg-slate-50 dark:bg-slate-900/50 overflow-hidden scroll-mt-16">
      <motion.div
        aria-hidden="true"
        className="absolute -right-32 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        animate={reduceMotion ? undefined : { y: [0, 36, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -left-32 bottom-10 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl"
        animate={reduceMotion ? undefined : { y: [0, -30, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="container mx-auto px-4">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduceMotion ? 0 : 0.58, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 text-primary">
            <LayoutGrid className="w-3.5 h-3.5" /> App catalogue
          </Badge>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Our apps</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Thoughtfully built mobile apps from AxpoCreation, from everyday money management to quick-fire maths duels.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
          {products.map((product, index) => {
            const CategoryIcon = product.category.icon;
            return (
              <motion.div
                key={product.id}
                id={`app-${product.id}`}
                className="scroll-mt-24"
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                whileHover={reduceMotion ? undefined : { y: -8, scale: 1.01 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.12, duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card
                  className={cn(
                    "relative flex h-full flex-col overflow-hidden border-border/50 shadow-sm hover:shadow-2xl transition-all duration-500",
                    product.accent.hover
                  )}
                >
                  <motion.div
                    aria-hidden="true"
                    className={cn(
                      "absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br blur-2xl",
                      product.accent.glow
                    )}
                    animate={reduceMotion ? undefined : { scale: [1, 1.18, 1], opacity: [0.45, 0.8, 0.45] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        className={cn("relative w-14 h-14 shrink-0 flex items-center justify-center", product.accent.logoShadow)}
                        whileHover={reduceMotion ? undefined : { rotate: -5, scale: 1.08 }}
                      >
                        <img
                          src={product.logoSrc}
                          alt={`${product.title} logo`}
                          className="w-14 h-14 rounded-2xl object-contain"
                        />
                      </motion.div>
                      <div>
                        <CardTitle className="text-2xl font-bold">{product.title}</CardTitle>
                        <p className="text-sm font-medium text-muted-foreground">{product.tagline}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="default" className={cn("w-fit gap-1", product.accent.badge)}>
                        <CategoryIcon className="w-3 h-3" /> {product.category.label}
                      </Badge>
                      <Badge variant="secondary" className="w-fit">{product.platforms}</Badge>
                    </div>
                    <CardDescription className="text-base">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-3">
                      {product.features.map((feature, i) => (
                        <motion.li
                          key={i}
                          initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: reduceMotion ? 0 : 0.08 * i }}
                          className="flex items-start gap-3 text-sm text-muted-foreground"
                        >
                          <Check className={cn("w-4 h-4 mt-0.5 shrink-0", product.accent.check)} />
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <div
                      className={cn(
                        "grid grid-cols-1 gap-2 w-full",
                        product.actions.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
                      )}
                    >
                      {product.actions.map((action) => (
                        <ActionButton key={action.label} action={action} />
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
