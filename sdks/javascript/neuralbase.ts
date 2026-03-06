export type RequestHeaders = Record<string, string>;

export type ClientOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export type RequestOptions = {
  idempotencyKey?: string;
};

export type StoreMemoryInput = {
  userId: string;
  content: string;
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
};

export type ConversationMessage = {
  role?: string;
  author?: string;
  content: string;
  timestamp?: string | number;
};

export type ConversationIngestInput = {
  userId: string;
  source?: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
  data: {
    title?: string;
    summary?: string;
    participants?: string[];
    tags?: string[];
    messages: ConversationMessage[];
  };
};

export type SupportTicketIngestInput = {
  userId: string;
  source?: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
  data: {
    subject: string;
    description?: string;
    status?: string;
    priority?: string;
    comments: ConversationMessage[];
  };
};

export type DocumentIngestInput = {
  userId: string;
  source?: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
  data: {
    title?: string;
    text: string;
    sourceUrl?: string;
    mimeType?: string;
    pageCount?: number;
  };
};

export type GenericIngestInput = {
  type: "conversation" | "event" | "profile" | "ticket" | "document";
  userId: string;
  source?: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
  data: Record<string, unknown>;
};

export type QueuedMemoryResponse = {
  memoryId: string;
  status: "processing";
  estimatedMs: number;
  chunksCreated: number;
  chunksDeduplicated: number;
  contentType: string | null;
  strategy: string | null;
  agentReasoning: string | null;
  tokensProcessed: number;
  embeddingsCached: number;
  processingMs: number;
  webhookScheduled: boolean;
  connectorType?: string;
  source?: string | null;
  externalId?: string | null;
  acceptedAs?: "memory";
  normalized?: Record<string, unknown>;
};

export type BatchQueuedResponse = {
  ok: boolean;
  accepted: number;
  failedCount: number;
  items: Array<Record<string, unknown>>;
  failed: Array<{ index: number; error: string }>;
};

export type MemoryStatusResponse = {
  memoryId: string;
  status: "processing" | "complete" | "failed";
  chunksComplete: number;
  chunksTotal: number;
  errorMessage: string | null;
};

export class NeuralBaseError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "NeuralBaseError";
    this.status = status;
    this.body = body;
  }
}

export class NeuralBaseClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.neuralbase.cloud").replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async store(
    input: StoreMemoryInput,
    options: RequestOptions = {},
  ): Promise<QueuedMemoryResponse> {
    return this.requestJson<QueuedMemoryResponse>("/v1/memories", {
      method: "POST",
      body: input,
      idempotencyKey: options.idempotencyKey,
    });
  }

  async ingest(
    input: GenericIngestInput,
    options: RequestOptions = {},
  ): Promise<QueuedMemoryResponse> {
    return this.requestJson<QueuedMemoryResponse>("/v1/ingest", {
      method: "POST",
      body: input,
      idempotencyKey: options.idempotencyKey,
    });
  }

  async ingestBatch(
    items: GenericIngestInput[],
    options: RequestOptions = {},
  ): Promise<BatchQueuedResponse> {
    return this.requestJson<BatchQueuedResponse>("/v1/ingest/batch", {
      method: "POST",
      body: { items },
      idempotencyKey: options.idempotencyKey,
    });
  }

  async ingestConversation(
    input: ConversationIngestInput,
    options: RequestOptions = {},
  ): Promise<QueuedMemoryResponse> {
    return this.requestJson<QueuedMemoryResponse>("/v1/ingest/chat", {
      method: "POST",
      body: input,
      idempotencyKey: options.idempotencyKey,
    });
  }

  async ingestSupportTicket(
    input: SupportTicketIngestInput,
    options: RequestOptions = {},
  ): Promise<QueuedMemoryResponse> {
    return this.requestJson<QueuedMemoryResponse>("/v1/ingest/support", {
      method: "POST",
      body: input,
      idempotencyKey: options.idempotencyKey,
    });
  }

  async ingestDocument(
    input: DocumentIngestInput,
    options: RequestOptions = {},
  ): Promise<QueuedMemoryResponse> {
    return this.requestJson<QueuedMemoryResponse>("/v1/ingest/document", {
      method: "POST",
      body: input,
      idempotencyKey: options.idempotencyKey,
    });
  }

  async getMemoryStatus(memoryId: string): Promise<MemoryStatusResponse> {
    return this.requestJson<MemoryStatusResponse>(`/v1/memories/${memoryId}/status`, {
      method: "GET",
    });
  }

  private async requestJson<T>(
    path: string,
    input: {
      method: "GET" | "POST";
      body?: unknown;
      idempotencyKey?: string;
    },
  ): Promise<T> {
    const headers: RequestHeaders = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };

    const init: RequestInit = {
      method: input.method,
      headers,
    };

    if (input.idempotencyKey) {
      headers["Idempotency-Key"] = input.idempotencyKey;
    }

    if (input.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(input.body);
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    const text = await response.text();
    const parsed = text.length > 0 ? this.parseJson(text) : null;

    if (!response.ok) {
      const message =
        parsed && typeof parsed === "object" && "error" in parsed
          ? String((parsed as { error?: unknown }).error ?? "Request failed")
          : response.statusText || "Request failed";
      throw new NeuralBaseError(message, response.status, parsed);
    }

    return parsed as T;
  }

  private parseJson(text: string): unknown {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
}
