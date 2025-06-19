
import { supabase } from '@/integrations/supabase/client';

export const AI_PROVIDERS = {
  GOOGLE: 'Google',
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
};

export const AVAILABLE_MODELS = [
  // Google Gemini Models (Latest)
  { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash Preview', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.5-flash-native-audio-dialog', name: 'Gemini 2.5 Flash Native Audio', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.5-flash-exp-native-audio-thinking-dialog', name: 'Gemini 2.5 Flash Exp Native Audio', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 Flash Preview TTS', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro Preview', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.5-pro-preview-tts', name: 'Gemini 2.5 Pro Preview TTS', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.0-flash-preview-image-generation', name: 'Gemini 2.0 Flash Image Gen', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash Latest', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro Latest', provider: AI_PROVIDERS.GOOGLE },
  
  // OpenAI Models
  { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1 (Latest)', provider: AI_PROVIDERS.OPENAI },
  { id: 'o3-2025-04-16', name: 'O3 (Reasoning)', provider: AI_PROVIDERS.OPENAI },
  { id: 'o4-mini-2025-04-16', name: 'O4 Mini (Fast Reasoning)', provider: AI_PROVIDERS.OPENAI },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: AI_PROVIDERS.OPENAI },
  { id: 'gpt-4o', name: 'GPT-4o', provider: AI_PROVIDERS.OPENAI },
  { id: 'dall-e-3', name: 'DALL-E 3 (Images)', provider: 'OpenAI', type: 'image' },
  { id: 'dall-e-2', name: 'DALL-E 2 (Images)', provider: 'OpenAI', type: 'image' },
  
  // Anthropic Models
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4 (Latest)', provider: AI_PROVIDERS.ANTHROPIC },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Latest)', provider: AI_PROVIDERS.ANTHROPIC },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: AI_PROVIDERS.ANTHROPIC },
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
