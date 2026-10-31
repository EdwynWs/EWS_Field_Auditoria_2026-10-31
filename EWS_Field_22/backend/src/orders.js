import { Router } from "express";
import { createHash } from "node:crypto";
import { z } from "zod";
import { transaction } from "./db.js";
import {
  wrap,
  fail,
  parse,
  uuid,
  text,
  manager,
  audit,
  pagination,
  sendPage,
} from "./security.js";
import { normalizePhoto, mediaStore } from "./media.js";
const scope = (req, args) =>
  req.user.role === "technician"
    ? (args.push(req.user.id), ` AND o.technician_id=$${args.length}`)
    : "";
export function ordersRouter(db, config) {
  const r = Router();
  const storage = mediaStore(config.mediaDir);
  r.param("id", (req, res, next, id) => {
    try {
      parse(uuid, id);
      next();
    } catch (e) {
      next(e);
    }
  });
  async function order(c, req, lock = false) {
    const args = [req.params.id, req.user.companyId];
    const q = await c.query(
      "SELECT o.* FROM orders o WHERE o.id=$1 AND o.company_id=$2" +
        scope(req, args) +
        (lock ? " FOR UPDATE OF o" : ""),
      args,
    );
    if (!q.rowCount) throw fail(404, "Ordem não encontrada.");
    return q.rows[0];
  }
  function assigned(req, o) {
    if (req.user.role !== "technician" || o.technician_id !== req.user.id)
      throw fail(403, "Atendimento não atribuído a você.");
  }
  async function idempotent(c, req, action) {
    const key = req.headers["idempotency-key"];
    if (!key) return action();
    parse(uuid, key);
    const bodyHash = createHash("sha256")
      .update(JSON.stringify(req.body))
      .digest("hex");
    const route = req.originalUrl.split("?")[0];
    // Global per-user key lock also serializes accidental reuse across different orders.
    await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      `${req.user.companyId}:${req.user.id}:${key}`,
    ]);
    const args = [req.user.companyId, req.user.id, key];
    const prior = await c.query(
      "SELECT route,body_hash,response FROM idempotency_keys WHERE company_id=$1 AND user_id=$2 AND key=$3",
      args,
    );
    if (prior.rowCount) {
      if (prior.rows[0].route !== route || prior.rows[0].body_hash !== bodyHash)
        throw fail(409, "Chave de reenvio já usada para outra solicitação.");
      return prior.rows[0].response;
    }
    const result = await action();
    await c.query(
      "INSERT INTO idempotency_keys(company_id,user_id,key,route,body_hash,response) VALUES($1,$2,$3,$4,$5,$6)",
      [...args, route, bodyHash, JSON.stringify(result)],
    );
    return result;
  }
  r.get(
    "/",
    wrap(async (req, res) => {
      const page = pagination(req);
      const args = [req.user.companyId];
      const filter = scope(req, args);
      args.push(page.limit + 1, page.offset);
      const q = await db.query(
        `SELECT o.*,c.name AS customer_name,u.name AS technician_name FROM orders o JOIN customers c ON c.id=o.customer_id AND c.company_id=o.company_id LEFT JOIN users u ON u.id=o.technician_id AND u.company_id=o.company_id WHERE o.company_id=$1 ${filter} ORDER BY o.created_at DESC,o.id LIMIT $${args.length - 1} OFFSET $${args.length}`,
        args,
      );
      sendPage(res, q.rows, page);
    }),
  );
  r.post(
    "/",
    manager,
    wrap(async (req, res) => {
      const d = parse(
        z
          .object({
            customer_id: uuid,
            technician_id: uuid.nullable().optional(),
            title: text(150, 3),
            description: text(10000).optional(),
            scheduled_at: z
              .string()
              .datetime({ offset: true })
              .nullable()
              .optional(),
          })
          .strict(),
        req.body,
      );
      const result = await transaction(db, async (c) => {
        const customer = await c.query(
          "SELECT id FROM customers WHERE id=$1 AND company_id=$2 FOR SHARE",
          [d.customer_id, req.user.companyId],
        );
        if (!customer.rowCount) throw fail(400, "Cliente inválido.");
        if (d.technician_id) await validTechnician(c, req, d.technician_id);
        const q = await c.query(
          "INSERT INTO orders(company_id,customer_id,technician_id,title,description,scheduled_at,status) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
          [
            req.user.companyId,
            d.customer_id,
            d.technician_id || null,
            d.title,
            d.description || null,
            d.scheduled_at || null,
            d.technician_id ? "assigned" : "open",
          ],
        );
        await audit(c, req, "order.created", q.rows[0].id);
        return q.rows[0];
      });
      res.status(201).json(result);
    }),
  );
  async function validTechnician(c, req, id) {
    const q = await c.query(
      "SELECT id FROM users WHERE id=$1 AND company_id=$2 AND role='technician' AND active FOR SHARE",
      [id, req.user.companyId],
    );
    if (!q.rowCount) throw fail(400, "Técnico inválido.");
  }
  r.patch(
    "/:id/assignment",
    manager,
    wrap(async (req, res) => {
      const d = parse(
        z.object({ technician_id: uuid.nullable() }).strict(),
        req.body,
      );
      const result = await transaction(db, async (c) => {
        const o = await order(c, req, true);
        if (!["open", "assigned"].includes(o.status))
          throw fail(409, "Só é possível atribuir uma ordem antes do início.");
        if (d.technician_id) await validTechnician(c, req, d.technician_id);
        const q = await c.query(
          "UPDATE orders SET technician_id=$1,status=$2 WHERE id=$3 AND company_id=$4 RETURNING *",
          [
            d.technician_id,
            d.technician_id ? "assigned" : "open",
            o.id,
            req.user.companyId,
          ],
        );
        await audit(c, req, "order.assigned", o.id);
        return q.rows[0];
      });
      res.json(result);
    }),
  );
  r.patch(
    "/:id/status",
    wrap(async (req, res) => {
      const d = parse(
        z
          .object({
            reason: text(1000, 10).optional(),
            status: z.enum([
              "open",
              "assigned",
              "in_progress",
              "completed",
              "cancelled",
            ]),
          })
          .strict(),
        req.body,
      );
      const result = await transaction(db, async (c) => {
        const o = await order(c, req, true);
        if (req.user.role === "technician" && d.status !== "completed")
          throw fail(403, "Use o registro de chegada para iniciar.");
        if (o.status === d.status) return o;
        if (["completed", "cancelled"].includes(o.status))
          throw fail(409, "Ordem encerrada não pode ser reaberta.");
        if (d.status === "cancelled" && req.user.role === "manager") {
          const last = await c.query(
            "SELECT kind FROM visits WHERE order_id=$1 AND company_id=$2 ORDER BY created_at DESC,id DESC LIMIT 1",
            [o.id, req.user.companyId],
          );
          if (last.rows[0]?.kind === "checkin" && !d.reason)
            throw fail(
              409,
              "Informe o motivo do cancelamento administrativo com visita ativa.",
            );
        } else if (d.status === "completed") {
          const last = await c.query(
            "SELECT kind FROM visits WHERE order_id=$1 AND company_id=$2 ORDER BY created_at DESC,id DESC LIMIT 1",
            [o.id, req.user.companyId],
          );
          const reports = await c.query(
            "SELECT id FROM reports WHERE order_id=$1 AND company_id=$2 LIMIT 1",
            [o.id, req.user.companyId],
          );
          if (
            o.status !== "in_progress" ||
            last.rows[0]?.kind !== "checkout" ||
            !reports.rowCount
          )
            throw fail(
              409,
              "Para concluir: registre chegada, saída e relatório.",
            );
        } else
          throw fail(
            409,
            "Transição inválida. Utilize atribuição ou check-in.",
          );
        const q = await c.query(
          "UPDATE orders SET status=$1,cancellation_reason=$4 WHERE id=$2 AND company_id=$3 RETURNING *",
          [
            d.status,
            o.id,
            req.user.companyId,
            d.status === "cancelled" ? d.reason || null : null,
          ],
        );
        await audit(c, req, "order." + d.status, o.id);
        return q.rows[0];
      });
      res.json(result);
    }),
  );
  r.post(
    "/:id/visits",
    wrap(async (req, res) => {
      const d = parse(
        z
          .object({
            kind: z.enum(["checkin", "checkout"]),
            latitude: z.number().finite().min(-90).max(90),
            longitude: z.number().finite().min(-180).max(180),
            accuracy: z.number().finite().nonnegative().max(100).optional(),
            photo_data: z.string().max(2800000),
          })
          .strict(),
        req.body,
      );
      assigned(req, await order(db, req));
      const photo = await normalizePhoto(d.photo_data);
      const created = [];
      try {
        const result = await transaction(db, (c) =>
          idempotent(c, req, async () => {
            const o = await order(c, req, true);
            assigned(req, o);
            if (!["assigned", "in_progress"].includes(o.status))
              throw fail(409, "Ordem não aceita novos registros.");
            const last = await c.query(
              "SELECT kind FROM visits WHERE order_id=$1 AND company_id=$2 ORDER BY created_at DESC,id DESC LIMIT 1",
              [o.id, req.user.companyId],
            );
            if (
              (d.kind === "checkout" && last.rows[0]?.kind !== "checkin") ||
              (d.kind === "checkin" && last.rows[0]?.kind === "checkin")
            )
              throw fail(
                409,
                "Sequência de visita inválida ou registro duplicado.",
              );
            const mediaId = await storage.save(c, req, o.id, photo, created);
            const q = await c.query(
              "INSERT INTO visits(company_id,order_id,technician_id,kind,latitude,longitude,accuracy,photo_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,kind,latitude,longitude,accuracy,created_at,photo_id",
              [
                req.user.companyId,
                o.id,
                req.user.id,
                d.kind,
                d.latitude,
                d.longitude,
                d.accuracy ?? null,
                mediaId,
              ],
            );
            if (d.kind === "checkin")
              await c.query(
                "UPDATE orders SET status='in_progress' WHERE id=$1 AND company_id=$2",
                [o.id, req.user.companyId],
              );
            await audit(c, req, "visit." + d.kind, o.id);
            return q.rows[0];
          }),
        );
        res.status(201).json(result);
      } catch (e) {
        await storage.cleanup(created);
        throw e;
      }
    }),
  );
  r.get(
    "/:id/visits",
    wrap(async (req, res) => {
      await order(db, req);
      const p = pagination(req);
      const q = await db.query(
        "SELECT id,kind,latitude,longitude,accuracy,created_at,photo_id,(photo_id IS NOT NULL OR photo_data IS NOT NULL) AS has_photo FROM visits WHERE company_id=$1 AND order_id=$2 ORDER BY created_at DESC,id DESC LIMIT $3 OFFSET $4",
        [req.user.companyId, req.params.id, p.limit + 1, p.offset],
      );
      sendPage(res, q.rows, p);
    }),
  );
  r.post(
    "/:id/reports",
    wrap(async (req, res) => {
      const d = parse(
        z
          .object({
            notes: text(10000, 3),
            checklist: z
              .array(
                z.object({ label: text(200, 1), done: z.boolean() }).strict(),
              )
              .max(50)
              .default([]),
            photos: z.array(z.string().max(2800000)).max(5).default([]),
          })
          .strict(),
        req.body,
      );
      assigned(req, await order(db, req));
      const buffers = [];
      for (const p of d.photos) buffers.push(await normalizePhoto(p));
      const created = [];
      try {
        const result = await transaction(db, (c) =>
          idempotent(c, req, async () => {
            const o = await order(c, req, true);
            assigned(req, o);
            if (o.status !== "in_progress")
              throw fail(409, "Relatório exige uma ordem em andamento.");
            const q = await c.query(
              "INSERT INTO reports(company_id,order_id,technician_id,notes,checklist) VALUES($1,$2,$3,$4,$5) RETURNING id,order_id,notes,checklist,created_at",
              [
                req.user.companyId,
                o.id,
                req.user.id,
                d.notes,
                JSON.stringify(d.checklist),
              ],
            );
            for (const b of buffers) {
              const id = await storage.save(c, req, o.id, b, created);
              await c.query(
                "INSERT INTO report_media(company_id,order_id,report_id,media_id) VALUES($1,$2,$3,$4)",
                [req.user.companyId, o.id, q.rows[0].id, id],
              );
            }
            await audit(c, req, "report.created", o.id);
            return q.rows[0];
          }),
        );
        res.status(201).json(result);
      } catch (e) {
        await storage.cleanup(created);
        throw e;
      }
    }),
  );
  r.get(
    "/:id/reports",
    wrap(async (req, res) => {
      await order(db, req);
      const p = pagination(req);
      const q = await db.query(
        `SELECT r.id,r.notes,r.checklist,r.created_at,r.technician_id,jsonb_array_length(r.photos) AS legacy_photo_count,coalesce((SELECT jsonb_agg(rm.media_id) FROM report_media rm WHERE rm.report_id=r.id AND rm.company_id=r.company_id),'[]') AS media_ids FROM reports r WHERE r.company_id=$1 AND r.order_id=$2 ORDER BY r.created_at DESC,r.id DESC LIMIT $3 OFFSET $4`,
        [req.user.companyId, req.params.id, p.limit + 1, p.offset],
      );
      sendPage(res, q.rows, p);
    }),
  );
  const sendImage = (res, data) =>
    res
      .set({
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": 'inline; filename="evidence.jpg"',
      })
      .send(data);
  r.get(
    "/:id/media/:mediaId",
    wrap(async (req, res) => {
      await order(db, req);
      parse(uuid, req.params.mediaId);
      const q = await db.query(
        "SELECT object_key FROM media WHERE id=$1 AND order_id=$2 AND company_id=$3",
        [req.params.mediaId, req.params.id, req.user.companyId],
      );
      if (!q.rowCount) throw fail(404, "Foto não encontrada.");
      sendImage(res, await storage.read(q.rows[0].object_key));
    }),
  );
  r.get(
    "/:id/visits/:visitId/photo",
    wrap(async (req, res) => {
      await order(db, req);
      parse(uuid, req.params.visitId);
      const q = await db.query(
        "SELECT photo_data,photo_id FROM visits WHERE id=$1 AND order_id=$2 AND company_id=$3",
        [req.params.visitId, req.params.id, req.user.companyId],
      );
      if (!q.rows[0]?.photo_data && !q.rows[0]?.photo_id)
        throw fail(404, "Foto não encontrada.");
      sendImage(
        res,
        q.rows[0].photo_id
          ? await storage.read(q.rows[0].photo_id)
          : await normalizePhoto(q.rows[0].photo_data, { legacy: true }),
      );
    }),
  );
  r.get(
    "/:id/reports/:reportId/photos/:index",
    wrap(async (req, res) => {
      await order(db, req);
      parse(uuid, req.params.reportId);
      const index = parse(
        z.coerce.number().int().min(0).max(4),
        req.params.index,
      );
      const q = await db.query(
        "SELECT photos->$4 AS photo FROM reports WHERE id=$1 AND order_id=$2 AND company_id=$3",
        [req.params.reportId, req.params.id, req.user.companyId, index],
      );
      if (!q.rows[0]?.photo) throw fail(404, "Foto não encontrada.");
      sendImage(res, await normalizePhoto(q.rows[0].photo, { legacy: true }));
    }),
  );
  return r;
}
