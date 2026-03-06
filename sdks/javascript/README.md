# `@neuralbase/js`

Official JavaScript client for the NeuralBase API.

## Install

```bash
npm install @neuralbase/js
```

## Use

```ts
import { NeuralBaseClient } from "@neuralbase/js";

const nb = new NeuralBaseClient({
  apiKey: "nb_live_...",
});

const queued = await nb.ingestConversation(
  {
    userId: "user_123",
    source: "intercom",
    externalId: "conv_987",
    data: {
      title: "Refund request",
      messages: [
        { role: "user", content: "I need help with a refund." },
        { role: "assistant", content: "Refund review started." }
      ]
    }
  },
  { idempotencyKey: "conv_987-v1" }
);

console.log(queued.memoryId);
```

## Included methods

- `store()`
- `ingest()`
- `ingestBatch()`
- `ingestConversation()`
- `ingestSupportTicket()`
- `ingestDocument()`
- `getMemoryStatus()`
