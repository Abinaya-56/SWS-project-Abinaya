# DocuMind AI

A three-tier document management and chat application with a Vite frontend, Express backend, and persistent document storage.

## Run With Docker Compose

1. Create the backend environment file:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

2. Set `OPENAI_API_KEY` in `server/.env`. Leave it empty to use the local mock answer.

3. Build and start all services:

   ```powershell
   docker compose up --build
   ```

The application is available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Swagger API docs: http://localhost:5000/api-docs

The backend stores `db.json` and uploaded files in the named `document_data` volume. The frontend accepts `VITE_API_URL` as a build argument and runtime environment value; Docker Compose defaults it to `http://localhost:5000` for browser access while nginx routes API requests to the `backend` service inside the Compose network.

Stop the services with `docker compose down`. Add `-v` when removing the persisted document volume is intentional.

## Local Development

Install dependencies with `npm run install:all`, then run `npm run dev` from the repository root. The server tests run with `npm test`.
