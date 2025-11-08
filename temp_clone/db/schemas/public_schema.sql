--
-- Schema dump: public schema (generated)
--

-- Ensure extensions that appear as defaults exist (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table: public.user_profile
CREATE TABLE IF NOT EXISTS public.user_profile (
    user_id uuid NOT NULL DEFAULT gen_random_uuid(),
    display_name text,
    phone_e164 text,
    preferred_channel text DEFAULT 'web'::text CHECK (preferred_channel = ANY (ARRAY['sms'::text, 'web'::text, 'telegram'::text])),
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id)
);
ALTER TABLE IF EXISTS public.user_profile ENABLE ROW LEVEL SECURITY;

-- Table: public.fulfillment
CREATE TABLE IF NOT EXISTS public.fulfillment (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    need_id uuid NOT NULL,
    helper_id uuid NOT NULL,
    message text,
    created_at timestamptz DEFAULT now(),
    status text DEFAULT 'proposed'::text CHECK (status = ANY (ARRAY['proposed'::text, 'accepted'::text, 'declined'::text, 'fulfilled'::text])),
    accepted_at timestamptz,
    PRIMARY KEY (id)
);
ALTER TABLE IF EXISTS public.fulfillment ENABLE ROW LEVEL SECURITY;

-- Table: public.needs
CREATE TABLE IF NOT EXISTS public.needs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    category text,
    city text,
    street text,
    state text,
    zip_code text,
    created_at timestamptz DEFAULT now(),
    owner_id uuid,
    contact_email text,
    contact_phone_e164 text,
    whatsapp_id text,
    provider text,
    deleted_at timestamptz,
    flagged boolean DEFAULT false,
    fulfilled_at timestamptz,
    fulfilled boolean DEFAULT false,
    requester_id uuid,
    status text DEFAULT 'unfulfilled'::text CHECK (status = ANY (ARRAY['new'::text, 'accepted'::text, 'fulfilled'::text])),
    PRIMARY KEY (id)
);
ALTER TABLE IF EXISTS public.needs ENABLE ROW LEVEL SECURITY;

-- Table: public.user_identity
CREATE TABLE IF NOT EXISTS public.user_identity (
    user_id uuid,
    provider text NOT NULL CHECK (provider = ANY (ARRAY['email'::text, 'phone'::text, 'whatsapp'::text, 'telegram'::text])),
    identifier text NOT NULL,
    verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (provider, identifier)
);

-- Table: public.v_cnt
CREATE TABLE IF NOT EXISTS public.v_cnt (
    count int8
);

-- Foreign key constraints
ALTER TABLE IF EXISTS public.fulfillment
  ADD CONSTRAINT IF NOT EXISTS fulfillment_need_id_fkey FOREIGN KEY (need_id) REFERENCES public.needs(id);

ALTER TABLE IF EXISTS public.fulfillment
  ADD CONSTRAINT IF NOT EXISTS fulfillment_helper_id_fkey FOREIGN KEY (helper_id) REFERENCES auth.users(id);

ALTER TABLE IF EXISTS public.needs
  ADD CONSTRAINT IF NOT EXISTS needs_owner_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);

