import {test,expect} from '@playwright/test';
const email=`web-${Date.now()}@example.test`,password='Browser-testing-password42!';
test('signup → cookie login → customer → technician → order → logout',async({page,context})=>{
 await page.goto('/comecar',{waitUntil:'domcontentloaded'});
 await page.getByLabel('Nome da empresa').fill('Empresa E2E');await page.getByLabel('Nome do gestor').fill('Gestor E2E');await page.getByLabel('E-mail',{exact:true}).fill(email);
 await page.getByLabel(/^Senha/).fill(password);await page.getByLabel('Confirmar senha').fill(password);await page.getByRole('button',{name:'Criar conta de gestor'}).click();
 await expect(page.getByText('Conta criada com sucesso.')).toBeVisible();await page.getByRole('link',{name:/Acessar painel/}).click();
 await page.getByLabel('E-mail corporativo').fill(email);await page.getByLabel(/^Senha/).fill(password);await page.getByRole('button',{name:'Acessar painel'}).click();
 await expect(page.getByRole('button',{name:'Nova ordem',exact:true})).toBeVisible();
 const cookie=(await context.cookies()).find(c=>c.name==='ews_session');expect(cookie.httpOnly).toBe(true);expect(cookie.sameSite).toBe('Strict');
 expect(await page.evaluate(()=>sessionStorage.getItem('ews_field_panel_token'))).toBeNull();
 await page.getByRole('button',{name:'Clientes',exact:true}).click();await page.getByRole('button',{name:'Novo cliente'}).click();
 await page.getByLabel('Nome do cliente').fill('<script>alert(1)</script> Cliente E2E');await page.getByRole('button',{name:'Salvar',exact:true}).click();
 await expect(page.getByRole('cell',{name:'<script>alert(1)</script> Cliente E2E'})).toBeVisible();
 await page.getByRole('button',{name:'Equipe',exact:true}).click();await page.getByRole('button',{name:'Novo colaborador'}).click();
 await page.getByLabel(/^Nome/).fill('Técnico E2E');await page.getByLabel(/^E-mail/).fill('tech-'+email);await page.getByLabel('Senha inicial').fill(password);await page.getByRole('button',{name:'Salvar',exact:true}).click();
 await expect(page.getByRole('cell',{name:'Técnico E2E'})).toBeVisible();
 await page.getByRole('button',{name:'Ordens de serviço',exact:true}).click();await page.getByRole('button',{name:'Nova ordem',exact:true}).click();
 await page.getByLabel('Título da ordem').fill('Ordem E2E');await page.getByLabel(/^Cliente/).selectOption({label:'<script>alert(1)</script> Cliente E2E'});await page.getByLabel('Técnico responsável').selectOption({label:'Técnico E2E'});await page.getByRole('button',{name:'Salvar',exact:true}).click();
 await page.getByRole('button',{name:/Ordem E2E/}).click();await expect(page.getByRole('heading',{name:'Ordem E2E'})).toBeVisible();
 await page.reload();await expect(page.getByRole('button',{name:'Nova ordem',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Sair da conta'}).click();await expect(page.getByRole('button',{name:'Acessar painel'})).toBeVisible();
 const r=await page.request.get('/api/panel/me');expect(r.status()).toBe(401);
});
test('CSRF, bearer-only bypass and oversized BFF payload denied',async({request})=>{
 expect((await request.post('/api/panel/auth/login',{headers:{Origin:'https://evil.example'},data:{email,password}})).status()).toBe(403);
 expect((await request.get('/api/panel/me',{headers:{Authorization:'Bearer arbitrary'}})).status()).toBe(401);
 expect((await request.post('/api/signup',{headers:{Origin:'http://127.0.0.1:3000'},data:{name:'x'.repeat(20000)}})).status()).toBe(413);
 expect((await request.get('/api/panel/health')).status()).toBe(404);
});
test('commercial pages work on desktop and phone without horizontal overflow',async({page})=>{
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of ['/','/comecar','/privacidade','/painel']){
   await page.goto(route,{waitUntil:'domcontentloaded'});if(route==='/'&&process.env.VISUAL_QA_DIR)await page.screenshot({path:`${process.env.VISUAL_QA_DIR}/home-${width}.png`,fullPage:true});await expect(page.locator('main')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
 }
});
test('lead form submits to the real API',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByLabel('Seu nome').fill('Interessado E2E');await page.getByLabel('Empresa',{exact:true}).fill('Empresa Interessada');await page.getByLabel('E-mail corporativo').fill('lead-'+email);await page.getByLabel(/Autorizo a EWS Tech/).check();await page.getByRole('button',{name:'Solicitar demonstração',exact:true}).click();await expect(page.getByRole('status')).toContainText('Solicitação recebida');
});
