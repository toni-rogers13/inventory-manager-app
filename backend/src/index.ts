import "dotenv/config";
import express from "express";
import cors from "cors";
import { itemsRouter } from "./routes/items";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/items", itemsRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
