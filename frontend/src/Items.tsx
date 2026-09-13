import { useEffect, useState } from "react";
import { api, type Item } from "./lib/api";

export function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createItem({
        name,
        type,
        quantity: Number(quantity),
        description: description || undefined,
      });
      setName("");
      setType("");
      setQuantity("");
      setDescription("");
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteItem(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  }

  return (
    <div>
      <h2>Inventory</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Add Item</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              {item.name} — {item.type} — qty {item.quantity}
              {item.description ? ` — ${item.description}` : ""}
              <button onClick={() => handleDelete(item.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
