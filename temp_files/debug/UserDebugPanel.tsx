import React, { useState } from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function UserDebugPanel() {
  const { currentUserData, loading, error, updateUserName, refetch } = useCurrentUser();
  const [newName, setNewName] = useState('');

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    
    const success = await updateUserName(newName.trim());
    if (success) {
      setNewName('');
      toast.success('Nom mis à jour avec succès !');
    } else {
      toast.error('Erreur lors de la mise à jour du nom');
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="text-center">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Debug Utilisateur</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-red-600 text-sm">
            <strong>Erreur:</strong> {error}
          </div>
        )}
        
        <div className="space-y-2">
          <div><strong>ID:</strong> {currentUserData?.id || 'N/A'}</div>
          <div><strong>Nom:</strong> {currentUserData?.name || 'N/A'}</div>
          <div><strong>Email:</strong> {currentUserData?.email || 'N/A'}</div>
          <div><strong>Rôle:</strong> {currentUserData?.role || 'N/A'}</div>
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Nouveau nom"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button onClick={handleUpdateName} disabled={!newName.trim()}>
            Mettre à jour le nom
          </Button>
        </div>

        <Button onClick={refetch} variant="outline">
          Actualiser les données
        </Button>
      </CardContent>
    </Card>
  );
}
