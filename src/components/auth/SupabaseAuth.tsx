import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface SupabaseAuthProps {
  onSuccess: () => void;
}

// Animated geometric background component
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[var(--neon-deep)]/30 via-surface-1 to-surface-1" />

      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(118, 74, 201, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(118, 74, 201, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--neon)]/20 to-transparent blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-gradient-to-br from-[var(--neon-light)]/15 to-transparent blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Geometric shapes */}
      <motion.div
        className="absolute top-20 right-1/4 w-32 h-32 border border-[var(--neon)]/20 rounded-2xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-32 left-1/3 w-24 h-24 border border-[var(--neon-glow)]/20"
        style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

// Animated logo component
function AnimatedLogo() {
  return (
    <motion.div
      className="relative"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-surface-2 to-surface-1 border border-border/50 shadow-2xl shadow-[var(--glow)] flex items-center justify-center overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10" />
        <img
          src="https://lh3.googleusercontent.com/pw/AP1GczN1Fx4MCRF05ZyLZ8eE7yq6l3O04S9H5NUlRQng3NGehC4bVTl4SA0EdX8yJ4cEgMGjbPkELigm1WxcMBR8QCh4QSMgDVikjqv8mizSPn2r-zv-pKbMK10JVMTK4Fo1kd4VUXASX_owtWiT6X6cRao=w590-h423-s-no-gm?authuser=0"
          alt="Propulseo Logo"
          className="w-14 h-14 object-contain relative z-10"
        />
      </div>
      {/* Animated ring */}
      <motion.div
        className="absolute -inset-2 rounded-3xl border border-cyan-500/30"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

export function SupabaseAuth({ onSuccess }: SupabaseAuthProps) {
  const { signIn, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const getFriendlyError = (error: unknown): string => {
    const msg = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);

    if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
    if (msg.includes('Email not confirmed')) return 'Votre email n\'a pas encore été confirmé.';
    if (msg.includes('Too many requests') || msg.includes('rate limit')) return 'Trop de tentatives. Réessayez dans quelques minutes.';
    if (msg.includes('network') || msg.includes('fetch')) return 'Erreur de connexion réseau. Vérifiez votre connexion internet.';
    return 'Une erreur est survenue. Veuillez réessayer.';
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await signIn(signInData.email, signInData.password);

      if (result.error) {
        console.error('Erreur de connexion:', result.error);
        setError(getFriendlyError(result.error));
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(getFriendlyError(err));
    }
  };

  const handleResendConfirmation = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail
      });

      if (error) {
        console.error('Erreur renvoi email:', error);
        alert('Erreur lors du renvoi de l\'email: ' + error.message);
      } else {
        alert('Email de confirmation renvoyé avec succès !');
      }
    } catch (error) {
      console.error('Erreur renvoi email:', error);
      alert('Erreur lors du renvoi de l\'email');
    }
  };

  const resetEmailConfirmation = () => {
    setShowEmailConfirmation(false);
    setPendingEmail('');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center p-6 relative">
        <AnimatedBackground />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative z-10"
        >
          <div className="backdrop-blur-xl bg-surface-2/70 border border-border/50 rounded-3xl p-8 shadow-2xl shadow-black/50">
            <div className="text-center mb-8">
              <AnimatedLogo />
              <h1 className="mt-6 text-2xl font-semibold text-white tracking-tight">
                Confirmation requise
              </h1>
              <p className="mt-2 text-muted-foreground text-sm">
                Vérifiez votre boîte mail
              </p>
            </div>

            <Alert className="bg-[var(--neon)]/10 border-[var(--neon)]/20 text-[var(--neon-glow)]">
              <AlertCircle className="h-4 w-4 text-[var(--neon-glow)]" />
              <AlertDescription className="text-[var(--neon-glow)]/80 text-sm">
                Un email de confirmation a été envoyé à <strong className="text-[var(--neon-glow)]">{pendingEmail}</strong>
              </AlertDescription>
            </Alert>

            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground/80">Instructions :</p>
              <ol className="list-decimal list-inside space-y-2 ml-1">
                <li>Ouvrez votre boîte mail</li>
                <li>Cherchez l'email de Propulseo</li>
                <li>Cliquez sur le lien de confirmation</li>
                <li>Revenez ici pour vous connecter</li>
              </ol>
            </div>

            <div className="mt-8 space-y-3">
              <Button
                onClick={handleResendConfirmation}
                disabled={loading}
                className="w-full h-12 bg-surface-2 hover:bg-surface-3 text-foreground/80 border border-border rounded-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Envoi...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>Renvoyer l'email</span>
                  </div>
                )}
              </Button>

              <Button
                onClick={resetEmailConfirmation}
                variant="ghost"
                className="w-full h-12 text-muted-foreground hover:text-foreground/80 hover:bg-surface-3/50 rounded-xl"
              >
                Retour à la connexion
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-1 flex relative overflow-hidden">
      <AnimatedBackground />

      {/* Left Panel - Brand & Visual */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative z-10 flex-col justify-between p-12"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: mounted ? 1 : 0, x: mounted ? 0 : -50 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <AnimatedLogo />
        </div>

        <motion.div
          className="max-w-lg"
          variants={containerVariants}
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
        >
          <motion.div variants={itemVariants} className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-[var(--neon-glow)]" />
            <span className="text-[var(--neon-glow)] font-medium tracking-wide text-sm uppercase">
              Propulseo CRM
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Gérez votre agence
            <span className="block bg-gradient-to-r from-[var(--neon)] via-[var(--neon-light)] to-[var(--neon-glow)] bg-clip-text text-transparent">
              à la vitesse de la lumière
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 text-lg text-muted-foreground leading-relaxed"
          >
            CRM nouvelle génération pour agences SEO & Marketing Digital.
            Centralisez vos leads, projets et performances en un seul endroit.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-10 flex items-center gap-6"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-surface-3 to-surface-2 border-2 border-surface-1 flex items-center justify-center text-xs font-medium text-foreground/80"
                >
                  {['AB', 'CD', 'EF', 'GH'][i - 1]}
                </div>
              ))}
            </div>
            <div className="text-sm">
              <p className="text-white font-medium">+50 utilisateurs actifs</p>
              <p className="text-muted-foreground">rejoignent Propulseo chaque mois</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="text-sm text-muted-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: mounted ? 1 : 0 }}
          transition={{ delay: 0.8 }}
        >
          © 2025 Propulseo. Tous droits réservés.
        </motion.div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 30 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Glassmorphism card */}
          <div className="backdrop-blur-xl bg-surface-2/70 border border-border/50 rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/50">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <AnimatedLogo />
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                Connexion
              </h2>
              <p className="mt-2 text-muted-foreground text-sm">
                Accédez à votre espace de travail
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-5">
              {/* Email field */}
              <div className="space-y-2">
                <Label
                  htmlFor="signin-email"
                  className="text-sm font-medium text-foreground/80"
                >
                  Adresse email
                </Label>
                <div className="relative group">
                  <div className={`
                    absolute inset-0 rounded-xl transition-all duration-300
                    ${focusedField === 'email'
                      ? 'bg-gradient-to-r from-[var(--neon)]/20 to-[var(--neon-glow)]/20 blur-xl opacity-100'
                      : 'opacity-0'
                    }
                  `} />
                  <div className="relative">
                    <Mail className={`
                      absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-200
                      ${focusedField === 'email' ? 'text-[var(--neon-glow)]' : 'text-muted-foreground'}
                    `} />
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInData.email}
                      onChange={(e) => { setSignInData(prev => ({ ...prev, email: e.target.value })); setError(null); }}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="vous@exemple.com"
                      className="
                        h-14 pl-12 pr-4
                        bg-surface-3/50 border-border/50
                        text-white placeholder:text-muted-foreground
                        rounded-xl
                        focus:border-[var(--neon)]/50 focus:ring-2 focus:ring-[var(--neon)]/20
                        transition-all duration-200
                      "
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label
                  htmlFor="signin-password"
                  className="text-sm font-medium text-foreground/80"
                >
                  Mot de passe
                </Label>
                <div className="relative group">
                  <div className={`
                    absolute inset-0 rounded-xl transition-all duration-300
                    ${focusedField === 'password'
                      ? 'bg-gradient-to-r from-[var(--neon)]/20 to-[var(--neon-glow)]/20 blur-xl opacity-100'
                      : 'opacity-0'
                    }
                  `} />
                  <div className="relative">
                    <Lock className={`
                      absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-200
                      ${focusedField === 'password' ? 'text-[var(--neon-glow)]' : 'text-muted-foreground'}
                    `} />
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={signInData.password}
                      onChange={(e) => { setSignInData(prev => ({ ...prev, password: e.target.value })); setError(null); }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••••••"
                      className="
                        h-14 pl-12 pr-14
                        bg-surface-3/50 border-border/50
                        text-white placeholder:text-muted-foreground
                        rounded-xl
                        focus:border-[var(--neon)]/50 focus:ring-2 focus:ring-[var(--neon)]/20
                        transition-all duration-200
                      "
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-surface-3/50 rounded-lg"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center mt-0.5">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-400">Échec de la connexion</p>
                    <p className="text-sm text-red-400/70 mt-0.5">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="flex-shrink-0 text-red-400/50 hover:text-red-400 transition-colors p-1"
                  >
                    <span className="sr-only">Fermer</span>
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </motion.div>
              )}

              {/* Submit button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-2"
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full h-14
                    bg-gradient-to-r from-[var(--neon)] to-[var(--neon-deep)]
                    hover:from-[var(--neon-light)] hover:to-[var(--neon)]
                    text-white font-medium text-base
                    rounded-xl
                    shadow-lg shadow-[var(--glow)]
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    group
                  "
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Connexion en cours...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Se connecter</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface-2/70 px-4 text-xs text-muted-foreground uppercase tracking-wider">
                  Sécurisé par Supabase
                </span>
              </div>
            </div>

            {/* Footer info */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                En vous connectant, vous acceptez nos{' '}
                <a href="#" className="text-[var(--neon-glow)] hover:text-[var(--neon-glow)] transition-colors">
                  conditions d'utilisation
                </a>
              </p>
            </div>
          </div>

          {/* Mobile footer */}
          <div className="lg:hidden mt-8 text-center text-sm text-muted-foreground/60">
            © 2025 Propulseo. Tous droits réservés.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
