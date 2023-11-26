import { NextRequest, NextResponse } from "next/server";
import {
  Message as VercelChatMessage,
  StreamingTextResponse,
  readableFromAsyncIterable,
} from "ai";

import { PromptTemplate } from "langchain/prompts";
import { createClient } from "@supabase/supabase-js";

import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { CohereAIEmbeddings } from "@/app/integration/cohere-ai-embeddings";
import {
  ChatDocument,
  ChatMessage,
  ChatMessageRole,
  StreamedChatResponse,
} from "cohere-ai/api";
import { CohereClient } from "cohere-ai";

const formatMessage = (message: VercelChatMessage): ChatMessage => {
  let role: ChatMessageRole = message.role === "assistant" ? "CHATBOT" : "USER";
  return { role, message: message.content };
};

const systemMessage = `You are an empathic and friendly Employee Care 
chatbot of your company talking to the user, who is an employee of your company. 
Your name is Anne. Do not put your name at the end of your answer.
Never say "Kind regards", Sincerely or similar at the end of your answer. 
The answer is part of a conversation.
Give sound advices and recommendations to the user where appropriate.
Give you answer in GitHub-flavoured markdown format. 
Use table, bullets and styles in your answer, where appropriate.
Answer the question concisely based only on the documents provided to you and the chat history. 
The provided documents contain benefit information for the user you are talking to.
You and the user work in the same company called Techcom.
Do not make up an answer if you don't know.
Add emoji to enrich the answer if appropriate.
If the user is a new employee, provide when the new employee should enrol and give an introduction to the benefits.

The user can request time off through this ChatBot, which will send the request to his/her manager for approval. 
Ask the user for the vacation period.

Make up links for the user to click on for further information or to perform an action through the enterprise HR systems.

###
About the user:
The user is called Justin. He has chosen the core benefit options and didn't upgrade to enhanced health/dental options.
###
`.replaceAll("\n", " ");
// Sorry, some hacks in the system message for demo purpose.

const CONDENSE_QUESTION_TEMPLATE = `Given the chat history provided to you and a follow up question, 
rephrase the follow up question to be a standalone question, in its original language.
Give a concise answer as a standalone question.
Follow Up question: {question}
Standalone question:`;
const condenseQuestionPrompt = PromptTemplate.fromTemplate(
  CONDENSE_QUESTION_TEMPLATE,
);

class ChatStream implements AsyncIterable<string> {
  constructor(private chatStream: AsyncIterable<StreamedChatResponse>) {}
  [Symbol.asyncIterator](): AsyncIterator<string> {
    return {
      next: async (): Promise<IteratorResult<string>> => {
        let nextText: string | undefined;
        const iterator = this.chatStream[Symbol.asyncIterator]();
        let result: IteratorResult<StreamedChatResponse>;
        do {
          result = await iterator.next();
          if (!result.done && result.value.eventType === "text-generation") {
            nextText = result.value.text;
            break;
          }
        } while (!result.done);

        if (nextText !== undefined) {
          return { value: nextText, done: false };
        } else {
          return { value: "", done: true };
        }
      },
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: VercelChatMessage[] = body.messages ?? [];
    const chatHistory: ChatMessage[] =
      messages.length > 0
        ? messages
            .slice(0, -1)
            .filter(
              (message: VercelChatMessage) =>
                message.role === "assistant" || message.role === "user",
            )
            .map(formatMessage)
        : [];
    let question =
      messages.length > 0 ? messages[messages.length - 1].content : "";

    const client = new CohereClient({
      token: process.env.COHERE_API_KEY!,
    });
    let condenseQuestion = question;
    if (chatHistory.length > 0) {
      try {
        const condenseMessage = await condenseQuestionPrompt.format({
          question,
        });
        const condenseResponse = await client.chat({
          message: condenseMessage,
          model: "command",
          chatHistory,
          promptTruncation: "AUTO",
        });
        condenseQuestion = condenseResponse.text;
      } catch (e: any) {
        console.error(e);
      }
    }

    const vectorStoreClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PRIVATE_KEY!,
    );
    const vectorStore = new SupabaseVectorStore(new CohereAIEmbeddings(), {
      client: vectorStoreClient,
      tableName: "documents",
      queryName: "match_documents",
    });

    const docs = await vectorStore.similaritySearch(condenseQuestion);

    const documents: ChatDocument[] = docs.map(
      (doc) => <ChatDocument>{ snippet: doc.pageContent },
    );

    const response = await client.chatStream({
      message: question,
      model: "command-nightly",
      preambleOverride: systemMessage,
      chatHistory,
      // conversation_id: chatId,
      promptTruncation: "AUTO", //"OFF"
      // connectors: [{ id: "" }],
      // search_queries_only: false,
      documents,
      temperature: 0.1,
    });

    const stream = readableFromAsyncIterable(new ChatStream(response));

    return new StreamingTextResponse(stream);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
