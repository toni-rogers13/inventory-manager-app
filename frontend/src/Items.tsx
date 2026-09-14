import { useEffect, useState } from "react";
import { api, type Item, type ItemInput } from "./lib/api";
import { uploadItemPhoto } from "./lib/storage";
import { supabase } from "./lib/supabase";

const emptyForm = {
  name: "",
  type: "",
  quantity: "",
  description: "",
  location: "",
  lowStockThreshold: "",
};

export function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      setItems(await api.getItems());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      type: item.type,
      quantity: String(item.quantity),
      description: item.description ?? "",
      location: item.location ?? "",
      lowStockThreshold: item.lowStockThreshold != null ? String(item.lowStockThreshold) : "",
    });
    setPhotoFile(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let photoUrl: string | undefined;

      if (photoFile) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("Not logged in");
        photoUrl = await uploadItemPhoto(photoFile, session.user.id);
      }

      const payload: ItemInput = {
        name: form.name,
        type: form.type,
        quantity: Number(form.quantity),
        description: form.description || undefined,
        location: form.location || undefined,
        lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : undefined,
        ...(photoUrl ? { photoUrl } : {}),
      };

      if (editingId) {
        await api.updateItem(editingId, payload);
      } else {
        await api.createItem(payload);
      }

      cancelEdit();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteItem(id);
      if (editingId === id) cancelEdit();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  }

  return (
    <div className="inventory">
      <h2>Inventory</h2>

      <form className="item-form" onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="Type"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          required
        />
        <input
          placeholder="Location (optional)"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <input
          type="number"
          placeholder="Low stock threshold (optional)"
          value={form.lowStockThreshold}
          onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
        />
        <input
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
        />
        <div className="item-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save Changes" : "Add Item"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        <ul className="item-list">
          {items.map((item) => {
            const lowStock =
              item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold;
            return (
              <li key={item.id} className="item-card">
                {item.photoUrl && (
                  <img src={item.photoUrl} alt={item.name} className="item-photo" />
                )}
                <div className="item-details">
                  <strong>{item.name}</strong> — {item.type} — qty {item.quantity}
                  {lowStock && <span className="low-stock-badge">Low stock</span>}
                  {item.location && <div>Location: {item.location}</div>}
                  {item.description && <div>{item.description}</div>}
                </div>
                <div className="item-actions">
                  <button onClick={() => startEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