ALTER TABLE IF EXISTS public.user_identity
  ADD CONSTRAINT IF NOT EXISTS user_identity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON public.user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_need_id ON public.fulfillment(need_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_helper_id ON public.fulfillment(helper_id);
CREATE INDEX IF NOT EXISTS idx_needs_owner_id ON public.needs(owner_id);

-- Trigger: keep updated_at on needs and fulfillment (adds updated_at column if missing) ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS updated_at timestamptz; CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END;

D
R
O
P
T
R
I
G
G
E
R
I
F
E
X
I
S
T
S
n
e
e
d
s
s
e
t
u
p
d
a
t
e
d
a
t
O
N
p
u
b
l
i
c
.
n
e
e
d
s
;
C
R
E
A
T
E
T
R
I
G
G
E
R
n
e
e
d
s
s
e
t
u
p
d
a
t
e
d
a
t
B
E
F
O
R
E
U
P
D
A
T
E
O
N
p
u
b
l
i
c
.
n
e
e
d
s
F
O
R
E
A
C
H
R
O
W
E
X
E
C
U
T
E
F
U
N
C
T
I
O
N
p
u
b
l
i
c
.
s
e
t
u
p
d
a
t
e
d
a
t
(
)
;
DROPTRIGGERIFEXISTSneeds 
s
​
 et 
u
​
 pdated 
a
​
 tONpublic.needs;CREATETRIGGERneeds 
s
​
 et 
u
​
 pdated 
a
​
 tBEFOREUPDATEONpublic.needsFOREACHROWEXECUTEFUNCTIONpublic.set 
u
​
 pdated 
a
​
 t();
ALTER TABLE public.fulfillment ADD COLUMN IF NOT EXISTS updated_at timestamptz; DROP TRIGGER IF EXISTS fulfillment_set_updated_at ON public.fulfillment; CREATE TRIGGER fulfillment_set_updated_at BEFORE UPDATE ON public.fulfillment FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: on needs mark fulfilled boolean and fulfilled_at when status = 'fulfilled' CREATE OR REPLACE FUNCTION public.needs_status_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP = 'UPDATE' THEN IF NEW.status = 'fulfilled' AND OLD.status IS DISTINCT FROM 'fulfilled' THEN NEW.fulfilled = true; NEW.fulfilled_at = now(); ELSIF NEW.status IS DISTINCT FROM 'fulfilled' AND OLD.status = 'fulfilled' THEN NEW.fulfilled = false; NEW.fulfilled_at = NULL; END IF; END IF; RETURN NEW; END;

D
R
O
P
T
R
I
G
G
E
R
I
F
E
X
I
S
T
S
n
e
e
d
s
s
t
a
t
u
s
t
r
i
g
g
e
r
O
N
p
u
b
l
i
c
.
n
e
e
d
s
;
C
R
E
A
T
E
T
R
I
G
G
E
R
n
e
e
d
s
s
t
a
t
u
s
t
r
i
g
g
e
r
B
E
F
O
R
E
U
P
D
A
T
E
O
N
p
u
b
l
i
c
.
n
e
e
d
s
F
O
R
E
A
C
H
R
O
W
E
X
E
C
U
T
E
F
U
N
C
T
I
O
N
p
u
b
l
i
c
.
n
e
e
d
s
s
t
a
t
u
s
u
p
d
a
t
e
(
)
;
DROPTRIGGERIFEXISTSneeds 
s
​
 tatus 
t
​
 riggerONpublic.needs;CREATETRIGGERneeds 
s
​
 tatus 
t
​
 riggerBEFOREUPDATEONpublic.needsFOREACHROWEXECUTEFUNCTIONpublic.needs 
s
​
 tatus 
u
​
 pdate();
-- Trigger: cascade soft-delete (set deleted_at) to related fulfillments when needs.deleted_at is set CREATE OR REPLACE FUNCTION public.needs_soft_delete_cascade() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN UPDATE public.fulfillment SET status = 'declined', accepted_at = NULL, updated_at = now() WHERE need_id = NEW.id AND status <> 'declined'; END IF; RETURN NEW; END;

D
R
O
P
T
R
I
G
G
E
R
I
F
E
X
I
S
T
S
n
e
e
d
s
s
o
f
t
d
e
l
e
t
e
t
r
i
g
g
e
r
O
N
p
u
b
l
i
c
.
n
e
e
d
s
;
C
R
E
A
T
E
T
R
I
G
G
E
R
n
e
e
d
s
s
o
f
t
d
e
l
e
t
e
t
r
i
g
g
e
r
A
F
T
E
R
U
P
D
A
T
E
O
N
p
u
b
l
i
c
.
n
e
e
d
s
F
O
R
E
A
C
H
R
O
W
W
H
E
N
(
N
E
W
.
d
e
l
e
t
e
d
a
t
I
S
N
O
T
N
U
L
L
)
E
X
E
C
U
T
E
F
U
N
C
T
I
O
N
p
u
b
l
i
c
.
n
e
e
d
s
s
o
f
t
d
e
l
e
t
e
c
a
s
c
a
d
e
(
)
;
DROPTRIGGERIFEXISTSneeds 
s
​
 oft 
d
​
 elete 
t
​
 riggerONpublic.needs;CREATETRIGGERneeds 
s
​
 oft 
d
​
 elete 
t
​
 riggerAFTERUPDATEONpublic.needsFOREACHROWWHEN(NEW.deleted 
a
​
 tISNOTNULL)EXECUTEFUNCTIONpublic.needs 
s
​
 oft 
d
​
 elete 
c
​
 ascade();
-- Trigger: notify on new fulfillment (example: write to a lightweight audit table) CREATE TABLE IF NOT EXISTS public.audit_events ( id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_type text NOT NULL, payload jsonb, created_at timestamptz DEFAULT now() ); CREATE OR REPLACE FUNCTION public.fulfillment_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO public.audit_events(event_type, payload) VALUES ( 'fulfillment_created', jsonb_build_object( 'fulfillment_id', NEW.id, 'need_id', NEW.need_id, 'helper_id', NEW.helper_id, 'status', NEW.status ) ); RETURN NEW; END;

D
R
O
P
T
R
I
G
G
E
R
I
F
E
X
I
S
T
S
f
u
l
f
i
l
l
m
e
n
t
a
u
d
i
t
t
r
i
g
g
e
r
O
N
p
u
b
l
i
c
.
f
u
l
f
i
l
l
m
e
n
t
;
C
R
E
A
T
E
T
R
I
G
G
E
R
f
u
l
f
i
l
l
m
e
n
t
a
u
d
i
t
t
r
i
g
g
e
r
A
F
T
E
R
I
N
S
E
R
T
O
N
p
u
b
l
i
c
.
f
u
l
f
i
l
l
m
e
n
t
F
O
R
E
A
C
H
R
O
W
E
X
E
C
U
T
E
F
U
N
C
T
I
O
N
p
u
b
l
i
c
.
f
u
l
f
i
l
l
m
e
n
t
a
u
d
i
t
(
)
;
DROPTRIGGERIFEXISTSfulfillment 
a
​
 udit 
t
​
 riggerONpublic.fulfillment;CREATETRIGGERfulfillment 
a
​
 udit 
t
​
 riggerAFTERINSERTONpublic.fulfillmentFOREACHROWEXECUTEFUNCTIONpublic.fulfillment 
a
​
 udit();
-- Indexes to support RLS checks and lookups CREATE INDEX IF NOT EXISTS idx_needs_status ON public.needs(status); CREATE INDEX IF NOT EXISTS idx_needs_requester_id ON public.needs(requester_id); CREATE INDEX IF NOT EXISTS idx_fulfillment_helper_id_status ON public.fulfillment(helper_id, status);

-- Helper security-definer function: returns boolean whether current auth user is a member/owner -- Assumes auth.users and possibly a user_profiles table -- adjust as needed CREATE OR REPLACE FUNCTION public.is_owner(p_owner_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT p_owner_id = (SELECT auth.uid());

R
E
V
O
K
E
E
X
E
C
U
T
E
O
N
F
U
N
C
T
I
O
N
p
u
b
l
i
c
.
i
s
o
w
n
e
r
(
u
u
i
d
)
F
R
O
M
a
n
o
n
,
a
u
t
h
e
n
t
i
c
a
t
e
d
;
G
R
A
N
T
E
X
E
C
U
T
E
O
N
F
U
N
C
T
I
O
N
p
u
b
l
i
c
.
i
s
o
w
n
e
r
(
u
u
i
d
)
T
O
a
u
t
h
e
n
t
i
c
a
t
e
d
;
REVOKEEXECUTEONFUNCTIONpublic.is 
o
​
 wner(uuid)FROManon,authenticated;GRANTEXECUTEONFUNCTIONpublic.is 
o
​
 wner(uuid)TOauthenticated;
-- RLS: basic policies -- Notes: -- - Policies use auth.uid() via helper functions or direct SELECT auth.uid() to match current user -- - service_role bypasses RLS automatically

-- user_profile: users can SELECT/UPDATE their own profile; authenticated may INSERT only for themselves ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "user_profile_self_select" ON public.user_profile; CREATE POLICY "user_profile_self_select" ON public.user_profile FOR SELECT TO authenticated USING ((SELECT auth.uid())::uuid = user_id);

DROP POLICY IF EXISTS "user_profile_self_insert" ON public.user_profile; CREATE POLICY "user_profile_self_insert" ON public.user_profile FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid())::uuid = user_id);

