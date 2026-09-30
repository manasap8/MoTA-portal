import { clientDb } from './clientDatabase';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

// Global flag to track if we're on a static host (e.g. Netlify) without an Express backend
let isStaticHost = false;

function parseBody(options: RequestInit): any {
  if (!options.body) return {};
  if (typeof options.body === 'string') {
    try {
      return JSON.parse(options.body);
    } catch {
      return {};
    }
  }
  return options.body;
}

function parseQueryParams(url: string): Record<string, string> {
  const idx = url.indexOf('?');
  if (idx === -1) return {};
  const params = new URLSearchParams(url.substring(idx));
  const res: Record<string, string> = {};
  params.forEach((v, k) => {
    res[k] = v;
  });
  return res;
}

/**
 * Client-Side Mock Fallback Router for Static Environments (Netlify, GitHub Pages, Vercel Static)
 */
function handleClientFallback<T = any>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  const [pathOnly] = endpoint.split('?');
  const params = parseQueryParams(endpoint);
  const body = parseBody(options);
  const token = getToken() || undefined;

  // 1. Auth routes
  if (pathOnly === '/auth/login' && method === 'POST') {
    return clientDb.login(body.email, body.password) as unknown as T;
  }
  if (pathOnly === '/auth/register' && method === 'POST') {
    return clientDb.register(body) as unknown as T;
  }
  if (pathOnly === '/auth/me') {
    return clientDb.getMe(token) as unknown as T;
  }
  if (pathOnly === '/auth/update-profile' && method === 'POST') {
    return clientDb.updateProfile(body) as unknown as T;
  }
  if (pathOnly === '/auth/logout' && method === 'POST') {
    return { ok: true } as unknown as T;
  }

  // 2. Schemes
  if (pathOnly === '/schemes') {
    return clientDb.getSchemes() as unknown as T;
  }
  if (pathOnly.startsWith('/schemes/')) {
    const parts = pathOnly.split('/');
    const schemeId = parts[2];
    if (parts.length === 3) {
      if (method === 'PUT') return clientDb.updateScheme(schemeId, body) as unknown as T;
      return clientDb.getSchemeById(schemeId) as unknown as T;
    }
    if (parts[3] === 'rules') return clientDb.updateScheme(schemeId, { rules: body.rules }) as unknown as T;
    if (parts[3] === 'documents') return clientDb.updateScheme(schemeId, { documents: body.documents }) as unknown as T;
    if (parts[3] === 'criteria') return clientDb.updateScheme(schemeId, { criteria: body.criteria }) as unknown as T;
  }

  // 3. Applications
  if (pathOnly === '/applications') {
    if (method === 'POST') return clientDb.createApplication(body) as unknown as T;
    return clientDb.getApplications(params) as unknown as T;
  }
  if (pathOnly.startsWith('/applications/')) {
    const parts = pathOnly.split('/');
    const appId = parts[2];
    if (parts.length === 3) {
      if (method === 'PUT') return clientDb.updateApplication(appId, body) as unknown as T;
      return clientDb.getApplicationById(appId) as unknown as T;
    }
    if (parts[3] === 'submit') return clientDb.submitApplication(appId) as unknown as T;
    if (parts[3] === 'transition') return clientDb.transitionStage(appId, body.stage, body.status) as unknown as T;
  }

  // 4. Documents
  if (pathOnly === '/documents/upload' || pathOnly === '/documents/sample-attach') {
    return clientDb.attachSampleDoc(body) as unknown as T;
  }
  if (pathOnly.startsWith('/documents/')) {
    const parts = pathOnly.split('/');
    const docId = parts[2];
    const action = parts[3];
    if (action === 'verify') return clientDb.verifyDoc(docId, body.remarks) as unknown as T;
    if (action === 'reject') return clientDb.rejectDoc(docId, body.reason) as unknown as T;
    if (action === 'clarify') return clientDb.clarifyDoc(docId, body.reason) as unknown as T;
    if (action === 'extraction') return clientDb.editExtraction(docId, body) as unknown as T;
  }

  // 5. Deficiencies
  if (pathOnly === '/deficiencies') {
    if (method === 'POST') return clientDb.raiseDeficiency(body) as unknown as T;
    return clientDb.getDeficiencies(params.applicationId) as unknown as T;
  }
  if (pathOnly.startsWith('/deficiencies/')) {
    const parts = pathOnly.split('/');
    const defId = parts[2];
    const action = parts[3];
    if (action === 'resubmit') return clientDb.resubmitDeficiency(defId, body) as unknown as T;
    if (action === 'resolve') return clientDb.resolveDeficiency(defId, body.remarks) as unknown as T;
    if (action === 'reject') return clientDb.rejectResolution(defId, body.remarks) as unknown as T;
  }

  // 6. Screening & Selection
  if (pathOnly === '/screening') {
    return clientDb.getScreeningData(params) as unknown as T;
  }
  if (pathOnly === '/selection/decision') {
    return clientDb.saveSelectionDecision(body) as unknown as T;
  }

  // 7. Post-Selection
  if (pathOnly === '/post-selection') {
    return clientDb.getPostSelection(params.applicationId) as unknown as T;
  }
  if (pathOnly === '/post-selection/progress') {
    return clientDb.submitProgress(body) as unknown as T;
  }
  if (pathOnly.startsWith('/post-selection/')) {
    return { success: true } as unknown as T;
  }

  // 8. Notifications
  if (pathOnly === '/notifications') {
    return clientDb.getNotifications() as unknown as T;
  }
  if (pathOnly === '/notifications/read-all') {
    clientDb.markAllNotificationsRead();
    return { success: true } as unknown as T;
  }
  if (pathOnly.startsWith('/notifications/') && pathOnly.endsWith('/read')) {
    const parts = pathOnly.split('/');
    clientDb.markNotificationRead(parts[2]);
    return { success: true } as unknown as T;
  }

  // 9. Communications
  if (pathOnly === '/communications' && method === 'POST') {
    return clientDb.sendCommunication(body) as unknown as T;
  }
  if (pathOnly.startsWith('/communications/')) {
    const parts = pathOnly.split('/');
    const appId = parts[2];
    return clientDb.getCommunications(appId) as unknown as T;
  }

  // 10. Analytics & Reports
  if (pathOnly === '/analytics/dashboard') {
    return clientDb.getDashboardAnalytics() as unknown as T;
  }
  if (pathOnly.startsWith('/reports/')) {
    return { title: 'Portal Report Data', rows: clientDb.getApplications() } as unknown as T;
  }

  // 11. Audit Logs
  if (pathOnly === '/audit-logs') {
    return clientDb.getAuditLogs() as unknown as T;
  }

  // 12. AI Assistant
  if (pathOnly === '/ai/query') {
    return clientDb.queryAi(body.query, body.applicationId) as unknown as T;
  }

  // 13. Demo Tools
  if (pathOnly === '/demo/reset') {
    return clientDb.resetToDefault() as unknown as T;
  }
  if (pathOnly === '/demo/sample-documents') {
    return [
      { id: 'sample_st_cert', name: 'sample_st_cert_matching.pdf', title: 'Scheduled Tribe Certificate (Matching)', category: 'Caste Certificate' },
      { id: 'sample_income_cert', name: 'sample_income_cert_valid.pdf', title: 'Income Certificate (Valid)', category: 'Income Certificate' },
      { id: 'sample_passport', name: 'sample_passport_valid.pdf', title: 'Indian Passport (Valid)', category: 'Passport' },
      { id: 'sample_admission', name: 'sample_admission_letter.pdf', title: 'University Admission Letter', category: 'Admission Letter' },
      { id: 'sample_marksheet', name: 'sample_marksheet_pg.pdf', title: 'Postgraduate Degree Marksheet', category: 'Degree Certificate' },
    ] as unknown as T;
  }

  // 14. Users
  if (pathOnly === '/users') {
    return (clientDb as any).data.users as unknown as T;
  }
  if (pathOnly.startsWith('/users/')) {
    return { success: true } as unknown as T;
  }

  // Default fallback
  return {} as unknown as T;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // If we already detected static host mode, route directly to Client Database
  if (isStaticHost) {
    try {
      return handleClientFallback<T>(endpoint, options);
    } catch (e: any) {
      throw e;
    }
  }

  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';

    // If server responds with 404, 405 (Method Not Allowed on Netlify static files), 502, or HTML (index.html fallback)
    if (
      response.status === 404 ||
      response.status === 405 ||
      response.status === 502 ||
      contentType.includes('text/html')
    ) {
      isStaticHost = true;
      console.info(`[Static Host Detected] Activating client-side database for ${endpoint}`);
      return handleClientFallback<T>(endpoint, options);
    }

    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // If unauthorized on login, throw the actual auth error
      const errorMsg = data?.error?.message || data?.message || response.statusText || 'An error occurred';
      const err = new Error(errorMsg) as any;
      err.code = data?.error?.code;
      err.status = response.status;
      throw err;
    }

    return data as T;
  } catch (err: any) {
    // If it's an explicit validation error from backend, rethrow
    if (err.status === 400 || err.status === 401 || err.status === 403) {
      throw err;
    }

    // Network error or fetch failure (e.g. Netlify static hosting where server is not listening)
    isStaticHost = true;
    console.info(`[Network Fallback] Handling ${endpoint} via client database:`, err.message);
    try {
      return handleClientFallback<T>(endpoint, options);
    } catch (fallbackErr) {
      throw fallbackErr;
    }
  }
}

