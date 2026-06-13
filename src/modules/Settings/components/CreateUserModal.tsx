import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, X, RefreshCw, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const ROLES = [
  { value: 'sales', label: 'Commercial' },
  { value: 'manager', label: 'Manager' },
  { value: 'ops', label: 'Opérations' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'developer', label: 'Développeur' },
] as const;

function generatePassword(length = 14): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%&*?';
  const all = upper + lower + digits + special;

  // Ensure at least one of each type
  const password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  for (let i = password.length; i < length; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }

  // Shuffle
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}

export function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('sales');
  const [position, setPosition] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const pwd = generatePassword();
    setPassword(pwd);
    setShowPassword(true);
  };

  const isValid = email.includes('@') && email.includes('.') && password.length >= 10 && name.trim().length > 0 && role;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Session non valide');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email, password, name, role, position: position || undefined }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      setCreatedPassword(password);
      toast.success(`Utilisateur ${email} créé avec succès`);
      onCreated();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!createdPassword) return;
    await navigator.clipboard.writeText(createdPassword);
    setCopied(true);
    toast.success('Mot de passe copié');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-popover text-popover-foreground rounded-lg shadow-xl max-w-lg w-full mx-4 border border-border"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center space-x-2 text-foreground">
            <UserPlus className="w-5 h-5 text-primary" />
            <span>{createdPassword ? 'Utilisateur créé' : 'Nouvel utilisateur'}</span>
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdPassword ? (
          /* Success state - show password once */
          <div className="p-4 space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm font-medium text-green-300 mb-1">
                Compte créé pour {email}
              </p>
              <p className="text-xs text-green-400">
                Copiez le mot de passe ci-dessous. Il ne sera plus affiché.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Input value={createdPassword} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button onClick={onClose}>Fermer</Button>
            </div>
          </div>
        ) : (
          /* Creation form */
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom complet *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Dupont" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean@propulseo.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rôle *</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Poste</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Responsable commercial" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mot de passe * (min. 10 caractères)</Label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 10 caractères"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={handleGenerate} className="whitespace-nowrap">
                  <RefreshCw className="w-4 h-4 mr-1" /> Générer
                </Button>
              </div>
              {password && password.length < 10 && (
                <p className="text-xs text-red-500">Le mot de passe doit contenir au moins 10 caractères</p>
              )}
            </div>
          </div>
        )}

        {!createdPassword && (
          <div className="flex items-center justify-end space-x-3 p-4 border-t border-border bg-muted/50 rounded-b-lg">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
              {isSubmitting ? (
                <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Création...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Créer l'utilisateur</>
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
