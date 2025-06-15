
import { supabase } from '@/integrations/supabase/client';

export const AI_PROVIDERS = {
  OPENAI: 'OpenAI',
  // ANTHROPIC: 'Anthropic', // Future support
  // GOOGLE: 'Google', // Future support
};

export const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: AI_PROVIDERS.OPENAI },
  { id: 'gpt-4o', name: 'GPT-4o', provider: AI_PROVIDERS.OPENAI },
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
