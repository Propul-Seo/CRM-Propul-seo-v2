import { useState, useRef } from 'react';
import { Upload, Link, Trash2, Image, Video, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import type { PostAssetRow } from '../../../types/supabase-types';

interface AssetManagerProps {
  assets: PostAssetRow[];
  onUpload: (file: File, type: 'image' | 'video' | 'document') => Promise<void>;
  onAddExternal: (url: string, type: 'image' | 'video' | 'document', fileName?: string) => Promise<void>;
  onDelete: (id: string, storagePath?: string | null) => Promise<void>;
  loading?: boolean;
}

const assetTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  video: Video,
  document: FileText,
};

export function AssetManager({ assets, onUpload, onAddExternal, onDelete, loading }: AssetManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [externalType, setExternalType] = useState<'image' | 'video' | 'document'>('image');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let type: 'image' | 'video' | 'document' = 'document';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    await onUpload(file, type);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddExternal = async () => {
    if (!externalUrl.trim()) return;
    await onAddExternal(externalUrl.trim(), externalType);
    setExternalUrl('');
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-foreground">Assets ({assets.length})</h4>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading} className="text-xs h-7 px-2 text-primary hover:bg-primary/10">
            <Upload className="w-3 h-3 mr-1" /> Upload
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowUrlInput(!showUrlInput)} className="text-xs h-7 px-2 text-muted-foreground hover:bg-surface-3">
            <Link className="w-3 h-3 mr-1" /> URL
          </Button>
        </div>
      </div>
      <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" />
      {showUrlInput && (
        <div className="flex gap-2">
          <Input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." className="flex-1 h-8 text-sm" />
          <NativeSelect value={externalType} onChange={(e) => setExternalType(e.target.value as 'image' | 'video' | 'document')} className="h-8 text-sm w-auto">
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="document">Document</option>
          </NativeSelect>
          <Button size="sm" onClick={handleAddExternal} disabled={!externalUrl.trim() || loading} className="h-8 text-sm">
            Ajouter
          </Button>
        </div>
      )}
      <div className="space-y-1">
        {assets.map(asset => {
          const Icon = assetTypeIcons[asset.asset_type] || FileText;
          return (
            <div key={asset.id} className="flex items-center gap-2 p-2 rounded-lg bg-input-bg border border-border-subtle">
              <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate flex-1 text-foreground">{asset.file_name || asset.asset_url || 'Fichier'}</span>
              {asset.asset_url && (
                <a href={asset.asset_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex-shrink-0">Voir</a>
              )}
              <button onClick={() => onDelete(asset.id, asset.storage_path)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
