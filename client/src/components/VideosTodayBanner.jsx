import { countTodayVideos } from '../lib/videoLogic.js';

export default function VideosTodayBanner({ filteredVideos }) {
  const count = countTodayVideos(filteredVideos);
  if (count === 0) return null;
  return (
    <div id="videostoday" style={{ verticalAlign: 'middle' }}>
      {count} videos added today
    </div>
  );
}
