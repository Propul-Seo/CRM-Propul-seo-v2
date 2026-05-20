import { motion } from 'framer-motion';
import { CalendarClock, Check, ExternalLink, Mail } from 'lucide-react';

// Variante A — "Confirmation premium silencieuse"
// Checkmark animé + 1 seul CTA "Réserver un appel maintenant".
export function ThankYouA() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fff7ed 100%)' }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[15%] top-[10%] h-[400px] w-[600px] -rotate-12 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #7dd3fc 0%, transparent 60%)' }} />
        <div className="absolute right-[10%] bottom-[10%] h-[400px] w-[500px] rotate-12 rounded-full opacity-35 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #fed7aa 0%, transparent 60%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/60 bg-white/80 p-10 text-center shadow-2xl shadow-violet-500/10 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 shadow-lg shadow-emerald-500/30"
        >
          <Check className="h-10 w-10 text-white" strokeWidth={3} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-gradient-to-r from-sky-600 via-violet-600 to-pink-500 bg-clip-text text-3xl font-bold text-transparent"
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

        {/* TODO: remplacer l'URL placeholder par le vrai lien cal.com/Calendly Propul'SEO avant mise en prod */}
        <motion.a
          href="https://cal.com/propulseo/diagnostic"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{ color: '#ffffff' }}
          className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-violet-600 to-pink-500 px-6 font-semibold shadow-lg shadow-violet-500/40 transition-shadow hover:shadow-violet-500/60"
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
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 text-[14px] font-semibold text-stone-700 transition-colors hover:bg-stone-50"
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
