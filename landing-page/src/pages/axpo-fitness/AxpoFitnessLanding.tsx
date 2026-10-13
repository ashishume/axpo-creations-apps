import { useEffect } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Check,
  CircleHelp,
  Dumbbell,
  Heart,
  HeartPulse,
  MessageCircle,
  Moon,
  Sparkles,
  Utensils,
} from "lucide-react";
import "./AxpoFitnessLanding.css";

const PAGE_TITLE = "Axpo Fitness — a routine that feels like yours";
const PAGE_DESCRIPTION =
  "Personalized workouts, thoughtful meal planning and coaching to help you build a healthier routine, one day at a time.";
const PAGE_URL = "https://www.axpocreation.com/axpo-fitness";

const focusAreas = [
  { icon: Dumbbell, label: "Training" },
  { icon: Utensils, label: "Nutrition" },
  { icon: Activity, label: "Progress" },
  { icon: Heart, label: "Wellbeing" },
];

const features = [
  {
    number: "01",
    icon: Dumbbell,
    title: "A plan shaped around you",
    detail:
      "Build a weekly workout plan around your goals, experience, available time and equipment. Your routine can change as life does.",
    tone: "lilac",
  },
  {
    number: "02",
    icon: Utensils,
    title: "Food guidance that feels doable",
    detail:
      "Explore four-week meal ideas, log meals and get a clearer picture of your day. Scan a plate to review an estimated nutrition breakdown.",
    tone: "peach",
  },
  {
    number: "03",
    icon: BrainCircuit,
    title: "A little help when you need it",
    detail:
      "Ask Axpo AI about your plan, find exercise alternatives and get helpful context for your next step. You stay in control of every change.",
    tone: "mint",
  },
  {
    number: "04",
    icon: HeartPulse,
    title: "Progress beyond the scale",
    detail:
      "See completed sessions, active days and consistency over time. If you choose, connect Apple Health or Health Connect for an at-a-glance view of activity.",
    tone: "blue",
  },
];

const steps = [
  {
    title: "Start with your real life",
    detail: "Choose a goal, your experience and the time you can give each week.",
  },
  {
    title: "Get a plan you can follow",
    detail: "See workouts and meal ideas organized into a rhythm that fits your week.",
  },
  {
    title: "Keep what works. Adjust the rest.",
    detail: "Log a session, check in on your progress and shape the next week as you go.",
  },
];

function usePageMetadata() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const createdCanonical = canonical === null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    const previousCanonical = canonical.getAttribute("href");

    document.title = PAGE_TITLE;
    description?.setAttribute("content", PAGE_DESCRIPTION);
    canonical.href = PAGE_URL;

    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
      if (createdCanonical) canonical.remove();
      else if (previousCanonical !== null) canonical.href = previousCanonical;
    };
  }, []);
}

function Brand() {
  return (
    <a className="fitness-brand" href="/axpo-fitness" aria-label="Axpo Fitness home">
      <span className="fitness-brand-mark"><Activity size={21} strokeWidth={2.4} aria-hidden="true" /></span>
      <span>axpo<span className="fitness-brand-light">fitness</span></span>
    </a>
  );
}

