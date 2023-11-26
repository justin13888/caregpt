# 👩‍🦰 CareGPT

A RAG ChatBot for Employee Care at a fictitious company called Techcom.

### Prerequisites

- node.js v20.9.0 or above
- npm 9.7.1 or above
- VS Code with Git

## 🚀 Getting Started

First, clone this repo to your local machine.

Next, install the dependencies:

```bash
npm i
```

Create `.env` and set up the private keys for the Cohere and Supabase APIs in the file. See `.env.example`.

Now you're ready to run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with the browser. Ask the bot something and you'll see a streamed response.

## RAG Implementation

The application uses Cohere as the LLM and Supabase as the vector store.

It also uses LangChain.js to integrate components, and Vercel AI to implement streaming of the LLM responses.

The home page to the Employee Care ChatBot is `app/page.tsx`.

The backend logic is in `app/api/chat/route.ts` where you can change the prompt to the LLM.

The answer from the ChatBot is based only on the information stored in the vector database. At runtime, the application retrieves the relevant snippets from the vector database using Cohere embeddings API. It then passes these snippets to the Cohere Chat API to answer the user's question.

### Supabase Vector Store

The RAG documents in the `app/data` folder are used to seed the vector database.

To re-populate the documents in the vector database:

- Log into the Supabase console and select the database in use.
- Go to the SQL Editor and clear your `documents` table by running `DELETE FROM documents`.
- Modify `app/ingest/seed.ts` to load any of the RAG documents from the `app/data` folder.
- Execute `seed.ts`:
  ```bash
  npm run seed
  ```
