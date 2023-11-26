import { CohereClient } from "cohere-ai";
import { Embeddings } from "langchain/embeddings/base";
import { CohereEmbeddingsParams } from "langchain/embeddings/cohere";

export class CohereAIEmbeddings
  extends Embeddings
  implements CohereEmbeddingsParams
{
  modelName = "embed-english-v3.0";

  batchSize = 48;

  private apiKey: string;

  private client!: CohereClient;

  constructor(
    fields?: Partial<CohereEmbeddingsParams> & {
      verbose?: boolean;
      apiKey?: string;
    },
  ) {
    const fieldsWithDefaults = { maxConcurrency: 2, ...fields };

    super(fieldsWithDefaults);

    const apiKey = fieldsWithDefaults?.apiKey || process.env?.COHERE_API_KEY;

    if (!apiKey) {
      throw new Error("Cohere API key not found");
    }

    this.modelName = fieldsWithDefaults?.modelName ?? this.modelName;
    this.batchSize = fieldsWithDefaults?.batchSize ?? this.batchSize;
    this.apiKey = apiKey;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    await this.maybeInitClient();

    const batches = chunkArray(texts, this.batchSize);

    // console.log("batches :>> ", batches);

    const batchRequests = batches.map((batch) =>
      this.embeddingWithRetry({
        model: this.modelName,
        texts: batch,
        inputType: "search_document",
      }),
    );

    const batchResponses = await Promise.all(batchRequests);

    const embeddings: number[][] = [];

    for (let i = 0; i < batchResponses.length; i += 1) {
      const batch = batches[i];
      const batchResponse = batchResponses[i];
      for (let j = 0; j < batch.length; j += 1) {
        embeddings.push(batchResponse.embeddings[j]);
      }
    }

    return embeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    await this.maybeInitClient();
    // console.log("embed text :>> ", text);

    const res = await this.embeddingWithRetry({
      model: this.modelName,
      texts: [text],
      inputType: "search_query",
    });

    // console.log("embeddings :>> ", res.embeddings[0]);
    return res.embeddings[0];
  }

  private async embeddingWithRetry(
    request: Parameters<typeof this.client.embed>[0],
  ) {
    await this.maybeInitClient();

    return this.caller.call(this.client.embed.bind(this.client), request);
  }

  private async maybeInitClient() {
    if (!this.client) {
      this.client = new CohereClient({ token: this.apiKey });
    }
  }
}

const chunkArray = <T>(arr: T[], chunkSize: number) =>
  arr.reduce((chunks, elem, index) => {
    const chunkIndex = Math.floor(index / chunkSize);
    const chunk = chunks[chunkIndex] || [];
    // eslint-disable-next-line no-param-reassign
    chunks[chunkIndex] = chunk.concat([elem]);
    return chunks;
  }, [] as T[][]);