function AppPreview() {
  return (
    <div className="fitness-preview-wrap" aria-label="Preview of the Axpo Fitness app">
      <div className="fitness-orbit fitness-orbit-one" aria-hidden="true" />
      <div className="fitness-orbit fitness-orbit-two" aria-hidden="true" />
      <div className="fitness-spark fitness-spark-one" aria-hidden="true">✳</div>
      <div className="fitness-spark fitness-spark-two" aria-hidden="true">✦</div>
      <div className="fitness-phone">
        <div className="fitness-phone-top"><span>9:41</span><span className="fitness-phone-island" /><span className="fitness-phone-status">● ● ▰</span></div>
        <div className="fitness-app-head">
          <span className="fitness-mini-mark"><Activity size={17} strokeWidth={2.5} /></span>
          <span>Axpo Fitness</span>
          <span className="fitness-avatar">A</span>
        </div>
        <div className="fitness-app-welcome">
          <span>WEDNESDAY · YOUR DAY</span>
          <h3>A little progress<br />goes a long way.</h3>
        </div>
        <div className="fitness-workout-card">
          <img src="/assets/axpo-fitness/workout-strength.svg" alt="Illustration of a person doing a strength workout" />
          <div className="fitness-workout-overlay">
            <span className="fitness-card-eyebrow">TODAY’S WORKOUT</span>
            <strong>Full body strength</strong>
            <span>28 min <i /> 5 movements</span>
          </div>
          <span className="fitness-play" aria-hidden="true"><ArrowRight size={18} /></span>
        </div>
        <div className="fitness-app-row">
          <div className="fitness-progress-card">
            <div className="fitness-progress-title"><span>This week</span><span>↗</span></div>
            <strong>3 <small>/ 4 days</small></strong>
            <div className="fitness-progress-bars" aria-hidden="true"><i /><i /><i /><i /></div>
            <span className="fitness-progress-caption">You’re finding your rhythm</span>
          </div>
          <div className="fitness-ai-card">
            <span className="fitness-ai-icon"><Sparkles size={16} /></span>
            <span className="fitness-card-eyebrow">YOUR COACH</span>
            <strong>Need a hand?</strong>
            <span>Ask Axpo AI</span>
          </div>
        </div>
        <div className="fitness-tabbar" aria-hidden="true">
          <span className="active"><Activity size={15} />Today</span>
          <span><Dumbbell size={15} />Plan</span>
          <span><Utensils size={15} />Food</span>
          <span><Heart size={15} />You</span>
        </div>
      </div>
      <div className="fitness-float-note fitness-float-left"><span className="fitness-float-icon"><Check size={15} /></span><span><strong>Made for your week</strong><small>Not someone else’s</small></span></div>
      <div className="fitness-float-note fitness-float-right"><span className="fitness-float-icon lavender"><Sparkles size={15} /></span><span><strong>One step at a time</strong><small>Your pace counts</small></span></div>
    </div>
  );
}

