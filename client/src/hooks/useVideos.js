import { useEffect, useState } from 'react';
import { processVideos, getDateRangeForFilter } from '../lib/videoLogic.js';

export function useVideos(dateFilters, onEmptyResults) {
  const { dateMode, selectedDateRange } = dateFilters;
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [sortedVideos, setSortedVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [categoryName, setCategoryName] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { startDate, endDate } = getDateRangeForFilter(dateMode, selectedDateRange);
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const res = await fetch(`/.netlify/functions/videos?${params.toString()}`);
        let raw = [];

        if (res.ok) {
          raw = await res.json().catch(() => []);
        } else {
          raw = [];
        }

        if (cancelled) return;
        if (raw.length === 0) onEmptyResults?.(dateMode);

        const processed = processVideos(raw);
        setSortedVideos(processed.sortedVideos);
        setFilteredVideos(processed.filteredVideos);
        setCategoryName(processed.categoryName);
      } catch (e) {
        if (!cancelled) {
          setSortedVideos([]);
          setFilteredVideos([]);
          setCategoryName(null);
          setError(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [
    dateMode,
    selectedDateRange?.startDate?.getTime(),
    selectedDateRange?.endDate?.getTime(),
    onEmptyResults,
  ]);

  return { loading, hasLoaded, error, sortedVideos, filteredVideos, categoryName };
}