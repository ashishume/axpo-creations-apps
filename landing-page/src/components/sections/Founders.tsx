import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const founders = [
  {
    name: "Ashish Debnath",
    role: "Founder",
    bio: "Visionary leader with a passion for transforming traditional workflows through technology.",
    initials: "AD",
    image: "/assets/founder_1.png"
  },
  {
    name: "Soumojit Kar",
    role: "Co-founder",
    bio: "Technical architect focused on building scalable, secure, and user-centric software architectures.",
    initials: "SK",
    image: "/assets/founder_2.jpg"
  }
];

export function Founders() {
  return (
    <section className="py-24 bg-white dark:bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Meet the Visionaries</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The driving force behind AxpoCreation's innovation and commitment to excellence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {founders.map((founder, index) => (
            <motion.div
              key={founder.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="flex flex-col items-center text-center p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow duration-300"
            >
              <Avatar className="w-32 h-32 mb-6 border-4 border-white shadow-lg">
                <AvatarImage src={founder.image} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold text-primary bg-primary/10">
                  {founder.initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-2xl font-bold mb-1">{founder.name}</h3>
              <p className="text-primary font-medium mb-4">{founder.role}</p>
              <p className="text-muted-foreground leading-relaxed">
                {founder.bio}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
