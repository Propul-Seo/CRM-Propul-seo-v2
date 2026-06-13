import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, User, Users, Crown, Briefcase, Code, ShoppingCart } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';

interface ProfileSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showCurrentUser?: boolean;
  filterByRole?: string[];
  className?: string;
  disabled?: boolean;
}

interface UserOption {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'developer' | 'sales';
  avatar_url?: string;
  team_id?: string;
  is_active: boolean;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Sélectionner un utilisateur...",
  showCurrentUser = true,
  filterByRole,
  className,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser, teamMembers } = useAuth();

  // Load available users
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        // Start with current user if showCurrentUser is true
        const availableUsers: UserOption[] = [];
        
        if (showCurrentUser && currentUser) {
          availableUsers.push({
            id: currentUser.id,
            auth_user_id: currentUser.auth_user_id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            avatar_url: currentUser.avatar_url,
            team_id: currentUser.team_id,
            is_active: currentUser.is_active
          });
        }

        // Add team members
        teamMembers.forEach(member => {
          if (member.is_active) {
            availableUsers.push({
              id: member.id,
              auth_user_id: member.auth_user_id,
              name: member.name,
              email: member.email,
              role: member.role,
              avatar_url: member.avatar_url,
              team_id: member.team_id,
              is_active: member.is_active
            });
          }
        });

        // Filter by role if specified
        const filteredUsers = filterByRole 
          ? availableUsers.filter(user => filterByRole.includes(user.role))
          : availableUsers;

        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentUser, teamMembers, showCurrentUser, filterByRole]);

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-600" />;
      case 'manager':
        return <Briefcase className="h-3 w-3 text-blue-600" />;
      case 'developer':
        return <Code className="h-3 w-3 text-green-600" />;
      case 'sales':
        return <ShoppingCart className="h-3 w-3 text-purple-600" />;
      default:
        return <User className="h-3 w-3 text-gray-600" />;
    }
  };

  // Get role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      case 'developer':
        return 'Développeur';
      case 'sales':
        return 'Commercial';
      default:
        return role;
    }
  };

  // Get selected user
  const selectedUser = users.find(user => user.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled || loading}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
              <span>Chargement...</span>
            </div>
          ) : selectedUser ? (
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.name} />
                <AvatarFallback className="text-xs">
                  {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedUser.name}</span>
              <Badge variant="secondary" className="text-xs">
                {getRoleLabel(selectedUser.role)}
              </Badge>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un utilisateur..." />
          <CommandList>
            <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => {
                    onValueChange(user.id);
                    setOpen(false);
                  }}
                  className="flex items-center space-x-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{user.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user.role)}
                    <Badge variant="outline" className="text-xs">
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Composant pour afficher un utilisateur sélectionné
export const SelectedUserDisplay: React.FC<{
  userId?: string;
  users: UserOption[];
  showRole?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ userId, users, showRole = true, size = 'md' }) => {
  const user = users.find(u => u.id === userId);

  if (!user) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <User className="h-4 w-4" />
        <span className="text-sm">Aucun utilisateur sélectionné</span>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base'
  };

  return (
    <div className="flex items-center space-x-2">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={user.avatar_url} alt={user.name} />
        <AvatarFallback className="text-xs">
          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium">{user.name}</span>
        {showRole && (
          <span className="text-xs text-muted-foreground">
            {getRoleLabel(user.role)}
          </span>
        )}
      </div>
    </div>
  );
};

// Fonction utilitaire pour obtenir le label du rôle
const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'manager':
      return 'Manager';
    case 'developer':
      return 'Développeur';
    case 'sales':
      return 'Commercial';
    default:
      return role;
  }
}; 