import api from './client';
import { Document, Alert, GraphData, QueryRequest, QueryResponse } from '../types/models';

export const documentService = {
  uploadDocument: async (file: File): Promise<{ id: string; status: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  importUrl: async (url: string): Promise<{ status: string }> => {
    const response = await api.post(`/documents/import-url`, null, { params: { url } });
    return response.data;
  },

  getDocuments: async (): Promise<Document[]> => {
    const response = await api.get('/documents');
    return response.data;
  },

  getDocument: async (id: string): Promise<Document> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  downloadDocument: async (id: string, filename: string): Promise<void> => {
    const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  pauseUpload: async (id: string): Promise<{ status: string }> => {
    const response = await api.post(`/documents/${id}/pause`);
    return response.data;
  },

  resumeUpload: async (id: string): Promise<{ status: string }> => {
    const response = await api.post(`/documents/${id}/resume`);
    return response.data;
  },

  retryUpload: async (id: string): Promise<{ status: string }> => {
    const response = await api.post(`/documents/${id}/retry`);
    return response.data;
  },

  cancelUpload: async (id: string): Promise<{ status: string }> => {
    const response = await api.post(`/documents/${id}/cancel`);
    return response.data;
  },

  clearCompleted: async (): Promise<{ status: string }> => {
    const response = await api.post(`/documents/clear-completed`);
    return response.data;
  },
};

export const queryService = {
  submitQuery: async (query: QueryRequest): Promise<QueryResponse> => {
    const response = await api.post('/query', query);
    return response.data;
  },
};

export const graphService = {
  getNeighborhood: async (entityId: string, depth: number = 1): Promise<GraphData> => {
    const response = await api.get('/graph/neighborhood', {
      params: { entity_id: entityId, depth },
    });
    return response.data;
  },
};

export const alertService = {
  getAlerts: async (): Promise<Alert[]> => {
    const response = await api.get('/alerts');
    return response.data;
  },

  acknowledgeAlert: async (id: string): Promise<{ status: string }> => {
    const response = await api.post(`/alerts/${id}/acknowledge`);
    return response.data;
  },

  escalateAlert: async (id: string): Promise<{ status: string }> => {
    const response = await api.post(`/alerts/${id}/escalate`);
    return response.data;
  },
};

export interface PlatformStats {
  documents_total: number;
  chunks_total: number;
  graph_nodes: number;
  graph_edges: number;
  queries_24h: number;
  alerts_open: number;
  equipment_count: number;
  sensor_count: number;
  procedure_count: number;
  failure_count: number;
}

export const statsService = {
  getStats: async (): Promise<PlatformStats> => {
    const response = await api.get('/stats');
    return response.data;
  },
};
