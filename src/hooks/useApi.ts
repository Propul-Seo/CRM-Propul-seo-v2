// Custom hooks for API operations
import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, QueryOptions } from '@/types/api';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: unknown[] = []
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export interface UseMutationState<T, V = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
  mutate: (variables: V) => Promise<T>;
  reset: () => void;
}

export function useMutation<T, V = unknown>(
  mutationFn: (variables: V) => Promise<ApiResponse<T>>
): UseMutationState<T, V> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (variables: V): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      const response = await mutationFn(variables);
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
}

// Pagination hook
export interface UsePaginationState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  refetch: () => Promise<void>;
}

export function usePagination<T>(
  apiCall: (options: QueryOptions) => Promise<ApiResponse<T[]>>,
  initialOptions: QueryOptions = {}
): UsePaginationState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialOptions.page || 1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (currentPage: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall({
        ...initialOptions,
        page: currentPage,
      });
      setData(response.data);
      // Assuming pagination info is in response
      if ('pagination' in response) {
        const paginatedResponse = response as ApiResponse<T[]> & { pagination: { totalPages: number } };
        setTotalPages(paginatedResponse.pagination.totalPages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiCall, initialOptions]);

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    nextPage,
    previousPage,
    goToPage,
    refetch: () => fetchData(page),
  };
}