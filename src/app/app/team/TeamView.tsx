'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTeamUsers,
  inviteTeamUser,
  updateTeamUserPermissions,
  deleteTeamUser,
  getCurrentUserRole,
} from '@/lib/actions/team-users';
import type { TeamUser } from '@/lib/types';
import { useToast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  UserPlus, Mail, Trash2, Clock, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Shield, User, Crown,
} from 'lucide-react';

// ─── Sezioni permessi ────────────────────────────────────────────────────────

type PermKey = keyof Pick<TeamUser,
  | 'can_view_onedigit_dashboard' | 'can_view_clients' | 'can_view_packages'
  | 'can_view_contracts' | 'can_view_commercials' | 'can_view_supplier_costs'
  | 'can_view_storico_contratti' | 'can_view_quotes' | 'can_edit_quotes'
  | 'can_view_servizi' | 'can_view_bundle' | 'can_send_quotes' | 'can_view_impostazioni'
>;

const ONEDIGIT_PERMS: { key: PermKey; label: string; description: string }[] = [
  { key: 'can_view_onedigit_dashboard', label: 'Dashboard', description: 'KPI e ricavi mensili' },
  { key: 'can_view_clients', label: 'Clienti', description: 'Visualizza e gestisce clienti' },
  { key: 'can_view_packages', label: 'Pacchetti', description: 'Visualizza pacchetti e contenuti' },
  { key: 'can_view_contracts', label: 'Contratti', description: 'Visualizza contratti attivi' },
  { key: 'can_view_commercials', label: 'Commerciali', description: 'Visualizza agenti e commissioni' },
  { key: 'can_view_supplier_costs', label: 'Costi Fornitore', description: 'Visualizza prezzi fornitori' },
  { key: 'can_view_storico_contratti', label: 'Storico Contratti', description: 'Rinnovi, disdette, scadenze' },
];

const QUOTEBUILDER_PERMS: { key: PermKey; label: string; description: string }[] = [
  { key: 'can_view_quotes', label: 'Preventivi', description: 'Visualizza lista preventivi' },
  { key: 'can_edit_quotes', label: 'Editor Preventivi', description: 'Crea e modifica preventivi' },
  { key: 'can_view_servizi', label: 'Servizi Template', description: 'Visualizza catalogo servizi' },
  { key: 'can_view_bundle', label: 'Bundle Progetti', description: 'Visualizza bundle e raggruppamenti' },
  { key: 'can_send_quotes', label: 'Invia Preventivi', description: 'Può inviare preventivi ai clienti' },
  { key: 'can_view_impostazioni', label: 'Impostazioni', description: 'Dati azienda e configurazioni' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: TeamUser['role'] }) {
  if (role === 'owner') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-900 text-white">
      <Crown className="w-3 h-3" /> Owner
    </span>
  );
  if (role === 'admin') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-700 text-white">
      <Shield className="w-3 h-3" /> Admin
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
      <User className="w-3 h-3" /> Utente
    </span>
  );
}

function StatusBadge({ status }: { status: TeamUser['status'] }) {
  if (status === 'active') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      <CheckCircle className="w-3 h-3" /> Attivo
    </span>
  );
  if (status === 'disabled') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
      <XCircle className="w-3 h-3" /> Disabilitato
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> In attesa
    </span>
  );
}

function Avatar({ member }: { member: TeamUser }) {
  if (member.avatar_url) {
    return (
      <img
        src={member.avatar_url}
        alt={member.name}
        className="w-10 h-10 rounded-full object-cover border border-zinc-200 shrink-0"
      />
    );
  }
  const initials = member.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-zinc-600">{initials}</span>
    </div>
  );
}

// ─── Accordion sezione permessi ───────────────────────────────────────────────

