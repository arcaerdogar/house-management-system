import type { Request, Response } from "express";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from "./templates.service.js";

export async function createTemplateHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };
  const body = (req as { body: Parameters<typeof createTemplate>[2] }).body;

  const template = await createTemplate(houseId, userId, body);
  res.status(201).json(template);
}

export async function listTemplatesHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId } = req.params as { houseId: string };

  const templates = await listTemplates(houseId, userId);
  res.json(templates);
}

export async function patchTemplateHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId, templateId } = req.params as {
    houseId: string;
    templateId: string;
  };
  const body = (req as { body: Parameters<typeof updateTemplate>[3] }).body;

  const template = await updateTemplate(houseId, templateId, userId, body);
  res.json(template);
}

export async function deleteTemplateHandler(req: Request, res: Response) {
  const userId = (req as any).user.id as string;
  const { houseId, templateId } = req.params as {
    houseId: string;
    templateId: string;
  };

  await deleteTemplate(houseId, templateId, userId);
  res.status(204).send();
}
