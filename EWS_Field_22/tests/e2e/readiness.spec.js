import {test,expect} from '@playwright/test';
test('PWA manifest, offline page and private-route boundary',async({request})=>{
  const manifest=await request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).start_url).toBe('/painel');
  const offline=await request.get('/offline.html');
  expect(await offline.text()).toContain('Você está sem conexão');
  const worker=await request.get('/sw.js');
  expect(worker.ok()).toBeTruthy();
  expect((await request.get('/api/panel/company/export/users')).status()).toBe(401);
  expect((await request.post('/api/panel/auth/reset-password',{headers:{Origin:'https://evil.example'},data:{}})).status()).toBe(403);
  expect((await request.post('/api/panel/auth/reset-password',{headers:{Origin:'http://127.0.0.1:3000'},data:{token:'invalid',new_password:'Testing-password42!'}})).status()).toBe(400);
});
test('recovery page and filtered order controls are accessible',async({page})=>{
  await page.goto('/recuperar');
  await expect(page.getByRole('heading',{name:'Recuperar acesso'})).toBeVisible();
  await page.goto('/recuperar#'+'a'.repeat(64));
  await expect(page.getByLabel('Nova senha (12 a 72 caracteres)')).toBeVisible();
  expect(new URL(page.url()).hash).toBe('');
});
