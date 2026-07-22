import { useNavigate, useParams } from 'react-router-dom'
import ContactDetails from '@/modules/ContactDetails'

/**
 * Route wrapper pour `/clients/:id` — détail d'un lead/contact CRM.
 * Lit l'id depuis l'URL. Retour = navigate(-1) (POP) : ramène à la vue
 * précédente en restaurant sa position de scroll (cf. Layout), au lieu de
 * repartir en haut de la liste.
 */
export function ClientDetailsRoute() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) return null

  return (
    <ContactDetails
      contactId={id}
      onBack={() => navigate(-1)}
    />
  )
}

export default ClientDetailsRoute
