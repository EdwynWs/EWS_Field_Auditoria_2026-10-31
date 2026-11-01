import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
test("real panel and report capture with synthetic data", async ({
  page,
  request,
}) => {
  const out = process.env.DEMO_CAPTURE_DIR;
  test.skip(!out, "Opt-in screenshot generation.");
  await mkdir(out, { recursive: true });
  const email = `demo-${Date.now()}@example.test`,
    password = "Demonstracao-local-42!";
  let headers = {};
  async function post(path, data) {
    const r = await request.post("http://127.0.0.1:4000" + path, {
      headers,
      data,
    });
    expect(r.ok()).toBeTruthy();
    return r.json();
  }
  const mgr = await post("/auth/register", {
    company: "Empresa Demonstração",
    name: "Gestor Demo",
    email,
    password,
  });
  headers.Authorization = "Bearer " + mgr.token;
  const tech = await post("/users", {
    name: "Técnico Demo",
    email: "tec-" + email,
    password,
    role: "technician",
  });
  const customer = await post("/customers", {
    name: "Unidade Industrial",
    address: "Endereço demonstrativo",
  });
  const order = await post("/orders", {
    title: "Manutenção preventiva",
    description: "Dados sintéticos para demonstração.",
    customer_id: customer.id,
    technician_id: tech.id,
  });
  const session = await post("/auth/login", {
    email: "tec-" + email,
    password,
  });
  headers.Authorization = "Bearer " + session.token;
  const photo =
    "data:image/png;base64," +
    (
      await sharp({
        create: { width: 160, height: 120, channels: 3, background: "#246bff" },
      })
        .png()
        .toBuffer()
    ).toString("base64");
  await post(`/orders/${order.id}/visits`, {
    kind: "checkin",
    latitude: 0,
    longitude: 0,
    accuracy: 5,
    photo_data: photo,
  });
  await post(`/orders/${order.id}/reports`, {
    notes: "Relatório demonstrativo. Inspeção e checklist associados à ordem.",
    photos: [],
    checklist: [{ label: "Inspeção", done: true }],
  });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/painel");
  await page.getByLabel("E-mail corporativo").fill(email);
  await page.getByLabel(/^Senha/).fill(password);
  await page.getByRole("button", { name: "Acessar painel" }).click();
  await expect(
    page.getByRole("button", { name: "Nova ordem", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar aviso" }).click();
  await page.addStyleTag({ content: "nextjs-portal{display:none}" });
  await page.screenshot({ path: out + "/painel-gestao.png" });
  await page
    .getByRole("button", { name: "Ordens de serviço", exact: true })
    .click();
  await page.getByRole("button", { name: /Manutenção preventiva/ }).click();
  await expect(page.getByText(/Relatório demonstrativo/)).toBeVisible();
  await page.screenshot({ path: out + "/painel-relatorio.png" });
});
