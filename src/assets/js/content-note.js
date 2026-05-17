// Content-note pre-load gate — scaffold stub.
// Public surface (planned):
//   gateContentNote({ flag, slug, root }) shows the note, accepts a continue action,
//   and remembers per-session dismissal in sessionStorage under "wp:content-note:<slug>".
export function shouldShowContentNote(flag, dismissed) {
  if (flag !== "body-intense" && flag !== "tender") return false;
  return !dismissed;
}
