import { getInviteByToken } from '@/lib/actions/team-users';
import { AcceptInviteClient } from './AcceptInviteClient';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function AcceptInvitePage({ params }: Props) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center max-w-sm px-4">
          <h1 className="text-xl font-semibold text-zinc-800 mb-2">Link non valido</h1>
          <p className="text-sm text-zinc-500">
            Questo link di invito non esiste o è già stato utilizzato.
          </p>
        </div>
      </div>
    );
  }

  if (invite.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center max-w-sm px-4">
          <h1 className="text-xl font-semibold text-zinc-800 mb-2">Invito già utilizzato</h1>
          <p className="text-sm text-zinc-500">
            Questo invito è stato già accettato. Effettua il login per accedere alla piattaforma.
          </p>
        </div>
      </div>
    );
  }

  const isExpired =
    invite.invite_expires_at && new Date(invite.invite_expires_at) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center max-w-sm px-4">
          <h1 className="text-xl font-semibold text-zinc-800 mb-2">Invito scaduto</h1>
          <p className="text-sm text-zinc-500">
            Questo link è scaduto. Chiedi al tuo responsabile di inviare un nuovo invito.
          </p>
        </div>
      </div>
    );
  }

  return <AcceptInviteClient token={token} inviteeName={invite.name} inviteeEmail={invite.email} />;
}
