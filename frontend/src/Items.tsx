import { useEffect, useMemo, useState } from "react";
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

type SortKey = "name" | "type" | "quantity" | "location" | "createdAt";

const columns: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "quantity", label: "Quantity" },
  { key: "location", label: "Location" },
  { key: "createdAt", label: "Added" },
];

export function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (!previewPhoto) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewPhoto(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewPhoto]);

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

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? items.filter((item) =>
          [item.name, item.type, item.location, item.description]
            .filter(Boolean)
            .some((field) => field!.toLowerCase().includes(query)),
        )
      : items;

    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [items, search, sortKey, sortDir]);

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

      <input
        className="search-input"
        placeholder="Search by name, type, location, description..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No items yet.</p>
      ) : visibleItems.length === 0 ? (
        <p>No items match "{search}".</p>
      ) : (
        <div className="table-wrapper">
          <table className="item-table">
            <thead>
              <tr>
                <th></th>
                {columns.map((col) => (
                  <th key={col.key} onClick={() => handleSort(col.key)} className="sortable">
                    {col.label}
                    {sortKey === col.key && (sortDir === "asc" ? " ▲" : " ▼")}
                  </th>
                ))}
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => {
                const lowStock =
                  item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold;
                return (
                  <tr key={item.id}>
                    <td>
                      {item.photoUrl && (
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="item-photo"
                          role="button"
                          tabIndex={0}
                          onClick={() => setPreviewPhoto({ url: item.photoUrl!, alt: item.name })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setPreviewPhoto({ url: item.photoUrl!, alt: item.name });
                            }
                          }}
                        />
                      )}
                    </td>
                    <td>{item.name}</td>
                    <td>{item.type}</td>
                    <td>
                      {item.quantity}
                      {lowStock && <span className="low-stock-badge">Low stock</span>}
                    </td>
                    <td>{item.location}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>{item.description}</td>
                    <td className="item-actions">
                      <button onClick={() => startEdit(item)}>Edit</button>
                      <button onClick={() => handleDelete(item.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {previewPhoto && (
        <div className="photo-modal-overlay" onClick={() => setPreviewPhoto(null)}>
          <img src={previewPhoto.url} alt={previewPhoto.alt} className="photo-modal-img" />
        </div>
      )}
    </div>
  );
}
