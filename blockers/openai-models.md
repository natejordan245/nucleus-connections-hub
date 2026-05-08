# Note — OpenAI model names

`OpenAILLMClient` uses `gpt-5.3-nano` (extraction) and `gpt-5.5-instant`
(rerank), per design-doc §15. If these are not available on the account being
used, `withFallback` flips the LLM flag to `mock` on the first 4xx and the
demo continues uninterrupted.

To swap: edit the two model constants at the top of
`lib/data-layer/real/OpenAILLMClient.ts`.
