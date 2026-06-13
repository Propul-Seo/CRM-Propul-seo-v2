import { User, Mail, Phone, Globe, Building, MapPin, FileText, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { getStatusColor, copyToClipboard } from '../lib/contactHelpers';
import type { Contact } from '../../../hooks/useContacts';

interface ContactInfoSidebarProps {
  contact: Contact;
}

export function ContactInfoSidebar({ contact }: ContactInfoSidebarProps) {
  return (
    <div className="lg:col-span-1 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{contact.email}</span>
            </div>
            <button
              onClick={() => copyToClipboard(contact.email, 'Email')}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors duration-200"
              title="Copier l'email"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {contact.project_price !== undefined && contact.project_price !== null && (
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-semibold">
                {'\u{1F4B0}'} {contact.project_price.toLocaleString('fr-FR')} {'\u20AC'}
              </span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{contact.phone}</span>
              </div>
              <button
                onClick={() => copyToClipboard(contact.phone || '', 'Téléphone')}
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors duration-200"
                title="Copier le téléphone"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          )}
          {contact.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{contact.website}</a>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{contact.company}</span>
            </div>
          )}
          {contact.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{contact.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(contact.status)}>
              {contact.status}
            </Badge>
          </div>
          {contact.assigned_user_name && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{'\u{1F464}'} {contact.assigned_user_name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {contact.notes && contact.notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contact.notes.map((note, index) => (
                <p key={index} className="text-sm text-muted-foreground bg-surface-2/30 p-3 rounded">
                  {note}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
