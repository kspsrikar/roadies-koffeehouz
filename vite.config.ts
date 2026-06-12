import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Manually load .env variables into process.env for the dev server
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx !== -1) {
        const key = trimmed.substring(0, equalsIdx).trim();
        const value = trimmed.substring(equalsIdx + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Custom local DB sync middleware for multi-device sync
function dbSyncPlugin() {
  const dbPath = path.resolve(__dirname, 'db.json');

  // Helper to read DB
  const readDB = () => {
    try {
      if (fs.existsSync(dbPath)) {
        return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      }
    } catch (e) {
      console.error("Error reading db.json", e);
    }
    return { orders: [], alerts: [], menu: [] };
  };

  // Helper to write DB
  const writeDB = (data: any) => {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Error writing db.json", e);
    }
  };

  return {
    name: 'db-sync-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/api/sms' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              console.log('\n================================================================');
              console.log(`📱 [SMS SYSTEM SENT] To: ${data.to}`);
              console.log(`💬 Message: "${data.body}"`);
              console.log('================================================================\n');

              // If CallMeBot API key is configured in env, send a free WhatsApp message
              const whatsappKey = process.env.CALLMEBOT_API_KEY;
              if (whatsappKey) {
                // CallMeBot requires international format without '+' (India code is 91)
                const formattedPhone = data.to.startsWith('91') ? data.to : `91${data.to}`;
                const whatsappUrl = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodeURIComponent(data.body)}&apikey=${whatsappKey}`;
                fetch(whatsappUrl)
                  .then((waRes) => {
                    if (waRes.ok) {
                      console.log('🚀 [CallMeBot Success] Free WhatsApp alert successfully sent to owner!');
                    } else {
                      console.warn('❌ [CallMeBot Failed] CallMeBot API returned an error.');
                    }
                  })
                  .catch(err => console.error('❌ [CallMeBot Error]', err));
              }

              // If Fast2SMS API key is configured in env, make a real network request
              const apiKey = process.env.FAST2SMS_API_KEY;
              if (apiKey) {
                const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=q&message=${encodeURIComponent(data.body)}&flash=0&numbers=${data.to}`;
                fetch(fast2smsUrl)
                  .then(async (fastRes) => {
                    const resJson = await fastRes.json() as any;
                    if (resJson.return) {
                      console.log('🚀 [Fast2SMS Success] Real SMS dispatched successfully to Indian mobile carrier!');
                    } else {
                      console.warn('❌ [Fast2SMS Failed]', resJson.message);
                    }
                  })
                  .catch(err => console.error('❌ [Fast2SMS Network Error]', err));
              } else if (!whatsappKey) {
                console.log('ℹ️ [SMS/WhatsApp Notice] Configure CALLMEBOT_API_KEY or FAST2SMS_API_KEY in .env for real notifications.');
              }

              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid body' }));
            }
          });
          return;
        }

        if (req.url === '/api/db') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Access-Control-Allow-Methods', '*');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          if (req.method === 'GET') {
            const db = readDB();
            res.statusCode = 200;
            res.end(JSON.stringify(db));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                writeDB(data);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), dbSyncPlugin()],
})
