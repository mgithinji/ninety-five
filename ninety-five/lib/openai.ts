import OpenAI from 'openai'

// Initialize OpenAI client lazily to avoid build errors when API key is missing
let openaiClient: OpenAI | null = null

function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

export const openai = {
  chat: {
    completions: {
      create: (...args: Parameters<OpenAI['chat']['completions']['create']>) => {
        return getOpenAI().chat.completions.create(...args)
      },
    },
  },
}
