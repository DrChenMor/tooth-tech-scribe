
import { supabase } from '@/integrations/supabase/client';

export const AI_PROVIDERS = {
  GOOGLE: 'Google',
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
};

export const AVAILABLE_MODELS = [
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: AI_PROVIDERS.OPENAI },
  { id: 'gpt-4o', name: 'GPT-4o', provider: AI_PROVIDERS.OPENAI },
  { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', provider: AI_PROVIDERS.ANTHROPIC },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: AI_PROVIDERS.ANTHROPIC },
];

export async function getAIAnalysis(prompt: string, agentConfig: any): Promise<any> {
  const { data, error } = await supabase.functions.invoke('run-ai-agent-analysis', {
    body: { prompt, agentConfig },
  });

  if (error) {
    console.error('Error invoking edge function:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }

  return data;
}
