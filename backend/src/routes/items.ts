import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/authenticate";

export const itemsRouter = Router();

itemsRouter.use(authenticate);

itemsRouter.get("/", async (req, res) => {
  const items = await prisma.item.findMany({
    where: { ownerId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

itemsRouter.post("/", async (req, res) => {
  const { name, type, quantity, description } = req.body;

  if (!name || !type || quantity === undefined) {
    res.status(400).json({ error: "name, type, and quantity are required" });
    return;
  }

  const item = await prisma.item.create({
    data: { name, type, quantity, description, ownerId: req.userId! },
  });
  res.status(201).json(item);
});

itemsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, type, quantity, description } = req.body;

  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== req.userId) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  const item = await prisma.item.update({
    where: { id },
    data: { name, type, quantity, description },
  });
  res.json(item);
});

itemsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== req.userId) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  await prisma.item.delete({ where: { id } });
  res.status(204).send();
});