export default function AxpoFitnessLanding() {
  usePageMetadata();

  return (
    <main className="fitness-page">
      <section className="fitness-hero" id="top">
        <header className="fitness-nav fitness-container">
          <Brand />
          <nav className="fitness-nav-links" aria-label="Main navigation">
            <a href="#approach">Our approach</a>
            <a href="#features">What’s inside</a>
            <a href="#how-it-works">How it works</a>
          </nav>
          <a className="fitness-nav-cta" href="#get-started">Explore Axpo <ArrowUpRight size={16} /></a>
          <a className="fitness-mobile-menu" href="#features" aria-label="Jump to app features"><ArrowDown size={20} /></a>
        </header>

        <div className="fitness-hero-grid fitness-container">
          <div className="fitness-hero-copy">
            <div className="fitness-eyebrow"><span /> WELLNESS THAT WORKS WITH REAL LIFE</div>
            <h1>A healthier rhythm,<br /><em>on your terms.</em></h1>
            <p className="fitness-hero-lede">Workouts, food and everyday wellbeing—brought together in one thoughtful space, made to meet you where you are.</p>
            <div className="fitness-hero-actions">
              <a className="fitness-button-primary" href="#features">Get to know Axpo <ArrowRight size={17} /></a>
              <a className="fitness-button-quiet" href="#how-it-works"><span><ArrowDown size={15} /></span> See how it works</a>
            </div>
            <div className="fitness-hero-note"><Heart size={15} fill="currentColor" /> Room to move, refuel and feel good at your pace.</div>
          </div>
          <AppPreview />
        </div>
        <div className="fitness-hero-bottom" aria-hidden="true"><span>YOUR ROUTINE, YOUR WAY</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section className="fitness-focus" aria-label="The app brings your wellbeing together">
        <div className="fitness-container fitness-focus-inner">
          <p>Small steps add up.</p>
          <div className="fitness-focus-list">
            {focusAreas.map(({ icon: Icon, label }) => <span key={label}><Icon size={17} strokeWidth={1.8} />{label}</span>)}
          </div>
          <p className="fitness-focus-tail">All in one place.</p>
        </div>
      </section>

      <section className="fitness-approach fitness-container" id="approach">
        <div className="fitness-section-intro">
          <div className="fitness-section-kicker"><span>01</span> A MORE HUMAN KIND OF FITNESS</div>
          <h2>Not another perfect routine.<br /><em>A more personal one.</em></h2>
        </div>
        <div className="fitness-approach-copy">
          <p>Some weeks are full. Some plans need a reset. Axpo Fitness brings the pieces of feeling well together, so it’s easier to keep showing up in ways that fit your life.</p>
          <a href="#features" className="fitness-text-link">Find your kind of progress <ArrowRight size={16} /></a>
        </div>
      </section>

      <section className="fitness-features" id="features">
        <div className="fitness-container">
          <div className="fitness-features-heading">
            <div>
              <div className="fitness-section-kicker"><span>02</span> THE GOOD STUFF, TOGETHER</div>
              <h2>Support for the whole<br className="fitness-desktop-break" /> picture.</h2>
            </div>
            <p>Practical tools for moving, eating and checking in—with your goals and choices at the centre.</p>
          </div>
          <div className="fitness-feature-grid">
            {features.map(({ number, icon: Icon, title, detail, tone }) => (
              <article className={`fitness-feature-card ${tone}`} key={number}>
                <div className="fitness-feature-top"><span className="fitness-feature-icon"><Icon size={20} strokeWidth={1.8} /></span><span className="fitness-feature-number">{number}</span></div>
                <h3>{title}</h3>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fitness-coach-band">
        <div className="fitness-container fitness-coach-grid">
          <div className="fitness-coach-art">
            <img src="/assets/axpo-fitness/workout-mobility.svg" alt="Illustration of a person stretching" loading="lazy" />
            <div className="fitness-coach-sticker"><MessageCircle size={17} /><span>Here when<br />you need it</span></div>
          </div>
          <div className="fitness-coach-copy">
            <div className="fitness-section-kicker"><span>03</span> A LITTLE GUIDANCE GOES A LONG WAY</div>
            <h2>Make room for<br /><em>your kind of strong.</em></h2>
            <p>Follow an illustrated workout, explore exercise demos, or ask Axpo AI for ideas that work with your plan. Want a human in your corner? Find independent coaches right in the app.</p>
            <a href="/axpo-fitness/support" className="fitness-text-link">Meet Axpo Fitness <ArrowRight size={16} /></a>
          </div>
        </div>
      </section>

      <section className="fitness-process fitness-container" id="how-it-works">
        <div className="fitness-process-heading">
          <div className="fitness-section-kicker"><span>04</span> BEGIN WHERE YOU ARE</div>
          <h2>Your next step can<br /><em>start small.</em></h2>
          <p>No big reset required. Just a few choices to help make the next week feel more like yours.</p>
        </div>
        <div className="fitness-steps">
          {steps.map(({ title, detail }, index) => (
            <article className="fitness-step" key={title}>
              <span className="fitness-step-number">0{index + 1}</span>
              <div className="fitness-step-line" />
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fitness-cycle">
        <div className="fitness-container fitness-cycle-inner">
          <div className="fitness-cycle-icon"><Moon size={25} strokeWidth={1.6} /></div>
          <div>
            <div className="fitness-section-kicker"><span>MADE TO BE PERSONAL</span></div>
            <h2>Wellbeing isn’t one-size-fits-all.</h2>
            <p>Optional cycle tracking offers predictions and phase-based guidance for those who want it. Your cycle data stays personal and is never sent to AI. Predictions are estimates—not contraception or medical advice.</p>
          </div>
          <div className="fitness-cycle-spark" aria-hidden="true">✳</div>
        </div>
      </section>

      <section className="fitness-final" id="get-started">
        <div className="fitness-final-glow" aria-hidden="true" />
        <div className="fitness-container fitness-final-inner">
          <span className="fitness-final-overline"><Sparkles size={15} /> MAKE YOUR NEXT MOVE YOURS</span>
          <h2>Feel good about<br /><em>where you’re going.</em></h2>
          <p>Build a routine that makes a little more room for you.</p>
          <div className="fitness-final-actions">
            <a className="fitness-button-light" href="mailto:aaxpocreation@gmail.com?subject=Axpo%20Fitness%20updates">Get in touch <ArrowUpRight size={17} /></a>
            <a className="fitness-button-outline" href="/axpo-fitness/support">Visit support <ArrowRight size={16} /></a>
          </div>
          <span className="fitness-final-footnote"><CircleHelp size={14} /> General wellness guidance only. Axpo Fitness is not medical care.</span>
        </div>
        <div className="fitness-final-orb fitness-final-orb-one" aria-hidden="true" />
        <div className="fitness-final-orb fitness-final-orb-two" aria-hidden="true" />
      </section>

      <footer className="fitness-footer">
        <div className="fitness-container fitness-footer-main">
          <div><Brand /><p>A little more movement.<br />A little more you.</p></div>
          <div className="fitness-footer-links"><a href="/axpo-fitness/privacy-policy">Privacy</a><a href="/axpo-fitness/terms-of-service">Terms</a><a href="/axpo-fitness/account-deletion">Account deletion</a><a href="/axpo-fitness/support">Support</a></div>
          <a className="fitness-footer-up" href="#top" aria-label="Back to top"><ArrowUpRight size={18} /></a>
        </div>
        <div className="fitness-container fitness-footer-bottom"><span>© {new Date().getFullYear()} Axpo Fitness</span><span>Made with care by AxpoCreation</span></div>
      </footer>
    </main>
  );
}
