export interface Document {
  id: string;
  filename: string;
  upload_date: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  created_at: string;
  acknowledged: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface QueryRequest {
  query: string;
  filters?: Record<string, any>;
}

export interface QueryResponse {
  answer: string;
  sources: { doc_id: string; title: string }[];
  confidence: number;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details: Record<string, any>;
  };
}
