import { motion, useReducedMotion } from "framer-motion";
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
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative py-24 bg-white dark:bg-background overflow-hidden">
      <motion.div
        aria-hidden="true"
        className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-indigo-300/10 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 30, 0], y: [0, -24, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="container mx-auto px-4">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduceMotion ? 0 : 0.58, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Meet the Visionaries</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The driving force behind AxpoCreation's innovation and commitment to excellence.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {founders.map((founder, index) => (
            <motion.div
              key={founder.name}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={reduceMotion ? undefined : { y: -9, scale: 1.015 }}
              transition={{ delay: reduceMotion ? 0 : index * 0.14, duration: reduceMotion ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10 transition-[border-color,box-shadow] duration-500 overflow-hidden"
            >
              <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <motion.div whileHover={reduceMotion ? undefined : { rotate: 2, scale: 1.04 }}>
                <Avatar className="w-32 h-32 mb-6 border-4 border-white shadow-lg group-hover:shadow-primary/20 transition-shadow duration-500">
                  <AvatarImage src={founder.image} className="object-cover" />
                  <AvatarFallback className="text-3xl font-bold text-primary bg-primary/10">
                    {founder.initials}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
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
