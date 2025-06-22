import { supabase } from '@/integrations/supabase/client';

export const AI_PROVIDERS = {
  GOOGLE: 'Google',
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
};

// COPY THIS ENTIRE SECTION and REPLACE your AVAILABLE_MODELS array in aiModelService.ts
// KEEP THE SAME FORMAT AS YOUR EXISTING CODE!

export const AVAILABLE_MODELS = [
  // Google Gemini Models (Latest) - TEXT GENERATION
  { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash Preview', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.5-flash-native-audio-dialog', name: 'Gemini 2.5 Flash Native Audio', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.5-flash-exp-native-audio-thinking-dialog', name: 'Gemini 2.5 Flash Exp Native Audio', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 Flash Preview TTS', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro Preview', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.5-pro-preview-tts', name: 'Gemini 2.5 Pro Preview TTS', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash Latest', provider: AI_PROVIDERS.GOOGLE },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro Latest', provider: AI_PROVIDERS.GOOGLE },
  
  // 🎨 IMAGE GENERATION MODELS - Google (FIXED FORMAT)
  {
    id: 'google-imagen-3',
    name: 'Google Imagen 3',
    provider: AI_PROVIDERS.GOOGLE,
    type: 'image',
    capabilities: ['image-generation', 'text-to-image', 'high-quality'],
    pricing: '$0.03 per image',
    description: 'Google\'s latest high-quality image generation model with SynthID watermarking'
  },
  {
    id: 'gemini-2.0-flash-preview-image-generation',
    name: 'Gemini 2.0 Flash (Image)',
    provider: AI_PROVIDERS.GOOGLE,
    type: 'image',
    capabilities: ['image-generation', 'native-image-output', 'reasoning'],
    description: 'Experimental native image generation with enhanced reasoning'
  },
  
  // OpenAI Models - TEXT GENERATION
  { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1 (Latest)', provider: AI_PROVIDERS.OPENAI },
  { id: 'o3-2025-04-16', name: 'O3 (Reasoning)', provider: AI_PROVIDERS.OPENAI },
  { id: 'o4-mini-2025-04-16', name: 'O4 Mini (Fast Reasoning)', provider: AI_PROVIDERS.OPENAI },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: AI_PROVIDERS.OPENAI },
  { id: 'gpt-4o', name: 'GPT-4o', provider: AI_PROVIDERS.OPENAI },
  
  // 🎨 IMAGE GENERATION MODELS - OpenAI (FIXED FORMAT)
  { 
    id: 'dall-e-2', 
    name: 'DALL-E 2 (Images)', 
    provider: AI_PROVIDERS.OPENAI, 
    type: 'image',
    capabilities: ['image-generation', 'text-to-image'],
    description: 'Original DALL-E model'
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3 (Legacy)',
    provider: AI_PROVIDERS.OPENAI,
    type: 'image',
    capabilities: ['image-generation', 'text-to-image'],
    description: 'Legacy DALL-E model (use GPT-Image-1 instead)'
  },
  {
    id: 'openai-gpt-image-1',
    name: 'OpenAI GPT-Image-1',
    provider: AI_PROVIDERS.OPENAI,
    type: 'image',
    capabilities: ['image-generation', 'text-to-image', 'text-rendering'],
    pricing: 'Token-based',
    description: 'OpenAI\'s latest image generation model with superior instruction following'
  },
  
  // Anthropic Models - TEXT GENERATION  
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

// Helper functions
export const getModelsByType = (type: 'text' | 'image' | 'multimodal') => {
  return AVAILABLE_MODELS.filter(model => model.type === type);
};

export const getModelsByProvider = (provider: string) => {
  return AVAILABLE_MODELS.filter(model => model.provider === provider);
};

export const getImageGenerationModels = () => {
  return AVAILABLE_MODELS.filter(model => 
    model.type === 'image' || 
    (model.capabilities && model.capabilities.includes('image-generation'))
  );
};

export const getTextGenerationModels = () => {
  return AVAILABLE_MODELS.filter(model => 
    !model.type || // Models without type are assumed to be text models
    model.type === 'text' || 
    model.type === 'multimodal'
  );
};

export const getModelById = (id: string) => {
  return AVAILABLE_MODELS.find(model => model.id === id);
};

// Model validation
export const isValidModel = (modelId: string): boolean => {
  return AVAILABLE_MODELS.some(model => model.id === modelId);
};

export const isImageGenerationModel = (modelId: string): boolean => {
  const model = getModelById(modelId);
  return model?.type === 'image' || (model?.capabilities && model.capabilities.includes('image-generation')) || false;
};
