import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_RED_URL = process.env.NODE_RED_URL || 'http://localhost:1880';

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- PostgreSQL ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ugb_banking',
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        balance NUMERIC(15,2) NOT NULL DEFAULT 0,
        currency VARCHAR(3) NOT NULL DEFAULT 'UAH',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(40) PRIMARY KEY,
        from_account VARCHAR(20) NOT NULL REFERENCES accounts(id),
        to_account VARCHAR(20) NOT NULL REFERENCES accounts(id),
        amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
        currency VARCHAR(3) NOT NULL DEFAULT 'UAH',
        status VARCHAR(20) NOT NULL DEFAULT 'success',
        processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_processed_at ON transactions(processed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_account);
      CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_account);
    `);

    // Seed demo accounts if empty
    const { rows } = await client.query('SELECT COUNT(*)::int as cnt FROM accounts');
    if (rows[0].cnt === 0) {
      await client.query(`
        INSERT INTO accounts (id, name, balance, currency) VALUES
          ('UA001', 'Основний рахунок', 100000.00, 'UAH'),
          ('UA002', 'Зарплатний рахунок', 50000.00, 'UAH'),
          ('UA003', 'Депозитний рахунок', 250000.00, 'UAH'),
          ('UA004', 'Корпоративний рахунок', 500000.00, 'UAH');
      `);
    }

    await client.query('COMMIT');
    console.log('Database initialized');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function generateId(): string {
  return 'txn_' + crypto.randomBytes(12).toString('hex');
}

// Fire-and-forget event to Node-RED
function emitToNodeRed(event: string, data: Record<string, unknown>) {
  fetch(`${NODE_RED_URL}/webhook/${event}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...data }),
  }).catch(() => {
    // Node-RED is optional — don't break the main flow
  });
}

// --- Routes ---

// Health check
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Create transfer (SERIALIZABLE isolation + retry on serialization failure)
const MAX_RETRIES = 3;

app.post('/transfer', async (req, res) => {
  const { fromAccount, toAccount, amount, currency = 'UAH' } = req.body;
  const errors: string[] = [];

  if (!fromAccount) errors.push("Рахунок відправника обов'язковий");
  if (!toAccount) errors.push("Рахунок отримувача обов'язковий");
  if (!amount || amount <= 0) errors.push('Сума повинна бути більше 0');
  if (fromAccount === toAccount) errors.push('Рахунки відправника та отримувача повинні відрізнятися');

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: 'Помилка валідації', errors });
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      // Read sender balance (FOR UPDATE locks the row)
      const senderResult = await client.query(
        'SELECT id, balance FROM accounts WHERE id = $1 FOR UPDATE',
        [fromAccount]
      );
      if (senderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ status: 'error', message: 'Помилка', errors: [`Рахунок ${fromAccount} не знайдено`] });
      }

      const senderBalance = parseFloat(senderResult.rows[0].balance);
      if (senderBalance < amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ status: 'error', message: 'Помилка', errors: ['Недостатньо коштів на рахунку'] });
      }

      // Lock receiver row
      const receiverResult = await client.query(
        'SELECT id FROM accounts WHERE id = $1 FOR UPDATE',
        [toAccount]
      );
      if (receiverResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ status: 'error', message: 'Помилка', errors: [`Рахунок ${toAccount} не знайдено`] });
      }

      const txId = generateId();
      const now = new Date().toISOString();

      // Debit sender
      await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromAccount]);

      // Credit receiver
      await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toAccount]);

      // Record transaction
      await client.query(
        'INSERT INTO transactions (id, from_account, to_account, amount, currency, status, processed_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [txId, fromAccount, toAccount, amount, currency, 'success', now]
      );

      await client.query('COMMIT');

      const result = {
        status: 'success' as const,
        transactionId: txId,
        from: fromAccount,
        to: toAccount,
        amount,
        currency,
        processedAt: now,
      };

      // Emit events to Node-RED (non-blocking)
      emitToNodeRed('transfer-completed', { transaction: result });

      if (amount >= 50000) {
        emitToNodeRed('large-transfer-alert', {
          transaction: result,
          alert: `Великий переказ: ${amount} ${currency} з ${fromAccount} на ${toAccount}`,
        });
      }

      return res.json(result);
    } catch (err) {
      await client.query('ROLLBACK');

      // PostgreSQL serialization failure (code 40001) — retry
      const pgErr = err as { code?: string };
      if (pgErr.code === '40001' && attempt < MAX_RETRIES) {
        console.warn(`[Transfer] Serialization conflict, retry ${attempt}/${MAX_RETRIES}`);
        continue;
      }

      console.error('Transfer error:', err);
      return res.status(500).json({ status: 'error', message: 'Помилка сервера', errors: ['Внутрішня помилка'] });
    } finally {
      client.release();
    }
  }
});

