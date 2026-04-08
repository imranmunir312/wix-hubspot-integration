// src/api/backend.ts

const BASE_URL = "http://localhost:4000";

export async function getHubspotStatus() {
  const res = await fetch(`${BASE_URL}/api/oauth/hubspot/status`);
  return res.json();
}

export function startHubspotOAuth() {
  window.location.href = `${BASE_URL}/api/oauth/hubspot/start`;
}

export async function disconnectHubspot() {
  await fetch(`${BASE_URL}/api/oauth/hubspot/disconnect`, {
    method: "POST",
  });
}
