/* =====================================================================
   GET /api/stats — the shared member list + count, read from Netlify
   Blobs. Public pages use it for the Active-members number; the member
   panel uses it to see every registration.
   ===================================================================== */

import { getStore } from "@netlify/blobs";

function reply(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

export default async (req) => {
  let members = [];
  try {
    const store = getStore("avyakt");
    members = (await store.get("members", { type: "json" })) || [];
  } catch (e) { members = []; }
  if (!Array.isArray(members)) members = [];
  return reply(200, { ok: true, backend: "netlify-blobs", configured: true, activeMembers: members.length, members: members });
};
