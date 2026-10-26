-- Important : créer au préalable l'utilisatrice dans Authentication > Users.
-- Remplacer l'adresse ci-dessous par l'adresse exacte du compte autorisé.
insert into public.admins (user_id)
select id from auth.users where email = 'REMPLACER_PAR_SON_EMAIL@example.com'
on conflict (user_id) do nothing;

-- Vérifier qu'une ligne a bien été insérée :
select a.user_id, u.email from public.admins a join auth.users u on u.id = a.user_id;
