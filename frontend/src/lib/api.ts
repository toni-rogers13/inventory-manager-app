import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL;

export type Item = {
  id: string;
  name: string;
  type: string;
  quantity: number;
  description: string | null;
  createdAt: string;
  ownerId: string;
};

export type NewItem = {
  name: string;
  type: string;
  quantity: number;
  description?: string;
};

async function authedFetch(path: string, options: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res;
}

export const api = {
  async getItems(): Promise<Item[]> {
    const res = await authedFetch("/items");
    return res.json();
  },

  async createItem(item: NewItem): Promise<Item> {
    const res = await authedFetch("/items", {
      method: "POST",
      body: JSON.stringify(item),
    });
    return res.json();
  },

  async deleteItem(id: string): Promise<void> {
    await authedFetch(`/items/${id}`, { method: "DELETE" });
  },
};
