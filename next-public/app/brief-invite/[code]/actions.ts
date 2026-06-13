'use server'

export async function submitBriefInvite(
  code: string,
  companyName: string,
  fields: Record<string, string>
): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/create-project-from-brief`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ short_code: code, companyName, fields }),
      }
    )
    const json = await res.json()
    return { ok: json.ok === true }
  } catch {
    return { ok: false }
  }
}
