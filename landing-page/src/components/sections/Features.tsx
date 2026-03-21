import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { Check, ArrowRight, School, Receipt, Sparkles, Wallet } from "lucide-react";
import { APPS } from "@/lib/constants";

type ProductCard = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  comparison: string;
  aiBadge?: boolean;
  learnMoreUrl?: string;
  iosUrl?: string;
  androidUrl?: string;
};

const products: ProductCard[] = [
  {
    id: "billing",
    title: APPS.biller.name,
    description: "GST-compliant billing and inventory software for manufacturers and wholesalers. AI-powered insights, smart stock alerts, and automated reports so you focus on growth.",
    icon: Receipt,
    features: [
      "GST-compliant invoicing (CGST/SGST/IGST)",
      "Products, customers & payments in one place",
      "Stock tracking with AI-driven low-stock alerts",
      "Smart reports: sales, outstanding, ledger & profit"
    ],
    comparison: "AI-first • Simpler than Tally",
    aiBadge: true,
    learnMoreUrl: APPS.biller.url,
  },
  {
    id: "school",
    title: APPS.eduFinance.name,
    description: "Complete school finance hub: fees, staff salaries, expenses, and dashboards. AI-enhanced analytics and year-end reports so institutions run with clarity and control.",
    icon: School,
    features: [
      "Schools, sessions & student fee tracking",
      "Staff & salary management by month",
      "Expense categories & payment history",
      "AI-powered dashboards & year-end reports"
    ],
    comparison: "AI-powered • Trusted by schools",
    aiBadge: true,
    learnMoreUrl: APPS.eduFinance.url,
  },
  {
    id: "tracker",
    title: APPS.tracker.name,
    description:
      "Smart expense tracking, group splits, and lending insights—in one mobile app for Android and iOS. Personal budgets, shared bills, and optional premium Lend with AI-powered reports.",
    icon: Wallet,
    features: [
      "Expense tracker: income, categories, fixed costs, investments & monthly CSV export",
      "Expense splitter: groups, flexible splits, balances, settlements & activity logs",
      "Premium Lend: contacts, loans, due dates, insights & regenerable AI report",
      "Voice input, receipt scan, Google or email sign-in, light/dark theme"
    ],
    comparison: "Android & iOS • Supabase sync",
    aiBadge: true,
    iosUrl: APPS.tracker.iosUrl,
    androidUrl: APPS.tracker.androidUrl,
  },
];

export function Features() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 text-primary">
            <Sparkles className="w-3.5 h-3.5" /> AI-powered solutions
          </Badge>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Our Core Products</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Industry-specific web apps and a native mobile suite—AI at the core for reports, splits, and insights that scale with you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className="h-full border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <product.icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {product.aiBadge && (
                      <Badge variant="default" className="w-fit gap-1 bg-primary/90">
                        <Sparkles className="w-3 h-3" /> AI
                      </Badge>
                    )}
                    <Badge variant="secondary" className="w-fit">{product.comparison}</Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold">{product.title}</CardTitle>
                  <CardDescription className="text-base">{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {product.iosUrl && product.androidUrl ? (
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
                  ) : product.learnMoreUrl ? (
                    <Button asChild className="w-full group">
                      <a href={product.learnMoreUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center">
                        Learn More <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
