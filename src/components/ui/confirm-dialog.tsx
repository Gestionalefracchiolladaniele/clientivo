'use client';

import { Dialog } from './dialog';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, loading }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} className="max-w-md">
      <p className="text-sm text-zinc-400 mb-6">{description}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Annulla</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={loading}>
          {loading ? 'Eliminazione...' : 'Elimina'}
        </Button>
      </div>
    </Dialog>
  );
}
