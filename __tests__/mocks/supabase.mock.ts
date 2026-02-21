/**
 * Mock Supabase Client
 * 
 * Provides mock Supabase client for testing without database connection.
 */

type QueryBuilder = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  gt: jest.Mock;
  gte: jest.Mock;
  lt: jest.Mock;
  lte: jest.Mock;
  in: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
};

/**
 * Create a mock query builder with chainable methods
 */
function createMockQueryBuilder(data: any = null, error: any = null): QueryBuilder {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };

  // Make the builder itself a promise that resolves to { data, error }
  builder.then = (resolve: any) => {
    resolve({ data, error });
    return builder;
  };

  return builder;
}

/**
 * Mock Supabase Client
 */
export class MockSupabaseClient {
  private mockData: Map<string, any[]> = new Map();
  private shouldFail: boolean = false;
  private errorMessage: string = 'Database error';

  constructor() {
    // Initialize with empty tables
    this.mockData.set('users', []);
    this.mockData.set('clients', []);
    this.mockData.set('campaigns', []);
    this.mockData.set('ad_sets', []);
    this.mockData.set('ads', []);
    this.mockData.set('meta_metrics', []);
    this.mockData.set('leads', []);
    this.mockData.set('ai_recommendations', []);
    this.mockData.set('creative_library', []);
    this.mockData.set('reports', []);
    this.mockData.set('notifications', []);
    this.mockData.set('meta_tokens', []);
    this.mockData.set('commission_models', []);
  }

  setFailure(fail: boolean, message?: string) {
    this.shouldFail = fail;
    if (message) {
      this.errorMessage = message;
    }
  }

  setMockData(table: string, data: any[]) {
    this.mockData.set(table, data);
  }

  getMockData(table: string) {
    return this.mockData.get(table) || [];
  }

  clearMockData() {
    this.mockData.forEach((_, key) => {
      this.mockData.set(key, []);
    });
  }

  from(table: string) {
    const data = this.mockData.get(table) || [];
    const error = this.shouldFail ? { message: this.errorMessage } : null;

    return {
      select: jest.fn().mockReturnValue(createMockQueryBuilder(data, error)),
      insert: jest.fn().mockReturnValue(createMockQueryBuilder(data[0], error)),
      update: jest.fn().mockReturnValue(createMockQueryBuilder(data[0], error)),
      delete: jest.fn().mockReturnValue(createMockQueryBuilder(null, error)),
    };
  }

  auth = {
    signUp: jest.fn().mockResolvedValue({
      data: {
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { access_token: 'test-token' },
      },
      error: null,
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: {
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { access_token: 'test-token' },
      },
      error: null,
    }),
    signInWithOAuth: jest.fn().mockResolvedValue({
      data: { url: 'https://oauth.example.com' },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn().mockResolvedValue({
      data: {
        session: { access_token: 'test-token', user: { id: 'test-user-id' } },
      },
      error: null,
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
  };

  storage = {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'test-file-path' },
        error: null,
      }),
      download: jest.fn().mockResolvedValue({
        data: new Blob(['test content']),
        error: null,
      }),
      remove: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/test-file' },
      }),
    }),
  };

  rpc = jest.fn().mockResolvedValue({ data: null, error: null });
}

/**
 * Create a mock Supabase client instance
 */
export function createMockSupabaseClient() {
  return new MockSupabaseClient();
}

/**
 * Mock Supabase auth helpers for Next.js
 */
export const mockSupabaseAuthHelpers = {
  createServerComponentClient: jest.fn(() => createMockSupabaseClient()),
  createRouteHandlerClient: jest.fn(() => createMockSupabaseClient()),
  createMiddlewareClient: jest.fn(() => createMockSupabaseClient()),
};
