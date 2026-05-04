-- ============================================================
-- FIX: Trigger handle_new_user non crea accounts per dipendenti invitati
-- Esegui nel Supabase SQL Editor → New query → Run
-- Idempotente: sicuro da rieseguire più volte
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Salta la creazione di accounts se questo utente è un dipendente invitato
  -- (esiste un record team_users con la stessa email in stato pending o active)
  if exists (
    select 1 from public.team_users
    where email = new.email
      and status in ('pending', 'active')
  ) then
    return new;
  end if;

  insert into public.accounts (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, accounts.full_name),
        avatar_url = coalesce(excluded.avatar_url, accounts.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

-- Ricrea il trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FUNZIONE HELPER: usata dal server action acceptInvite per
-- eliminare il record accounts dell'employee.
--
-- FIX v2: rimossa la guard sui dati propri (quotes/clients) —
-- un employee non è mai un owner, quindi il suo accounts record
-- va sempre rimosso, qualunque cosa contenga.
-- I dati orfani creati per errore non causano problemi RLS.
-- ============================================================
create or replace function public.cleanup_employee_account(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Elimina il record accounts solo se l'utente è un employee attivo.
  -- Nessun check sui dati: l'employee non deve mai essere un owner.
  if exists (
    select 1 from public.team_users
    where user_id = p_user_id and status = 'active'
  ) then
    delete from public.accounts where id = p_user_id;
  end if;
end;
$$;

-- ============================================================
-- CLEANUP MANUALE (opzionale, solo se il fix era già stato
-- eseguito ma il dipendente ha ancora un accounts record):
-- Sostituisci con l'email reale e de-commenta.
-- ============================================================
-- DELETE FROM public.accounts
-- WHERE email = 'email-del-dipendente@esempio.com';