export const api = {
  // Auth
  register: (body: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (body: any) => apiRequest('/auth/update-profile', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  // Schemes
  getSchemes: () => apiRequest('/schemes'),
  getSchemeById: (id: string) => apiRequest(`/schemes/${id}`),
  createScheme: (body: any) => apiRequest('/schemes', { method: 'POST', body: JSON.stringify(body) }),
  updateScheme: (id: string, body: any) => apiRequest(`/schemes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateRules: (id: string, rules: any[]) => apiRequest(`/schemes/${id}/rules`, { method: 'PUT', body: JSON.stringify({ rules }) }),
  updateDocs: (id: string, documents: any[]) => apiRequest(`/schemes/${id}/documents`, { method: 'PUT', body: JSON.stringify({ documents }) }),
  updateCriteria: (id: string, criteria: any[]) => apiRequest(`/schemes/${id}/criteria`, { method: 'PUT', body: JSON.stringify({ criteria }) }),

  // Applications
  getApplications: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/applications${qs}`);
  },
  getApplicationById: (id: string) => apiRequest(`/applications/${id}`),
  createApplication: (body: any) => apiRequest('/applications', { method: 'POST', body: JSON.stringify(body) }),
  updateApplication: (id: string, body: any) => apiRequest(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  submitApplication: (id: string) => apiRequest(`/applications/${id}/submit`, { method: 'POST' }),
  transitionStage: (id: string, body: any) => apiRequest(`/applications/${id}/transition`, { method: 'POST', body: JSON.stringify(body) }),

  // Documents
  uploadDocument: (formData: FormData) => apiRequest('/documents/upload', { method: 'POST', body: formData }),
  attachSampleDoc: (body: any) => apiRequest('/documents/sample-attach', { method: 'POST', body: JSON.stringify(body) }),
  verifyDoc: (id: string, remarks?: string) => apiRequest(`/documents/${id}/verify`, { method: 'POST', body: JSON.stringify({ remarks }) }),
  rejectDoc: (id: string, reason: string) => apiRequest(`/documents/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  clarifyDoc: (id: string, reason: string) => apiRequest(`/documents/${id}/clarify`, { method: 'POST', body: JSON.stringify({ reason }) }),
  editExtraction: (id: string, extractionData: any) => apiRequest(`/documents/${id}/extraction`, { method: 'PUT', body: JSON.stringify(extractionData) }),

  // Deficiencies
  getDeficiencies: (applicationId?: string) => {
    const qs = applicationId ? `?applicationId=${applicationId}` : '';
    return apiRequest(`/deficiencies${qs}`);
  },
  raiseDeficiency: (body: any) => apiRequest('/deficiencies', { method: 'POST', body: JSON.stringify(body) }),
  resubmitDeficiency: (id: string, body: any) => apiRequest(`/deficiencies/${id}/resubmit`, { method: 'POST', body: JSON.stringify(body) }),
  resolveDeficiency: (id: string, remarks?: string) => apiRequest(`/deficiencies/${id}/resolve`, { method: 'POST', body: JSON.stringify({ remarks }) }),
  rejectResolution: (id: string, remarks: string) => apiRequest(`/deficiencies/${id}/reject`, { method: 'POST', body: JSON.stringify({ remarks }) }),

  // Screening & Selection
  getScreeningData: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/screening${qs}`);
  },
  saveSelectionDecision: (body: any) => apiRequest('/selection/decision', { method: 'POST', body: JSON.stringify(body) }),

  // Post Selection
  getPostSelection: (applicationId?: string) => {
    const qs = applicationId ? `?applicationId=${applicationId}` : '';
    return apiRequest(`/post-selection${qs}`);
  },
  submitPostSelectionDoc: (body: any) => apiRequest('/post-selection/submit-doc', { method: 'POST', body: JSON.stringify(body) }),
  verifyPostSelectionDoc: (body: any) => apiRequest('/post-selection/verify-doc', { method: 'POST', body: JSON.stringify(body) }),
  submitProgress: (body: any) => apiRequest('/post-selection/progress', { method: 'POST', body: JSON.stringify(body) }),
  approveProgress: (id: string, body: any) => apiRequest(`/post-selection/progress/${id}/approval`, { method: 'POST', body: JSON.stringify(body) }),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),

  // Communications
  getCommunications: (applicationId: string) => apiRequest(`/communications/${applicationId}`),
  sendMessage: (body: any) => apiRequest('/communications', { method: 'POST', body: JSON.stringify(body) }),

  // Analytics & Reports
  getAnalyticsDashboard: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/analytics/dashboard${qs}`);
  },
  getReport: (type: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/reports/${type}${qs}`);
  },

  // Audit Logs
  getAuditLogs: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/audit-logs${qs}`);
  },

  // AI Assistant
  queryAi: (query: string) => apiRequest('/ai/query', { method: 'POST', body: JSON.stringify({ query }) }),

  // Demo Tools
  resetDemoData: () => apiRequest('/demo/reset', { method: 'POST' }),
  getSampleDocuments: () => apiRequest('/demo/sample-documents'),

  // User Management
  getUsers: () => apiRequest('/users'),
  updateUser: (id: string, body: any) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  resetPassword: (id: string, password?: string) => apiRequest(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
};
