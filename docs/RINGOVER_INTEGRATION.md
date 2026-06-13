# 🔔 Intégration Click-to-Call Ringover

## 📋 Vue d'ensemble

Cette intégration permet à vos SDR d'initier des appels en 1 clic directement depuis les fiches clients de votre ERP React, via l'API Ringover.

## 🚀 Fonctionnalités

### ✅ **Implémentées :**
- **Bouton d'appel principal** : En-tête avec bouton d'appel rapide
- **Boutons d'appel secondaires** : À côté de chaque numéro de téléphone
- **Gestion des états** : Idle, Calling, Success, Error
- **Validation des numéros** : Nettoyage et formatage automatique
- **Gestion d'erreurs** : Messages contextuels et fallbacks
- **Interface responsive** : Support mobile et desktop
- **Mode sombre** : Compatible avec votre thème

### 🔄 **États du bouton d'appel :**
1. **Idle** : Prêt à appeler (icône téléphone)
2. **Calling** : Appel en cours (spinner + "Appel...")
3. **Success** : Appel initié (checkmark + "Appelé")
4. **Error** : Erreur (X + "Erreur" + tooltip)

## ⚙️ Configuration

### 1. **Variables d'environnement**

Créez un fichier `.env` à la racine de votre projet :

```bash
# Clé API Ringover (obligatoire)
REACT_APP_RINGOVER_API_KEY=your_ringover_api_key_here

# URL de base de l'API Ringover (optionnel)
REACT_APP_RINGOVER_BASE_URL=https://public-api.ringover.com/v2
```

### 2. **Récupération de la clé API Ringover**

1. Connectez-vous à votre compte Ringover
2. Allez dans **Paramètres** → **API**
3. Générez une nouvelle clé API
4. Copiez la clé dans votre fichier `.env`

### 3. **Configuration de l'utilisateur SDR**

Le composant récupère automatiquement l'ID de l'utilisateur connecté. Adaptez la fonction `getCurrentSdrId()` dans `src/config/ringover.ts` selon votre système d'authentification :

```typescript
// Exemple avec Zustand
export const getCurrentSdrId = (): string => {
  return useStore.getState().currentUser?.id || '';
};

// Exemple avec localStorage
export const getCurrentSdrId = (): string => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user).id : '';
};
```

## 🧩 Composants créés

### 1. **RingoverService** (`src/services/ringoverService.ts`)
- Classe de service pour l'API Ringover
- Gestion des appels et validation des numéros
- Gestion d'erreurs et logging

### 2. **CallButton** (`src/components/common/CallButton.tsx`)
- Bouton d'appel avec états visuels
- Variantes primary/secondary
- Tailles sm/md/lg
- Tooltips d'erreur

### 3. **PhoneNumberDisplay** (`src/components/common/PhoneNumberDisplay.tsx`)
- Affichage d'un numéro avec bouton d'appel
- Types : mobile, fixe, travail
- Formatage automatique français

### 4. **ClientCallHeader** (`src/components/common/ClientCallHeader.tsx`)
- En-tête de fiche client avec bouton d'appel principal
- Informations client et statut
- Design moderne et responsive

## 📱 Utilisation

### 1. **Bouton d'appel simple**

```tsx
import { CallButton } from '../components/common/CallButton';

<CallButton
  phoneNumber="0612345678"
  sdrUserId="user123"
  variant="primary"
  size="md"
  onCallInitiated={(response) => console.log('Appel initié:', response)}
  onCallError={(error) => console.error('Erreur:', error)}
/>
```

### 2. **Affichage de numéro avec bouton**

```tsx
import { PhoneNumberDisplay } from '../components/common/PhoneNumberDisplay';

<PhoneNumberDisplay
  phoneNumber="0612345678"
  sdrUserId="user123"
  type="mobile"
  label="Téléphone principal"
  callButtonVariant="secondary"
/>
```

### 3. **En-tête de fiche client**

```tsx
import { ClientCallHeader } from '../components/common/ClientCallHeader';

<ClientCallHeader
  clientName="Jean Dupont"
  primaryPhoneNumber="0612345678"
  sdrUserId="user123"
  clientType="prospect"
  companyName="Entreprise ABC"
/>
```

## 🎨 Personnalisation

### **Variantes de boutons :**
- **Primary** : `bg-green-600 hover:bg-green-700` (vert)
- **Secondary** : `bg-gray-100 border` (gris)