// Get transactions
app.get('/transactions', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, from_account, to_account, amount, currency, status, processed_at FROM transactions ORDER BY processed_at DESC LIMIT 50'
    );

    const mapped = rows.map((tx) => ({
      status: 'success',
      transactionId: tx.id,
      from: tx.from_account,
      to: tx.to_account,
      amount: parseFloat(tx.amount),
      currency: tx.currency,
      processedAt: tx.processed_at,
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Fetch transactions error:', err);
    res.json([]);
  }
});

// Report
app.get('/report', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int AS total_transactions,
        COALESCE(SUM(amount), 0)::float AS total_volume
      FROM transactions
    `);

    res.json({
      reportType: 'summary',
      generatedAt: new Date().toISOString(),
      totalTransactions: rows[0].total_transactions,
      totalVolume: rows[0].total_volume,
      currency: 'UAH',
    });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json(null);
  }
});

// Accounts
app.get('/accounts', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM accounts ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error('Accounts error:', err);
    res.json([]);
  }
});

// --- NBU Exchange Rates (received from Node-RED) ---
interface RateCache {
  rates: { cc: string; rate: number; txt: string }[];
  fetchedAt: string;
  source: string;
}
let ratesCache: RateCache | null = null;

// Node-RED pushes rates here
app.post('/webhook/nbu-rates', (req, res) => {
  const { USD, EUR, GBP, PLN, CHF, date } = req.body;
  const rates: { cc: string; rate: number; txt: string }[] = [];

  if (USD) rates.push({ cc: 'USD', rate: USD.rate, txt: USD.txt || 'Долар США' });
  if (EUR) rates.push({ cc: 'EUR', rate: EUR.rate, txt: EUR.txt || 'Євро' });
  if (GBP) rates.push({ cc: 'GBP', rate: GBP.rate, txt: GBP.txt || 'Фунт стерлінгів' });
  if (PLN) rates.push({ cc: 'PLN', rate: PLN.rate, txt: PLN.txt || 'Злотий' });
  if (CHF) rates.push({ cc: 'CHF', rate: CHF.rate, txt: CHF.txt || 'Швейцарський франк' });

  ratesCache = { rates, fetchedAt: date || new Date().toISOString(), source: 'node-red' };
  console.log(`[Rates] Received ${rates.length} rates from Node-RED`);
  res.json({ received: true, count: rates.length });
});

// Frontend reads cached rates
app.get('/rates', (_req, res) => {
  if (ratesCache) {
    return res.json(ratesCache);
  }
  res.status(503).json({ error: 'Курси ще не отримані від Node-RED' });
});

// --- Node-RED Events Log ---
interface NodeRedEvent {
  id: string;
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}
const events: NodeRedEvent[] = [];
const MAX_EVENTS = 50;

// Webhook receiver — Node-RED sends events here
app.post('/webhook/node-red/:event', (req, res) => {
  const evt: NodeRedEvent = {
    id: crypto.randomBytes(8).toString('hex'),
    event: req.params.event,
    timestamp: new Date().toISOString(),
    data: req.body,
  };
  events.unshift(evt);
  if (events.length > MAX_EVENTS) events.pop();
  console.log(`[Node-RED] ${evt.event}`, JSON.stringify(evt.data).slice(0, 120));
  res.json({ received: true });
});

// Frontend reads events
app.get('/events', (_req, res) => {
  res.json(events);
});

// Node-RED status check
app.get('/node-red/status', async (_req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${NODE_RED_URL}/flows`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const flows = await response.json() as { type?: string; label?: string }[];
      const tabs = flows.filter((f) => f.type === 'tab');
      res.json({
        status: 'connected',
        url: NODE_RED_URL,
        flows: tabs.map((t) => t.label),
      });
    } else {
      res.json({ status: 'connected', url: NODE_RED_URL, flows: [] });
    }
  } catch {
    res.json({ status: 'disconnected', url: NODE_RED_URL, flows: [] });
  }
});

// --- Start ---
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  UGB Banking API — http://localhost:${PORT}`);
    console.log(`  Node-RED events → ${NODE_RED_URL}/webhook/*\n`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
