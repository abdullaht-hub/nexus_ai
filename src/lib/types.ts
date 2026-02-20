export interface Client {
  id: string;
  name: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientCreateInput {
  name: string;
}

export interface FeatureInput {
  [key: string]: string | number | boolean | string[];
}

export interface FeatureField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string | number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  fields: FeatureField[];
  tools: ToolDefinition[];
  buildSystemPrompt: (client: Client, docContent?: string) => string;
  buildUserMessage: (inputs: FeatureInput) => string;
}

export interface ToolResult {
  tool_use_id: string;
  content: string;
}

export interface StreamChunk {
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'done';
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: string;
}

export interface OrchestrationRequest {
  clientId: string;
  featureId: string;
  inputs: FeatureInput;
  modelId?: string;
}

export interface SavedOutput {
  id: string;
  clientId: string;
  featureId: string;
  featureName: string;
  inputs: FeatureInput;
  output: string;
  createdAt: string;
}
