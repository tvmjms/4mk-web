import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabase';

type Need = {
  id: string;
  title: string;
  city: string | null;
  category: string | null;
  description: string | null;
  contact_email?: string | null;
  contact_phone_e164?: string | null;
  owner_id?: string | null;
};

export default function EditNeed() {
  const router = useRouter();
  const { id } = router.query;

  const [need, setNeed] = useState<Need | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Fetch the need by ID
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from('needs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) setErr(error.message);
      else setNeed(data);
      setLoading(false);
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!need) return;

    setSaving(true);
    setErr(null);

    const { error } = await supabase
      .from('needs')
      .update({
        title: need.title,
        city: need.city,
        category: need.category,
        description: need.description,
        contact_email: need.contact_email || null,
        contact_phone_e164: need.contact_phone_e164 || null,
      })
      .eq('id', need.id);

    setSaving(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.push(`/needs/${need.id}`);
  }

  async function onDelete() {
    if (!need) return;
    if (!confirm('Are you sure you want to delete this need?')) return;

    setDeleting(true);
    const { error } = await supabase.from('needs').delete().eq('id', need.id);
    setDeleting(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.push('/needs');
  }

  if (loading) return <main style={{ padding: 24 }}>Loading…</main>;
  if (!need) return <main style={{ padding: 24 }}>Need not found.</main>;

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>Edit need</h1>
      <p>
        <Link href={`/needs/${need.id}`}>← Back to need</Link>
      </p>

      {err && <p style={{ color: 'crimson' }}>{err}</p>}

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label><b>Title</b></label>
          <input
            value={need.title}
            onChange={(e) => setNeed({ ...need, title: e.target.value })}
            style={{ display: 'block', width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label><b>City</b></label>
          <input
            value={need.city ?? ''}
            onChange={(e) => setNeed({ ...need, city: e.target.value })}
            style={{ display: 'block', width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label><b>Category</b></label>
          <input
            value={need.category ?? ''}
            onChange={(e) => setNeed({ ...need, category: e.target.value })}
            style={{ display: 'block', width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label><b>Description</b></label>
          <textarea
            value={need.description ?? ''}
            onChange={(e) => setNeed({ ...need, description: e.target.value })}
            rows={4}
            style={{ display: 'block', width: '100%', padding: 8 }}
          />
        </div>

        <fieldset style={{ marginBottom: 16 }}>
          <legend><b>Contact Info (optional)</b></legend>
          <div style={{ marginBottom: 8 }}>
            <label>Contact email</label>
            <input
              type="email"
              value={need.contact_email ?? ''}
              onChange={(e) => setNeed({ ...need, contact_email: e.target.value })}
              style={{ display: 'block', width: '100%', padding: 8 }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label>Contact phone (E.164)</label>
            <input
              value={need.contact_phone_e164 ?? ''}
              onChange={(e) =>
                setNeed({ ...need, contact_phone_e164: e.target.value })
              }
              style={{ display: 'block', width: '100%', padding: 8 }}
              placeholder="+19195551234"
            />
          </div>
        </fieldset>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          style={{ marginLeft: 8 }}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </form>
    </main>
  );
}