function PermissionToggle({
  checked,
  onChange,
  disabled,
}: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      disabled={disabled}
      className="accent-zinc-900 w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

function PermissionSection({
  title,
  perms,
  member,
  onToggle,
  disabled,
}: {
  title: string;
  perms: { key: PermKey; label: string; description: string }[];
  member: TeamUser;
  onToggle: (key: PermKey, val: boolean) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const disabledCount = perms.filter(p => !member[p.key]).length;

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
          <span className="text-sm font-medium text-zinc-800">{title}</span>
        </div>
        <span className="text-xs text-zinc-500">{disabledCount}/{perms.length} disattivati</span>
      </button>
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-white">
          {perms.map(({ key, label, description }) => (
            <label
              key={key}
              className={`flex items-start gap-3 p-2.5 rounded-md border transition-colors cursor-pointer ${
                disabled
                  ? 'border-zinc-100 bg-zinc-50 opacity-50 cursor-not-allowed'
                  : member[key]
                  ? 'border-zinc-300 bg-zinc-50'
                  : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <PermissionToggle
                checked={!member[key]}
                disabled={disabled}
                onChange={val => onToggle(key, !val)}
              />
              <div>
                <p className="text-xs font-medium text-zinc-800 leading-tight">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Accordion permessi membro ────────────────────────────────────────────────

function MemberPermissions({
  member,
  canEdit,
  canPromote,
}: { member: TeamUser; canEdit: boolean; canPromote: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const updatePerm = useMutation({
    mutationFn: (perms: Partial<Parameters<typeof updateTeamUserPermissions>[1]>) =>
      updateTeamUserPermissions(member.id, perms),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-users'] }),
    onError: (err: Error) => toast(err.message, 'error'),
  });

  if (member.role === 'owner') return null;

  const handleToggle = (key: PermKey, val: boolean) => {
    updatePerm.mutate({ [key]: val });
  };

  const disabled = !canEdit || updatePerm.isPending;

  return (
    <div className="border-t border-zinc-100 mt-3 pt-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors mb-2"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        Gestisci permessi
      </button>
      {open && (
        <div className="flex flex-col gap-2">
          <PermissionSection
            title="OneDigit"
            perms={ONEDIGIT_PERMS}
            member={member}
            onToggle={handleToggle}
            disabled={disabled}
          />
          <PermissionSection
            title="QuoteBuilder"
            perms={QUOTEBUILDER_PERMS}
            member={member}
            onToggle={handleToggle}
            disabled={disabled}
          />
          {canPromote && member.role === 'member' && (
            <button
              type="button"
              onClick={() => updatePerm.mutate({ role: 'admin' })}
              disabled={updatePerm.isPending}
              className="mt-1 text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2 text-left"
            >
              Promuovi ad Admin
            </button>
          )}
          {canPromote && member.role === 'admin' && (
            <button
              type="button"
              onClick={() => updatePerm.mutate({ role: 'member' })}
              disabled={updatePerm.isPending}
              className="mt-1 text-xs text-zinc-400 hover:text-red-600 underline underline-offset-2 text-left"
            >
              Rimuovi ruolo Admin
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Riga membro ─────────────────────────────────────────────────────────────

function MemberRow({
  member,
  currentUserRole,
}: {
  member: TeamUser;
  currentUserRole: 'owner' | 'admin' | 'member';
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const remove = useMutation({
    mutationFn: () => deleteTeamUser(member.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-users'] });
      toast('Membro rimosso', 'success');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const canDelete = member.role !== 'owner' && (
    currentUserRole === 'owner' ||
    (currentUserRole === 'admin' && member.role === 'member')
  );

  const canEditPerms = member.role !== 'owner' && (
    currentUserRole === 'owner' ||
    (currentUserRole === 'admin' && member.role !== 'admin')
  );

  // Owner può promuovere admin; admin non può creare altri admin
  const canPromote = member.role !== 'owner' && currentUserRole === 'owner';

  function copyInviteLink() {
    if (!member.invite_token) return;
    const url = `${window.location.origin}/auth/accept-invite/${member.invite_token}`;
    navigator.clipboard.writeText(url);
    toast('Link copiato negli appunti', 'success');
  }

  return (
    <>
      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar member={member} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-sm font-semibold text-zinc-900 truncate">{member.name}</p>
                <RoleBadge role={member.role} />
                <StatusBadge status={member.status} />
              </div>
              <p className="text-xs text-zinc-500 truncate">{member.email}</p>
              {member.status === 'pending' && member.invite_token && (
                <button
                  onClick={copyInviteLink}
                  className="mt-1 text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2"
                >
                  Copia link invito
                </button>
              )}
            </div>
          </div>
          {canDelete && (
            <button
              onClick={() => setDeleteOpen(true)}
              title="Rimuovi membro"
              className="p-1.5 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <MemberPermissions
          member={member}
          canEdit={canEditPerms}
          canPromote={canPromote}
        />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => remove.mutate()}
        title="Rimuovi membro"
        description={`Vuoi rimuovere ${member.name} dal team? L'accesso verrà revocato immediatamente.`}
        loading={remove.isPending}
      />
    </>
  );
}

// ─── Dialog invito ────────────────────────────────────────────────────────────

function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const { toast } = useToast();
  const qc = useQueryClient();

  const invite = useMutation({
    mutationFn: () => inviteTeamUser({ name, email, role }),
    onSuccess: (token) => {
      qc.invalidateQueries({ queryKey: ['team-users'] });
      const inviteUrl = `${window.location.origin}/auth/accept-invite/${token}`;
      const subject = encodeURIComponent('Sei stato invitato sulla piattaforma');
      const body = encodeURIComponent(
        `Ciao ${name},\n\nSei stato invitato a collaborare sulla piattaforma.\n\nClicca il link qui sotto per accettare l'invito (valido 7 giorni):\n${inviteUrl}\n\nA presto!`
      );
      window.open(`https://mail.google.com/mail/?view=cm&to=${email}&su=${subject}&body=${body}`, '_blank');
      toast('Invito creato — si apre il client email', 'success');
      setName('');
      setEmail('');
      setRole('member');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  return (
    <Dialog open={open} onClose={onClose} title="Invita membro">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-400">
          Inserisci nome ed email del membro da invitare. Verrà generato un link con scadenza 7 giorni.
        </p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Nome</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Mario Rossi" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mario@azienda.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Ruolo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
                  role === 'member'
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                }`}
              >
                <User className="w-4 h-4" /> Utente
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
                  role === 'admin'
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                }`}
              >
                <Shield className="w-4 h-4" /> Admin
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {role === 'admin'
                ? 'Admin può invitare membri e gestire i loro permessi.'
                : 'Utente accede solo alle sezioni abilitate dall\'owner.'}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button
            onClick={() => invite.mutate()}
            disabled={!name.trim() || !email.trim() || invite.isPending}
          >
            <Mail className="w-4 h-4 mr-2" />
            {invite.isPending ? 'Creando invito...' : 'Crea invito & apri email'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ─── TeamView ─────────────────────────────────────────────────────────────────

export function TeamView() {
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: rawMembers = [], isLoading } = useQuery({
    queryKey: ['team-users'],
    queryFn: getTeamUsers,
  });

  const ROLE_ORDER: Record<TeamUser['role'], number> = { owner: 0, admin: 1, member: 2 };
  const members = [...rawMembers].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);

  const { data: currentUserRole = 'member' } = useQuery({
    queryKey: ['current-user-role'],
    queryFn: getCurrentUserRole,
    staleTime: Infinity,
  });

  const canInvite = currentUserRole === 'owner' || currentUserRole === 'admin';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="-ml-0.5 text-2xl font-bold text-zinc-900 tracking-tight">Team</h1>
        {canInvite && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invita membro
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-zinc-500">Caricamento...</div>
      ) : members.length === 0 ? (
        <EmptyState
          title="Nessun membro nel team"
          description="Invita collaboratori per dare loro accesso alla piattaforma con permessi granulari."
          action={
            canInvite ? (
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invita il primo membro
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {members.map(m => (
            <MemberRow key={m.id} member={m} currentUserRole={currentUserRole} />
          ))}
        </div>
      )}

      {canInvite && (
        <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
      )}
    </div>
  );
}
