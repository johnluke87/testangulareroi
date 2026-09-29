// Server locale che imita l'API REST di Firebase Realtime Database.
// Serve per provare la pagina /corsi-firebase senza un progetto Firebase.
// Avvio: npm run firebase-finto   (oppure: node firebase-finto.mjs)
// I dati vengono salvati in firebase-finto.json, accanto a questo file.
import { createServer } from 'node:http';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const PORTA = 9123;
const FILE = new URL('./firebase-finto.json', import.meta.url);

let db = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {};
const salva = () => writeFileSync(FILE, JSON.stringify(db, null, 2));

// Id in stile Firebase: iniziano con "-" e crescono nel tempo, quindi l'ordine è quello di creazione.
const nuovoId = () => '-' + Date.now().toString(36).padStart(9, '0') + randomBytes(5).toString('hex');

function leggi(percorso) {
  return percorso.reduce((nodo, chiave) => (nodo == null ? null : (nodo[chiave] ?? null)), db);
}

function scrivi(percorso, valore) {
  if (percorso.length === 0) {
    db = valore ?? {};
    return;
  }
  let nodo = db;
  for (const chiave of percorso.slice(0, -1)) {
    if (typeof nodo[chiave] !== 'object' || nodo[chiave] === null) nodo[chiave] = {};
    nodo = nodo[chiave];
  }
  const ultima = percorso.at(-1);
  if (valore === null) delete nodo[ultima];
  else nodo[ultima] = valore;
}

function rispondi(res, stato, corpo) {
  res.writeHead(stato, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(corpo));
}

createServer((req, res) => {
  // CORS: permette le chiamate da http://localhost:4200
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const { pathname } = new URL(req.url, `http://localhost:${PORTA}`);
  if (!pathname.endsWith('.json')) {
    return rispondi(res, 404, { error: 'Il percorso deve finire con .json, come su Firebase' });
  }
  const percorso = decodeURIComponent(pathname.slice(1, -5)).split('/').filter(Boolean);

  let testo = '';
  req.on('data', (pezzo) => (testo += pezzo));
  req.on('end', () => {
    let corpo = null;
    try {
      corpo = testo ? JSON.parse(testo) : null;
    } catch {
      return rispondi(res, 400, { error: 'Invalid data; couldn\'t parse JSON object.' });
    }

    switch (req.method) {
      case 'GET':
        return rispondi(res, 200, leggi(percorso));
      case 'POST': {
        const id = nuovoId();
        scrivi([...percorso, id], corpo);
        salva();
        return rispondi(res, 200, { name: id });
      }
      case 'PUT':
        scrivi(percorso, corpo);
        salva();
        return rispondi(res, 200, corpo);
      case 'PATCH':
        scrivi(percorso, { ...(leggi(percorso) ?? {}), ...corpo });
        salva();
        return rispondi(res, 200, corpo);
      case 'DELETE':
        scrivi(percorso, null);
        salva();
        return rispondi(res, 200, null);
      default:
        return rispondi(res, 405, { error: 'Metodo non supportato' });
    }
  });
}).listen(PORTA, () => {
  console.log(`Firebase finto in ascolto su http://localhost:${PORTA}  (dati in firebase-finto.json)`);
});
