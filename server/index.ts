import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { db } from './db.js';

const app = express();
app.use(express.json());

// Serve built frontend in production (dist/ created by `npm run build`)
app.use(express.static('dist'));

// CORS — allow browser clients on any origin during development
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});
app.options('*', (_req, res) => res.sendStatus(200));

// GET /api/ranking?limit=10
app.get('/api/ranking', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const rows = db.prepare(
    'SELECT name, time, created_at FROM rankings ORDER BY time ASC LIMIT ?',
  ).all(limit) as { name: string; time: number; created_at: string }[];
  res.json({
    rankings: rows.map((r, i) => ({
      rank: i + 1,
      name: r.name,
      time: r.time,
      date: r.created_at,
    })),
  });
});

// POST /api/ranking  { name, time }
app.post('/api/ranking', (req, res) => {
  const { name, time } = req.body as { name?: unknown; time?: unknown };
  if (typeof name !== 'string' || typeof time !== 'number' || time <= 0 || time > 86400) {
    res.status(400).json({ error: 'Dados inválidos' });
    return;
  }
  const cleanName = name.trim().slice(0, 30);
  const cleanTime = Math.round(time * 100) / 100;
  db.prepare('INSERT INTO rankings (name, time) VALUES (?, ?)').run(cleanName, cleanTime);
  const { cnt } = db.prepare(
    'SELECT COUNT(*) as cnt FROM rankings WHERE time <= ?',
  ).get(cleanTime) as { cnt: number };
  res.json({ rank: cnt });
});

// ── WebSocket — real-time multiplayer rooms ───────────────────────────────

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

interface Player { ws: WebSocket; name: string; id: number; }
interface Room   { code: string; players: Player[]; started: boolean; }

const rooms = new Map<string, Room>();

function genCode(): string {
  return Math.random().toString(36).toUpperCase().slice(2, 8);
}

function broadcast(room: Room, data: object, exclude?: WebSocket): void {
  const msg = JSON.stringify(data);
  for (const p of room.players) {
    if (p.ws !== exclude && p.ws.readyState === WebSocket.OPEN) p.ws.send(msg);
  }
}

wss.on('connection', (ws: WebSocket) => {
  let room: Room | null = null;
  let player: Player | null = null;

  ws.on('message', (raw) => {
    let msg: Record<string, unknown>;
    try { msg = JSON.parse(raw.toString()) as Record<string, unknown>; }
    catch { return; }

    switch (msg.type) {
      case 'create': {
        const code = genCode();
        player = { ws, name: String(msg.name ?? 'Piloto').slice(0, 30), id: 0 };
        room = { code, players: [player], started: false };
        rooms.set(code, room);
        ws.send(JSON.stringify({ type: 'created', code, playerId: 0 }));
        break;
      }
      case 'join': {
        const code = String(msg.code ?? '').toUpperCase();
        const found = rooms.get(code);
        if (!found)          { ws.send(JSON.stringify({ type: 'error', message: 'Sala não encontrada' })); break; }
        if (found.started)   { ws.send(JSON.stringify({ type: 'error', message: 'Corrida já iniciada' })); break; }
        if (found.players.length >= 4) { ws.send(JSON.stringify({ type: 'error', message: 'Sala cheia (máx 4)' })); break; }
        const id = found.players.length;
        player = { ws, name: String(msg.name ?? 'Piloto').slice(0, 30), id };
        found.players.push(player);
        room = found;
        ws.send(JSON.stringify({ type: 'joined', playerId: id, names: found.players.map(p => p.name) }));
        broadcast(found, { type: 'playerJoined', name: player.name, id }, ws);
        break;
      }
      case 'start': {
        if (!room || !player || player.id !== 0) break; // only host
        room.started = true;
        // Send to all including host
        broadcast(room, { type: 'start' });
        ws.send(JSON.stringify({ type: 'start' }));
        break;
      }
      case 'state': {
        if (!room || !player) break;
        broadcast(room, {
          type: 'state',
          id: player.id,
          x: msg.x, y: msg.y,
          angle: msg.angle,
          speed: msg.speed,
          lapCount: msg.lapCount,
          waypointIndex: msg.waypointIndex,
        }, ws);
        break;
      }
      case 'finished': {
        if (!room || !player) break;
        broadcast(room, { type: 'playerFinished', id: player.id, time: msg.time });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!room || !player) return;
    room.players = room.players.filter(p => p !== player);
    broadcast(room, { type: 'playerLeft', id: player.id });
    if (room.players.length === 0) rooms.delete(room.code);
  });

  ws.on('error', () => { /* ignore per-socket errors */ });
});

const PORT = Number(process.env.PORT ?? 3001);
httpServer.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
