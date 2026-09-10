import { useEffect, useState } from 'react';
import { processVideos, getDateRangeForFilter } from '../lib/videoLogic.js';

export function useVideos(dateFilters) {
  const { dateMode, selectedDate } = dateFilters;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortedVideos, setSortedVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [categoryName, setCategoryName] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { startDate, endDate } = getDateRangeForFilter(dateMode, selectedDate);
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const res = await fetch(`/.netlify/functions/videos?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to load videos: ${res.status}`);
        const raw = await res.json();
        if (cancelled) return;

        // processVideos now only does client-side shuffling and category extraction
        const processed = processVideos(raw);
        setSortedVideos(processed.sortedVideos);
        setFilteredVideos(processed.filteredVideos);
        setCategoryName(processed.categoryName);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { loading, error, sortedVideos, filteredVideos, categoryName };
}