DROP POLICY IF EXISTS "user_profile_self_update" ON public.user_profile; CREATE POLICY "user_profile_self_update" ON public.user_profile FOR UPDATE TO authenticated USING ((SELECT auth.uid())::uuid = user_id) WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- needs: allow authenticated to INSERT with owner_id = auth.uid(); owners and requester can SELECT/UPDATE their rows ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "needs_insert_auth" ON public.needs; CREATE POLICY "needs_insert_auth" ON public.needs FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid())::uuid = owner_id OR owner_id IS NULL);

-- allow owners to SELECT/UPDATE/DELETE their needs DROP POLICY IF EXISTS "needs_owner_select" ON public.needs; CREATE POLICY "needs_owner_select" ON public.needs FOR SELECT TO authenticated USING ((SELECT auth.uid())::uuid = owner_id OR (SELECT auth.uid())::uuid = requester_id);

DROP POLICY IF EXISTS "needs_owner_update" ON public.needs; CREATE POLICY "needs_owner_update" ON public.needs FOR UPDATE TO authenticated USING ((SELECT auth.uid())::uuid = owner_id OR (SELECT auth.uid())::uuid = requester_id) WITH CHECK ((SELECT auth.uid())::uuid = owner_id OR (SELECT auth.uid())::uuid = requester_id);

