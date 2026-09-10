export default function CompactDurationControls({
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
}) {
  const step = (field, delta) => {
    let val = field === 'minutes' ? minutes : seconds;
    val = Math.min(59, Math.max(0, val + delta));
    const event = { target: { value: String(val) } };
    field === 'minutes' ? onMinutesChange(event) : onSecondsChange(event);
  };

  return (
    <div
      className="compact-duration"
      title="Play the next video after the specified time. Enter 0:0 to play the entire video."
    >
      <span className="duration-label">⏱</span>
      <div className="duration-field">
        <input
          type="number"
          min="0"
          max="59"
          value={minutes}
          onChange={onMinutesChange}
          className="duration-input"
          title="Minutes"
        />
        <div className="button-stack">
          <button
            type="button"
            className="dur-btn"
            onClick={() => step('minutes', 1)}
            aria-label="Increase minutes"
          >▲</button>
          <button
            type="button"
            className="dur-btn"
            onClick={() => step('minutes', -1)}
            aria-label="Decrease minutes"
          >▼</button>
        </div>
      </div>
      <span>:</span>
      <div className="duration-field">
        <input
          type="number"
          min="0"
          max="59"
          value={seconds}
          onChange={onSecondsChange}
          className="duration-input"
          title="Seconds"
        />
        <div className="button-stack">
          <button
            type="button"
            className="dur-btn"
            onClick={() => step('seconds', 5)}
            aria-label="Increase seconds"
          >▲</button>
          <button
            type="button"
            className="dur-btn"
            onClick={() => step('seconds', -5)}
            aria-label="Decrease seconds"
          >▼</button>
        </div>
      </div>
    </div>
  );
}