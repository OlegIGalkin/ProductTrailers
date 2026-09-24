import { useState } from 'react';
import { createLADateInstance } from '../lib/videoLogic.js';

export default function FilterControls({
  // These are the current (applied) values from the parent
  sortMode,
  onSortModeChange,
  dateFilterMode,
  selectedDateRange,
  onDateFilterChange,
  minUpvotes,
  onMinUpvotesChange,
  minComments,
  onMinCommentsChange,
  selectedCategory,
  onCategoryChange,
  categories,
  onApply, // new prop: callback to close modal after applying
}) {
  // Local state – initialised once when the modal opens
  const [localSortMode, setLocalSortMode] = useState(sortMode);
  const [localDateFilterMode, setLocalDateFilterMode] = useState(dateFilterMode);
  const [localSelectedDateRange, setLocalSelectedDateRange] = useState(
    selectedDateRange || { startDate: null, endDate: null }
  );
  const [localMinUpvotes, setLocalMinUpvotes] = useState(minUpvotes);
  const [localMinComments, setLocalMinComments] = useState(minComments);
  const [localSelectedCategory, setLocalSelectedCategory] = useState(selectedCategory);

  // Handler for the Apply button
  const handleApply = () => {
    if (
      localDateFilterMode === 'range' &&
      (!localSelectedDateRange.startDate ||
        !localSelectedDateRange.endDate ||
        localSelectedDateRange.startDate > localSelectedDateRange.endDate)
    ) {
      return;
    }

    // Push all local values to the parent
    onSortModeChange(localSortMode);
    onDateFilterChange(localDateFilterMode, localSelectedDateRange);
    onMinUpvotesChange(localMinUpvotes);
    onMinCommentsChange(localMinComments);
    onCategoryChange(localSelectedCategory);
    // Close the modal (if provided)
    if (onApply) onApply();
  };

  // Handle Enter key on number inputs – triggers Apply as a convenience
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div>
      <table style={{ width: '100%', marginBottom: 8 }}>
        <tbody>
          {/* Sort by */}
          <tr>
            <td width="50%">
              <label>Sort by: </label>
              <select
                value={localSortMode}
                onChange={(e) => setLocalSortMode(e.target.value)}
                style={{ padding: '4px 8px' }}
              >
                <option value="upvotes-desc">Upvotes Desc</option>
                <option value="upvotes-asc">Upvotes Asc</option>
                <option value="comments-desc">Comments Desc</option>
                <option value="comments-asc">Comments Asc</option>
                <option value="shuffle">Shuffle</option>
              </select>
            </td>
            <td width="50%" align="right" />
          </tr>

          {/* Date filter */}
          <tr>
            <td width="50%">
              <label>Filter by date (LA time): </label>
              <select
                value={localDateFilterMode}
                onChange={(e) => {
                  const mode = e.target.value;
                  setLocalDateFilterMode(mode);
                  if (mode !== 'range') {
                    setLocalSelectedDateRange({ startDate: null, endDate: null });
                  }
                }}
                style={{ padding: '4px 8px' }}
              >
                <option value="week">Current Week (Mon–Sun)</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="range">Pick a Date Range</option>
              </select>
              {localDateFilterMode === 'range' && (
                <>
                  <input
                    type="date"
                    aria-label="Start date"
                    value={
                      localSelectedDateRange.startDate
                        ? localSelectedDateRange.startDate.toISOString().slice(0, 10)
                        : ''
                    }
                    onChange={(e) => {
                      const startDate = e.target.value
                        ? createLADateInstance(e.target.value)
                        : null;
                      setLocalSelectedDateRange((current) => ({ ...current, startDate }));
                    }}
                    style={{ marginLeft: 8, padding: '4px' }}
                  />
                  <span style={{ margin: '0 8px' }}>to</span>
                  <input
                    type="date"
                    aria-label="End date"
                    value={
                      localSelectedDateRange.endDate
                        ? localSelectedDateRange.endDate.toISOString().slice(0, 10)
                        : ''
                    }
                    onChange={(e) => {
                      const endDate = e.target.value
                        ? createLADateInstance(e.target.value)
                        : null;
                      setLocalSelectedDateRange((current) => ({ ...current, endDate }));
                    }}
                    style={{ padding: '4px' }}
                  />
                </>
              )}
            </td>
          </tr>

          {/* Upvotes */}
          <tr>
            <td width="50%" colSpan="2">
              <label style={{ marginRight: 8 }}>Min Upvotes: </label>
              <input
                type="number"
                min="0"
                value={localMinUpvotes}
                onChange={(e) => setLocalMinUpvotes(Math.max(0, parseInt(e.target.value) || 0))}
                onKeyDown={handleKeyDown}
                style={{ width: '80px', padding: '4px' }}
              />
            </td>
          </tr>

          {/* Comments */}
          <tr>
            <td width="50%" colSpan="2">
              <label style={{ marginRight: 8 }}>Min Comments: </label>
              <input
                type="number"
                min="0"
                value={localMinComments}
                onChange={(e) => setLocalMinComments(Math.max(0, parseInt(e.target.value) || 0))}
                onKeyDown={handleKeyDown}
                style={{ width: '80px', padding: '4px' }}
              />
            </td>
          </tr>

          {/* Category */}
          <tr>
            <td width="50%">
              <label style={{ marginRight: 8 }}>Category: </label>
              <select
                value={localSelectedCategory || 'Any Category'}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalSelectedCategory(val === 'Any Category' ? null : val);
                }}
                style={{ padding: '4px 8px', width: 'auto', minWidth: '200px' }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </td>
            <td width="50%" align="right" />
          </tr>

          {/* Apply button row */}
          <tr>
            <td colSpan="2" style={{ textAlign: 'center', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={handleApply}
                disabled={
                  localDateFilterMode === 'range' &&
                  (!localSelectedDateRange.startDate ||
                    !localSelectedDateRange.endDate ||
                    localSelectedDateRange.startDate > localSelectedDateRange.endDate)
                }
                style={{
                  padding: '8px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: 'none',
                  background: '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                }}
              >
                Apply Filters
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}