import { Router } from "express";
import { manager, wrap, pagination, sendPage, audit } from "./security.js";
// Explicit columns: credentials, sessions, reset tokens and internal storage keys never leave the API.
const resources = {
  users: "id,name,email,role,active,created_at",
  customers: "id,name,phone,address,created_at",
  orders:
    "id,customer_id,technician_id,title,description,status,scheduled_at,created_at,cancellation_reason",
  visits:
    "id,order_id,technician_id,kind,latitude,longitude,accuracy,photo_id,created_at",
  reports: "id,order_id,technician_id,notes,checklist,created_at",
  media: "id,order_id,mime_type,size_bytes,created_at",
  report_media: "report_id,media_id,order_id",
};
export function exportRouter(db) {
  const router = Router();
  router.use(manager);
  for (const [table, columns] of Object.entries(resources)) {
    router.get(
      "/" + table,
      wrap(async (req, res) => {
        const page = pagination(req);
        const order = table === "report_media" ? "report_id,media_id" : "id";
        const q = await db.query(
          `SELECT ${columns} FROM ${table} WHERE company_id=$1 ORDER BY ${order} LIMIT $2 OFFSET $3`,
          [req.user.companyId, page.limit + 1, page.offset],
        );
        await audit(db, req, "company.export." + table);
        sendPage(res, q.rows, page);
      }),
    );
  }
  return router;
}
