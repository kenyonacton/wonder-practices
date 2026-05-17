// Category-index filter — scaffold stub.
// Public surface (planned):
//   filterPractices(practices, hiddenFlags) -> practices[]
//   loadPreferences() / savePreferences() use localStorage under the "wp:flags-hidden" key.
export function filterPractices(practices, hiddenFlags) {
  if (!Array.isArray(practices)) return [];
  const hidden = new Set(hiddenFlags || []);
  return practices.filter((p) => !hidden.has(p.accessibility_flag));
}