DROP POLICY IF EXISTS "needs_owner_delete" ON public.needs; CREATE POLICY "needs_owner_delete" ON public.needs FOR DELETE TO authenticated USING ((SELECT auth.uid())::uuid = owner_id);

-- needs: public read for unflagged, unfulfilled needs (optional) DROP POLICY IF EXISTS "needs_public_read" ON public.needs; CREATE POLICY "needs_public_read" ON public.needs FOR SELECT TO anon, authenticated USING (flagged = false AND deleted_at IS NULL AND fulfilled = false);

-- fulfillment: allow helper to INSERT when they are the helper; allow helper and related users to view ALTER TABLE public.fulfillment ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "fulfillment_insert_authenticated" ON public.fulfillment; CREATE POLICY "fulfillment_insert_authenticated" ON public.fulfillment FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid())::uuid = helper_id);

DROP POLICY IF EXISTS "fulfillment_helper_select" ON public.fulfillment; CREATE POLICY "fulfillment_helper_select" ON public.fulfillment FOR SELECT TO authenticated USING ((SELECT auth.uid())::uuid = helper_id OR (SELECT auth.uid())::uuid = (SELECT owner_id FROM public.needs WHERE id = need_id));

DROP POLICY IF EXISTS "fulfillment_update_helper" ON public.fulfillment; CREATE POLICY "fulfillment_update_helper" ON public.fulfillment FOR UPDATE TO authenticated USING ((SELECT auth.uid())::uuid = helper_id OR (SELECT auth.uid())::uuid = (SELECT owner_id FROM public.needs WHERE id = need_id)) WITH CHECK ((SELECT auth.uid())::uuid = helper_id OR (SELECT auth.uid())::uuid = (SELECT owner_id FROM public.needs WHERE id = need_id));

-- user_identity: allow inserting/verifying your own identifiers, but restrict reading ALTER TABLE public.user_identity ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "user_identity_insert" ON public.user_identity; CREATE POLICY "user_identity_insert" ON public.user_identity FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid())::uuid = user_id);

DROP POLICY IF EXISTS "user_identity_select_owner" ON public.user_identity; CREATE POLICY "user_identity_select_owner" ON public.user_identity FOR SELECT TO authenticated USING ((SELECT auth.uid())::uuid = user_id);

DROP POLICY IF EXISTS "user_identity_update_owner" ON public.user_identity; CREATE POLICY "user_identity_update_owner" ON public.user_identity FOR UPDATE TO authenticated USING ((SELECT auth.uid())::uuid = user_id) WITH CHECK ((SELECT auth.uid())::uuid = user_id);

-- audit_events: restrict access (only service_role or owner via function) — simplest: deny anon/auth access ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "audit_events_no_access" ON public.audit_events; CREATE POLICY "audit_events_no_access" ON public.audit_events FOR ALL TO anon, authenticated USING (false);

-- Validate current policies quickly (simple check query you can run in psql): -- SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname='public';