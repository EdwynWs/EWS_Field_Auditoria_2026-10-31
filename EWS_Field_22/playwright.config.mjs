import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/e2e',timeout:60000,workers:1,fullyParallel:false,use:{baseURL:'http://127.0.0.1:3000',headless:true,launchOptions:process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']}:undefined,trace:'off',screenshot:'off'},webServer:[
 {command:'node scripts/test-server.mjs',url:'http://127.0.0.1:4000/ready',reuseExistingServer:false,timeout:60000},
 {command:'npm run dev --workspace=web -- --hostname 127.0.0.1',url:'http://127.0.0.1:3000',reuseExistingServer:false,timeout:90000,env:{API_INTERNAL_URL:'http://127.0.0.1:4000',WEB_PUBLIC_ORIGIN:'http://127.0.0.1:3000',NEXT_TELEMETRY_DISABLED:'1'}}
]});
