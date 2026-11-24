import { __raw, categories, groups, itemById, items, packs } from './index';

export interface ValidationIssue {
  where: string;
  problem: string;
}

const SHAPES = new Set(['circle', 'square', 'triangle', 'rectangle', 'star', 'heart', 'oval', 'diamond']);

/** Checks the content data for mistakes. Used by unit tests and in dev mode. */
export function validateContent(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const groupIds = new Set(groups.map((g) => g.id));
  const packIds = new Set(packs.map((p) => p.id));
  const catIds = new Set<string>();

  for (const c of categories) {
    if (catIds.has(c.id)) issues.push({ where: c.id, problem: 'duplicate category id' });
    catIds.add(c.id);
    if (!groupIds.has(c.group)) issues.push({ where: c.id, problem: `unknown group ${c.group}` });
    if (!packIds.has(c.pack)) issues.push({ where: c.id, problem: `unknown pack ${c.pack}` });
    if (!__raw.rawByCategory[c.id]?.length) issues.push({ where: c.id, problem: 'category has no items' });
  }
  for (const cid of Object.keys(__raw.rawByCategory)) {
    if (!catIds.has(cid)) issues.push({ where: cid, problem: 'items for unknown category' });
  }

  const seen = new Set<string>();
  for (const it of items) {
    if (seen.has(it.id)) issues.push({ where: it.id, problem: 'duplicate item id' });
    seen.add(it.id);
    if (!/^[a-z0-9-]+$/.test(it.localId)) issues.push({ where: it.id, problem: 'id must be lowercase a-z, 0-9, -' });
    if (!it.bengaliName.trim()) issues.push({ where: it.id, problem: 'missing Bengali name' });
    if (!it.englishName.trim()) issues.push({ where: it.id, problem: 'missing English name' });
    if (!it.descriptionBn.trim()) issues.push({ where: it.id, problem: 'missing Bengali description' });
    if (!it.emoji && !it.symbol && !it.image && !it.swatch && !it.shape)
      issues.push({ where: it.id, problem: 'no visual (emoji/symbol/image/swatch/shape)' });
    if (it.shape && !SHAPES.has(it.shape)) issues.push({ where: it.id, problem: `unknown shape ${it.shape}` });
    if (it.swatch && !/^#[0-9A-Fa-f]{6}$/.test(it.swatch)) issues.push({ where: it.id, problem: 'bad swatch colour' });
    for (const r of it.relatedItems) {
      if (!itemById.has(r)) issues.push({ where: it.id, problem: `related item ${r} not found` });
    }
  }
  return issues;
}
