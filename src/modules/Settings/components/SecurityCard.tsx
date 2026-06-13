import { motion } from 'framer-motion';
import { Shield, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

interface SecurityCardProps {
  onChangePassword: () => void;
}

export function SecurityCard({ onChangePassword }: SecurityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Sécurité</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-surface-static rounded-lg">
            <div className="flex items-center space-x-3">
              <Key className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium text-foreground">Mot de passe</p>
                <p className="text-sm text-muted-foreground">Modifiez votre mot de passe de connexion</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onChangePassword}
              className="flex items-center space-x-2 text-orange-400 border-orange-600 hover:bg-orange-900/30"
            >
              <Key className="w-4 h-4" />
              <span>Modifier</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
