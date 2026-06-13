// Validation utilities
import { z } from 'zod';

// Constantes de validation
export const VALIDATION_MESSAGES = {
  required: 'Ce champ est requis',
  email: 'Email invalide',
  phone: 'Numéro de téléphone invalide',
  password: {
    min: 'Le mot de passe doit contenir au moins 8 caractères',
    match: 'Les mots de passe ne correspondent pas',
  },
  date: 'Date invalide',
  number: 'Nombre invalide',
  url: 'URL invalide',
};

// Common validation schemas
export const emailSchema = z.string().email(VALIDATION_MESSAGES.email);
export const phoneSchema = z.string().min(10, VALIDATION_MESSAGES.phone);
export const passwordSchema = z.string().min(8, VALIDATION_MESSAGES.password.min);
export const urlSchema = z.string().url(VALIDATION_MESSAGES.url);
export const dateSchema = z.string().refine((val) => !isNaN(Date.parse(val)), VALIDATION_MESSAGES.date);

// Client validation
export const clientSchema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.required),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(1, VALIDATION_MESSAGES.required),
  sector: z.string().min(1, VALIDATION_MESSAGES.required),
  status: z.enum(['prospect', 'devis', 'signe', 'livre', 'perdu']),
});

// Task validation
export const taskSchema = z.object({
  title: z.string().min(1, VALIDATION_MESSAGES.required),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'waiting', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedTo: z.string().min(1, VALIDATION_MESSAGES.required),
  deadline: z.string().optional(),
  category: z.enum(['sales', 'marketing', 'development', 'general']),
});

// Project validation
export const projectSchema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.required),
  description: z.string().optional(),
  clientId: z.string().min(1, VALIDATION_MESSAGES.required),
  status: z.enum(['planning', 'in_progress', 'review', 'completed', 'on_hold']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedTo: z.string().min(1, VALIDATION_MESSAGES.required),
  startDate: z.string().min(1, VALIDATION_MESSAGES.required),
  endDate: z.string().optional(),
  budget: z.number().optional(),
  progress: z.number().min(0).max(100),
});

// Event validation
export const eventSchema = z.object({
  title: z.string().min(1, VALIDATION_MESSAGES.required),
  description: z.string().optional(),
  start: z.string().min(1, VALIDATION_MESSAGES.required),
  end: z.string().min(1, VALIDATION_MESSAGES.required),
  type: z.enum(['rdv_client', 'deadline', 'livraison', 'suivi', 'marketing', 'formation']),
  clientId: z.string().optional(),
  userId: z.string().min(1, VALIDATION_MESSAGES.required),
  category: z.enum(['sales', 'marketing', 'general']),
  syncWithCalendar: z.boolean().default(true),
});

// Quote validation
export const quoteSchema = z.object({
  clientId: z.string().min(1, VALIDATION_MESSAGES.required),
  title: z.string().min(1, VALIDATION_MESSAGES.required),
  status: z.enum(['draft', 'sent', 'viewed', 'signed', 'rejected']),
  validUntil: z.string().min(1, VALIDATION_MESSAGES.required),
});

// Campaign validation
export const campaignSchema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.required),
  type: z.enum(['email', 'social', 'seo', 'ads']),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  budget: z.number().optional(),
  startDate: z.string().min(1, VALIDATION_MESSAGES.required),
  endDate: z.string().optional(),
  targetAudience: z.string().min(1, VALIDATION_MESSAGES.required),
  description: z.string().optional(),
  assignedTo: z.string().min(1, VALIDATION_MESSAGES.required),
});

// Lead validation
export const leadSchema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.required),
  email: emailSchema,
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.enum(['website', 'social', 'referral', 'ads', 'cold_outreach']),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  score: z.number().min(0).max(100),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
});

// Accounting entry validation
export const accountingEntrySchema = z.object({
  type: z.enum(['revenue', 'expense']),
  description: z.string().min(1, VALIDATION_MESSAGES.required),
  amount: z.number().min(0.01, 'Montant requis'),
  category: z.string().min(1, VALIDATION_MESSAGES.required),
  date: z.string().min(1, VALIDATION_MESSAGES.required),
  clientId: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

// Chat message validation
export const chatMessageSchema = z.object({
  content: z.string().min(1, VALIDATION_MESSAGES.required).max(1000, 'Message trop long (max 1000 caractères)'),
  groupId: z.string().min(1, VALIDATION_MESSAGES.required),
});

// Chat group validation
export const chatGroupSchema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.required).max(50, 'Nom trop long (max 50 caractères)'),
  description: z.string().max(200, 'Description trop longue (max 200 caractères)').optional(),
  isPrivate: z.boolean().default(false),
});

// Validation helper functions
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: unknown
): { success: boolean; error?: string; data?: T } {
  try {
    const data = schema.parse(value);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message };
    }
    return { success: false, error: 'Validation failed' };
  }
}

export function createFormValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => {
    try {
      return { data: schema.parse(data), errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
        return { data: null, errors };
      }
      return { data: null, errors: { _form: 'Validation failed' } };
    }
  };
}

/**
 * Valide un formulaire complet et retourne les erreurs formatées
 * @param schema Schéma de validation Zod
 * @param data Données à valider
 * @returns Résultat de validation avec erreurs formatées
 */
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { 
  isValid: boolean; 
  data?: T; 
  errors: Record<string, string>;
} {
  try {
    const validData = schema.parse(data);
    return { isValid: true, data: validData, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          formattedErrors[err.path.join('.')] = err.message;
        }
      });
      return { isValid: false, errors: formattedErrors };
    }
    return { isValid: false, errors: { _form: 'Erreur de validation' } };
  }
}