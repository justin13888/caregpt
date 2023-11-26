import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { CohereAIEmbeddings } from "@/app/integration/cohere-ai-embeddings";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";

require("dotenv").config();

// Don't forget to `DELETE from documents` in the Supabase test database before running this script.
// Otherwise, duplicates would result.
export const seedData = async () => {
  try {
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PRIVATE_KEY!,
    );

    const loader = new DirectoryLoader("data/", {
      ".txt": (path) => new TextLoader(path),
      ".md": (path) => new TextLoader(path),
    });

    const docs = await loader.load();

    const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
      chunkSize: 256,
      chunkOverlap: 20,
    });

    const splitDocuments = await splitter.splitDocuments(docs);

    await SupabaseVectorStore.fromDocuments(
      splitDocuments,
      new CohereAIEmbeddings(),
      {
        client,
        tableName: "documents",
        queryName: "match_documents",
      },
    );

    console.log("Done");
  } catch (e: any) {
    const stack = e.stack.split("\n").slice(1, 4).join("\n");
    console.log(stack);
    console.log(e);
  }
};

(async () => {
  await seedData();
})();
