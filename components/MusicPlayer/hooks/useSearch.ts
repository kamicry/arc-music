import { useState, useCallback, useRef } from 'react';
import { SearchApiItem, MusicSource } from '../types';
import { apiClient } from '../utils/api';

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchApiItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [lastSearchKeyword, setLastSearchKeyword] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchRequestIdRef = useRef(0);

  const performSearch = useCallback(async (
    keyword: string, 
    source: MusicSource, 
    page: number = 1,
    count: number = 8
  ) => {
    if (!keyword.trim()) return;

    const requestId = ++searchRequestIdRef.current;
    setIsSearching(true);
    setErrorMessage(null);
    setSearchTerm(keyword);

    try {
      const results = await apiClient.searchSongs({
        source,
        name: keyword.trim(),
        count,
        pages: page,
      });

      // Prevent outdated responses
      if (requestId !== searchRequestIdRef.current) return;

      setSearchResults(results);
      setShowingSearchResults(true);
      setSearchPage(page);
      setLastSearchKeyword(keyword.trim());
      
      // For simplicity, assume there might be more results
      // In a real implementation, you'd check the API response
      setSearchHasMore(results.length >= count);

    } catch (error) {
      if (requestId !== searchRequestIdRef.current) return;
      
      console.error('Search failed:', error);
      setErrorMessage(error instanceof Error ? error.message : '搜索失败，请重试');
      setSearchResults([]);
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const searchNextPage = useCallback(async (source: MusicSource) => {
    if (!lastSearchKeyword || !searchHasMore || isSearching) return;

    await performSearch(lastSearchKeyword, source, searchPage + 1);
  }, [lastSearchKeyword, searchHasMore, searchPage, isSearching, performSearch]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setShowingSearchResults(false);
    setSearchPage(1);
    setSearchHasMore(false);
    setLastSearchKeyword(null);
    setErrorMessage(null);
    searchRequestIdRef.current = 0;
  }, []);

  const search = useCallback(async (keyword: string, source: MusicSource) => {
    clearSearch();
    await performSearch(keyword, source, 1);
  }, [performSearch, clearSearch]);

  return {
    // State
    searchTerm,
    searchResults,
    isSearching,
    showingSearchResults,
    searchPage,
    searchHasMore,
    lastSearchKeyword,
    errorMessage,
    
    // Actions
    search,
    performSearch,
    searchNextPage,
    clearSearch,
    setSearchTerm,
    setErrorMessage,
  };
}