import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { APPS } from "@/lib/constants";

type ProductCard = {
  id: string;
  title: string;
  description: string;
  logoSrc: string;
  features: string[];
  comparison: string;
  iosUrl: string;
  androidUrl: string;
};

const products: ProductCard[] = [
  {
    id: "tracker",
    title: APPS.tracker.name,
    description:
      "Smart expense tracking, group splits, and lending insights—in one mobile app for Android and iOS. Personal budgets, shared bills, and optional premium Lend with AI-powered reports.",
    logoSrc: "/axpo-logo.png",
    features: [
      "Expense tracker: income, categories, fixed costs, investments & monthly CSV export",
      "Expense splitter: groups, flexible splits, balances, settlements & activity logs",
      "Premium Lend: contacts, loans, due dates, insights & regenerable AI report",
      "Voice input, receipt scan, Google or email sign-in, light/dark theme"
    ],
    comparison: "Android & iOS • Supabase sync",
    iosUrl: APPS.tracker.iosUrl,
    androidUrl: APPS.tracker.androidUrl,
  },
];

export function Features() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative py-24 bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
      <motion.div
        aria-hidden="true"
        className="absolute -right-32 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        animate={reduceMotion ? undefined : { y: [0, 36, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
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
            <Sparkles className="w-3.5 h-3.5" /> AI-powered expense management
          </Badge>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Meet AXPO</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One mobile app for personal expenses, shared bills, lending records, and useful financial insights.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              whileHover={reduceMotion ? undefined : { y: -8, scale: 1.01 }}
              transition={{ delay: reduceMotion ? 0 : index * 0.12, duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="relative h-full overflow-hidden border-border/50 shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/25 transition-all duration-500">
                <motion.div
                  aria-hidden="true"
                  className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-primary/16 to-cyan-300/10 blur-2xl"
                  animate={reduceMotion ? undefined : { scale: [1, 1.18, 1], opacity: [0.45, 0.8, 0.45] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                />
                <CardHeader>
                  <motion.div
                    className="relative w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary shadow-[0_8px_24px_hsl(var(--primary)/0.12)]"
                    whileHover={reduceMotion ? undefined : { rotate: -5, scale: 1.08 }}
                  >
                    <img
                      src={product.logoSrc}
                      alt={`${product.title} logo`}
                      className="w-10 h-10 rounded-md object-cover"
                    />
                  </motion.div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="default" className="w-fit gap-1 bg-primary/90">
                      <Sparkles className="w-3 h-3" /> AI
                    </Badge>
                    <Badge variant="secondary" className="w-fit">{product.comparison}</Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold">{product.title}</CardTitle>
                  <CardDescription className="text-base">{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {product.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: reduceMotion ? 0 : 0.08 * i }}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                      >
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        {feature}
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    <Button asChild className="w-full group">
                      <a
                        href={product.iosUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center"
                      >
                        App Store <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full group">
                      <a
                        href={product.androidUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center"
                      >
                        Google Play <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
