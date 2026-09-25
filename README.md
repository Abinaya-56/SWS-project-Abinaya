# DocuMind AI

DocuMind AI is a document management and question-answering application. Users upload text documents, ask questions about their content, inspect ranked source snippets, download files, and remove documents.

## Architecture

The application uses three tiers:

| Tier | Technology | Responsibility |
| --- | --- | --- |
| Presentation | React, Vite, nginx | Upload UI, document list, chat history, source highlighting, and theme toggle |
| Application | Node.js, Express | Document APIs, chat orchestration, TF-IDF retrieval, and Swagger docs |
| Persistence | lowdb and filesystem | Document metadata, source text, and uploaded files |

In Docker Compose, the `frontend` service serves the built React application and proxies API traffic to the `backend` service. The backend writes its database and uploads under `/app/data`, backed by the named `document_data` volume.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api-docs` | Swagger UI for the API |
| GET | `/api/documents` | List documents, newest first |
| POST | `/api/documents` | Upload a `.txt`, `.md`, or `.json` document as multipart field `file` |
| GET | `/api/documents/:id/download` | Download a stored document |
| DELETE | `/api/documents/:id` | Delete a document and its uploaded file |
| POST | `/api/chat` | Ask a question with JSON body `{ "question": "..." }` |

## Local Development

Install all dependencies from the repository root:

```powershell
npm run install:all
```

Create `server/.env` from the example and set `OPENAI_API_KEY` when OpenAI-backed answers are desired:

```powershell
Copy-Item server/.env.example server/.env
```

Start the frontend and backend together:

```powershell
npm run dev
```

Local URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Swagger UI: http://localhost:5000/api-docs

Run the backend test suite with:

```powershell
npm test
```

## Docker Compose

Create the environment file first. Leave the key empty to use the deterministic mock answer:

```powershell
Copy-Item server/.env.example server/.env
```

Build and start the three services:

```powershell
docker compose up --build
```

The containerized application is available at:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Swagger UI: http://localhost:5000/api-docs

The browser-facing `VITE_API_URL` defaults to `http://localhost:5000` in Compose. It can be changed as a frontend build argument or runtime environment value. nginx routes `/api` and `/api-docs` to the internal `backend` service.

Stop the services without deleting persisted documents:

```powershell
docker compose down
```

Use `docker compose down -v` only when the `document_data` volume should also be removed.

## Retrieval and AI Fallback

The backend tokenizes the question and every document, calculates inverse document frequency across the document collection, and ranks results using cosine similarity between TF-IDF vectors. The top three matches provide the answer context, relevance score, and exact matched snippet returned to the frontend.

When `OPENAI_API_KEY` is configured, the answer service sends the question and ranked document context to `gpt-4o-mini`. Without a key, it uses the local mock fallback and returns the best retrieved snippet, so the application remains usable without external credentials.
