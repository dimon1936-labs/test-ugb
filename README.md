# UGB Banking — Операційна платформа

Демо внутрішньої банківської платформи для обробки міжрахункових переказів.

## Стек

- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Backend:** Express.js, PostgreSQL (SERIALIZABLE транзакції)
- **Automation:** Node-RED (fraud detection, курси НБУ, звіти)
- **Infra:** Docker Compose (PostgreSQL + Node-RED)

## Архітектура

```
Next.js :3000 → Express API :4000 → PostgreSQL :5433
                     ↓ events
                 Node-RED :1880
                 ├─ Fraud detection (velocity check, >50K/>100K алерти)
                 ├─ Курси НБУ (bank.gov.ua API, кожні 3 год)
                 ├─ Аудит операцій
                 └─ Щогодинний звіт
```

## Запуск

```bash
# 1. Docker (PostgreSQL + Node-RED)
docker-compose up -d

# 2. Залежності
npm install

# 3. Express API (термінал 1)
npm run server

# 4. Next.js (термінал 2)
npm run dev
```

- Frontend: http://localhost:3000
- Node-RED: http://localhost:1880 
- API: http://localhost:4000

## .env

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ugb_banking
PORT=4000
NODE_RED_URL=http://localhost:1880
```
