import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, Linkedin, Instagram, RefreshCw, Unlink, ExternalLink } from 'lucide-react';
import { useSupabaseSocialConnections, useSocialConnectionsCRUD } from '@/hooks/supabase';

const platformConfig = {
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'bg-blue-500/15 text-blue-400' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'bg-pink-500/15 text-pink-400' },
} as const;

const statusConfig = {
  active: { label: 'Connecte', color: 'bg-green-500/15 text-green-400' },
  error: { label: 'Erreur', color: 'bg-red-500/15 text-red-400' },
  expired: { label: 'Expire', color: 'bg-amber-500/15 text-amber-400' },
} as const;

export function SocialConnectionsCard() {
  const { data: connections, refetch } = useSupabaseSocialConnections();
  const { initiateOAuth, disconnectPlatform, syncMetrics, handleOAuthCallback, loading } = useSocialConnectionsCRUD();
  const [syncing, setSyncing] = useState(false);

  // Listen for OAuth callback messages from popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'oauth-callback') {
        const { platform, code } = event.data;
        await handleOAuthCallback(platform, code);
        refetch();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleOAuthCallback, refetch]);

  const linkedinConn = connections?.find(c => c.platform === 'linkedin');
  const instagramConn = connections?.find(c => c.platform === 'instagram');

  const handleSync = async () => {
    setSyncing(true);
    await syncMetrics();
    setSyncing(false);
    refetch();
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Deconnecter ce compte ?')) return;
    await disconnectPlatform(id);
    refetch();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const renderConnection = (platform: 'linkedin' | 'instagram', connection: typeof linkedinConn) => {
    const config = platformConfig[platform];
    const Icon = config.icon;

    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{config.label}</span>
              {connection && (
                <Badge className={statusConfig[connection.sync_status].color}>
                  {statusConfig[connection.sync_status].label}
                </Badge>
              )}
            </div>
            {connection ? (
              <p className="text-xs text-muted-foreground">
                {connection.account_name} · Derniere sync : {formatDate(connection.last_sync_at)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Non connecte</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connection ? (
            <>
              {connection.sync_status === 'expired' && (
                <Button size="sm" variant="outline" onClick={() => initiateOAuth(platform)} disabled={loading}>
                  <ExternalLink className="h-3 w-3 mr-1" /> Reconnecter
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => handleDisconnect(connection.id)} disabled={loading}>
                <Unlink className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => initiateOAuth(platform)} disabled={loading}>
              <ExternalLink className="h-3 w-3 mr-1" /> Connecter
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-orange-500" />
          Connexions reseaux sociaux
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {renderConnection('linkedin', linkedinConn)}
        {renderConnection('instagram', instagramConn)}

        <Button
          onClick={handleSync}
          disabled={syncing || !connections?.length}
          variant="outline"
          className="w-full mt-4"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Synchronisation en cours...' : 'Synchroniser les metriques'}
        </Button>
      </CardContent>
    </Card>
  );
}
