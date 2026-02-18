import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, School, Receipt } from "lucide-react";

const products = [
  {
    id: "billing",
    title: "AxpoBill Pro",
    description: "Advanced billing and inventory management software designed for modern retail and wholesale businesses.",
    icon: Receipt,
    features: [
      "GST Compliant Invoicing",
      "Real-time Inventory Tracking",
      "Multi-store Management",
      "Detailed Financial Reports"
    ],
    comparison: "Similar to Tally, but simpler."
  },
  {
    id: "school",
    title: "EduManage 360",
    description: "Complete school management ecosystem trusted by Rishaan International Boarding School and others.",
    icon: School,
    features: [
      "Student Information System",
      "Fee & Finance Management",
      "Attendance & Timetabling",
      "Parent Communication App"
    ],
    comparison: "Used by 3+ Top Schools"
  }
];

export function Features() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Our Core Products</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We build specialized software tailored to specific industry needs, focusing on reliability and ease of use.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                  <Badge variant="secondary" className="w-fit mb-2">{product.comparison}</Badge>
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
                  <Button className="w-full group">
                    Learn More <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
