"use client";

const TOKEN_KEY = "wtb_client_token";
const NAME_KEY = "wtb_player_name";
const ID_KEY = "wtb_player_id";

export function getPlayerToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getPlayerName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(NAME_KEY);
}

export function getPlayerId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ID_KEY);
}

export function savePlayerSession(token: string, name: string, id: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(NAME_KEY, name);
  window.localStorage.setItem(ID_KEY, id);
}

export function clearPlayerSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(NAME_KEY);
  window.localStorage.removeItem(ID_KEY);
}