### **Tailles disponibles :**
- **sm** : `px-3 py-1.5 text-sm`
- **md** : `px-4 py-2 text-base` (défaut)
- **lg** : `px-6 py-3 text-lg`

### **Types de téléphone :**
- **Mobile** : 📱 (06/07)
- **Fixe** : ☎️ (01/02/03/04/05/08/09)
- **Travail** : 🏢 (personnalisé)

## 🔧 Intégration dans votre ERP

### 1. **Fiches clients existantes**

Remplacez l'en-tête actuel par `ClientCallHeader` :

```tsx
// Avant
<div className="flex items-center justify-between">
  <h1>{contact.name}</h1>
  <Button>Modifier</Button>
</div>

// Après
<ClientCallHeader
  clientName={contact.name}
  primaryPhoneNumber={contact.phone}
  sdrUserId={getCurrentSdrId()}
  clientType={contact.status}
/>
```

### 2. **Listes de contacts**

Ajoutez des boutons d'appel dans vos tableaux :

```tsx
{contacts.map(contact => (
  <tr key={contact.id}>
    <td>{contact.name}</td>
    <td>{contact.phone}</td>
    <td>
      <CallButton
        phoneNumber={contact.phone}
        sdrUserId={getCurrentSdrId()}
        variant="secondary"
        size="sm"
      />
    </td>
  </tr>
))}
```

### 3. **Modales de contact**

Intégrez dans vos formulaires d'édition :

```tsx
<Dialog>
  <DialogContent>
    <ClientCallHeader
      clientName={editingContact.name}
      primaryPhoneNumber={editingContact.phone}
      sdrUserId={getCurrentSdrId()}
    />
    {/* Reste du formulaire */}
  </DialogContent>
</Dialog>
```

## 🚨 Gestion d'erreurs

### **Erreurs courantes :**
1. **API non accessible** : Vérifiez votre clé API et la connectivité
2. **Numéro invalide** : Le composant nettoie automatiquement les numéros
3. **Utilisateur non connecté** : Vérifiez la fonction `getCurrentSdrId()`

### **Fallbacks :**
- Bouton désactivé si API indisponible
- Messages d'erreur contextuels
- Timeout automatique des erreurs (3s)
- Logging détaillé dans la console

## 📊 Monitoring et logs

### **Logs automatiques :**
```typescript
// Démarrage d'appel
🚀 Ringover - Initiation appel: { from: "user123", to: "+33123456789" }

// Succès
✅ Ringover - Appel initié avec succès: { call_id: "call_abc123" }

// Erreurs
❌ Ringover - Erreur lors de l'initiation de l'appel: { error: "..." }
```

### **Métriques à surveiller :**
- Taux de succès des appels
- Temps de réponse de l'API
- Erreurs par type
- Utilisation par SDR

## 🔒 Sécurité

### **Bonnes pratiques :**
1. **Clé API** : Stockez dans `.env` (jamais dans le code)
2. **Validation** : Numéros nettoyés côté client
3. **Rate limiting** : Respectez les limites de l'API Ringover
4. **Logs** : Évitez de logger les numéros sensibles

### **Permissions requises :**
- `calls:create` : Créer des appels
- `calls:read` : Lire l'historique (optionnel)

## 🚀 Déploiement

### 1. **Développement local**
```bash
# Copier le fichier .env
cp .env.example .env

# Remplir la clé API
echo "REACT_APP_RINGOVER_API_KEY=your_key" >> .env

# Démarrer l'application
npm run dev
```

### 2. **Production**
```bash
# Vérifier la configuration
npm run build

# Variables d'environnement dans votre plateforme
REACT_APP_RINGOVER_API_KEY=prod_key_here
```

## 🧪 Tests

### **Test manuel :**
1. Ouvrez une fiche client
2. Cliquez sur le bouton d'appel
3. Vérifiez les logs dans la console
4. Testez avec des numéros invalides

### **Test de connectivité :**
```typescript
// Dans la console du navigateur
import { ringoverService } from './src/services/ringoverService';
ringoverService.checkConnectivity().then(console.log);
```

## 📞 Support

### **En cas de problème :**
1. Vérifiez la clé API dans `.env`
2. Consultez les logs de la console
3. Testez la connectivité API
4. Vérifiez les permissions Ringover

### **Logs utiles :**
- Console du navigateur
- Réseau (Network tab)
- Réponse de l'API Ringover

---

**🎉 Votre ERP est maintenant équipé du Click-to-Call Ringover !**

Vos SDR peuvent maintenant appeler vos prospects et clients en 1 clic directement depuis l'interface. 🚀
