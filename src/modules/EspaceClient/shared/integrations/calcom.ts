/**
 * Cal.com booking — placeholder.
 *
 * PHASE 3: replace with a real Cal.com event-type URL lookup.
 * Returns null in Phase 2 so the UI can fall back to a "We'll contact you"
 * message instead of opening a broken booking page.
 */
export async function getBookingUrl(eventType: string): Promise<string | null> {
  console.log(`[PLACEHOLDER-CALCOM] Would return booking URL for: ${eventType}`);
  return null;
}
