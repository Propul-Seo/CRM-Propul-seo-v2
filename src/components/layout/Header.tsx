import React, { useState, useEffect } from 'react';
import { User, LogOut, Clock } from 'lucide-react';
import { useStore } from '../../store';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { getCurrentFrenchTime } from '../../utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ToastNotifications } from '../notifications/ToastNotifications';


export function Header() {
  const { currentUserData, loading: userLoading, updateUserName } = useCurrentUser();

  const [currentTime, setCurrentTime] = useState(getCurrentFrenchTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentFrenchTime());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erreur lors de la deconnexion:', error);
      }
    } catch (error) {
      console.error('Erreur lors de la deconnexion:', error);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    manager: 'Manager',
    developer: 'Developpeur',
    sales: 'Commercial'
  };

  const getUserInitial = () => {
    if (currentUserData?.name) return currentUserData.name.charAt(0).toUpperCase();
    if (currentUserData?.email) return currentUserData.email.charAt(0).toUpperCase();
    return 'U';
  };

  const getUserDisplayName = () => {
    if (currentUserData?.name) return currentUserData.name;
    if (currentUserData?.email) return currentUserData.email.split('@')[0];
    return 'Utilisateur';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-surface-1/80 backdrop-blur-sm transition-colors duration-200">
      <div className="container flex h-14 items-center justify-between px-6">
        {/* Time indicator */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground px-3 py-2 rounded-md bg-surface-2">
          <Clock className="h-4 w-4" />
          <span className="font-medium">{currentTime}</span>
        </div>

        {/* User actions */}
        <div className="flex items-center space-x-4">
          {/* Global notifications */}
          <ToastNotifications />

          {/* User menu */}
          <div className="ml-6 mr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-surface-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUserData?.avatar_url} alt={getUserDisplayName()} />
                    <AvatarFallback>
                      {getUserInitial()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-surface-2 border-border" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">{getUserDisplayName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUserData?.email}
                    </p>
                    <Badge variant="secondary" className="w-fit mt-1">
                      {roleLabels[currentUserData?.role || 'user']}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={handleSignOut} className="text-muted-foreground hover:bg-surface-3 hover:text-foreground">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Deconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
