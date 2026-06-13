import { motion } from 'framer-motion';
import { CalendarClock, Check, ExternalLink, Mail } from 'lucide-react';

// Variante A — "Confirmation premium silencieuse"
// Checkmark animé + 1 seul CTA "Réserver un appel maintenant".
// Surface tokenisée (.propulspace-portal + .ps-qualification-page) : le scope
// portail définit `a { color: var(--ps-primary) }`, d'où les `!text-*` sur les
// liens pour conserver leur encre propre.
export function ThankYouA() {
  return (
    <div className="propulspace-portal ps-qualification-page relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="ps-hero-glow absolute left-1/2 top-[-120px] h-[360px] w-[560px] -translate-x-1/2 rounded-full" />
      </div>

      <div className="ps-surface relative z-10 w-full max-w-lg p-10 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--ps-success)] shadow-sm"
        >
          <Check className="h-10 w-10 text-white" strokeWidth={3} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-3xl font-bold text-[var(--ps-fg)]"
        >
          Diagnostic enregistré
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mx-auto mt-4 max-w-sm text-[14px] leading-relaxed text-stone-600"
        >
          Notre équipe l'examine en ce moment. Vous recevrez un retour personnalisé sous <span className="font-semibold text-stone-800">24h ouvrées</span>.
        </motion.p>

        <motion.a
          href="https://calendly.com/team-propulseo-site/30min"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--ps-primary)] px-6 font-semibold !text-white shadow-sm transition-colors hover:bg-[var(--ps-primary-hover)]"
        >
          <CalendarClock className="h-5 w-5" />
          Réserver un appel maintenant
        </motion.a>

        <motion.a
          href="https://www.propulseo-site.com/nos-accompagnements"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72, duration: 0.4 }}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--ps-border)] bg-white px-6 text-[14px] font-semibold !text-stone-700 transition-colors hover:bg-stone-50"
        >
          <ExternalLink className="h-4 w-4" />
          Voir nos accompagnements
        </motion.a>

        <p className="mt-6 inline-flex items-center gap-1.5 text-[12px] text-stone-500">
          <Mail className="h-3.5 w-3.5" />
          Un email de confirmation est en route
        </p>
      </div>
    </div>
  );
}
