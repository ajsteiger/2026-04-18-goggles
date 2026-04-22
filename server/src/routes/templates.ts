import { Router } from "express";
import { templates } from "../storage.js";

export const templatesRouter = Router();

templatesRouter.get("/", async (_req, res) => {
  res.json(await templates.list());
});

templatesRouter.get("/:id", async (req, res) => {
  const t = await templates.get(req.params.id);
  if (!t) return res.status(404).json({ error: "not found" });
  res.json(t);
});

templatesRouter.put("/:id", async (req, res) => {
  const { content = "", description = "", notes = "", paramDescs = {}, tags = [] } = req.body ?? {};
  const t = await templates.put(req.params.id, content, description, notes, paramDescs, tags);
  res.json(t);
});

templatesRouter.post("/:id/fork", async (req, res) => {
  const { id } = req.body ?? {};
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    const t = await templates.fork(req.params.id, id);
    res.json(t);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
