UPDATE conversations
SET model = 'GROQ_LLAMA_70B'
WHERE model IN (
    'GROQ_LLAMA_8B',
    'OR_LLAMA_8B_FREE',
    'OR_QWEN_FREE',
    'GROQ_GEMMA'
);
