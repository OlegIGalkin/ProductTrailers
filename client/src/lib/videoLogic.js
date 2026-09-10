import moment from 'moment-timezone';

export function getURLParameters() {
  const parameters = {};
  const searchParams = new URLSearchParams(window.location.search);
  
  for (const [key, value] of searchParams.entries()) {
    parameters[key] = value;
  }
  
  return parameters;
}

export function getCategoryFromUrl() {
  const category = getURLParameters()['category']
  //console.log(`getCategoryFromUrl ${category}`);
  return category;
}

export function getCategories(parsedVideos) {
  const categories = [];
  for (let index = 0; index < parsedVideos.length; ++index) {
    const parsedVideo = parsedVideos[index];
    const commaCategories = parsedVideo['Categories'];
    if (commaCategories == null) continue;
    const splitCategories = commaCategories.split(',');
    if (splitCategories == null) continue;
    for (let jndex = 0; jndex < splitCategories.length; ++jndex) {
      const category = splitCategories[jndex];
      const categoryString = String(category).trim();
      if (categoryString == null || categoryString == '') continue;
      if (categories.includes(categoryString)) continue;
      categories.push(categoryString);
    }
  }
  return categories;
}

export function isCategoryPresentAmongExisting(category, parsedVideos) {
  if (category == null) return false;
  const allCategories = getCategories(parsedVideos);
  return allCategories.includes(category);
}

export function getCategoryName(sortedVideos) {
  const categoryInURL = getCategoryFromUrl();
  return isCategoryPresentAmongExisting(categoryInURL, sortedVideos)
    ? categoryInURL
    : null;
}

export function filterParsedVideosCategory(parsedVideos, categoryName) {
  if (categoryName == null) return parsedVideos;
  const filtered = [];
  for (let index = 0; index < parsedVideos.length; ++index) {
    const parsedVideo = parsedVideos[index];
    const commaCategories = parsedVideo['Categories'];
    if (commaCategories == null) continue;
    const splitCategories = commaCategories.split(',');
    if (splitCategories == null) continue;
    const categories = [];
    for (let jndex = 0; jndex < splitCategories.length; ++jndex) {
      const category = splitCategories[jndex];
      const categoryString = String(category).trim();
      if (categoryString == null || categoryString == '') continue;
      if (categories.includes(categoryString)) continue;
      categories.push(categoryString);
    }
    if (!categories.includes(categoryName)) continue;
    filtered.push(parsedVideo);
  }
  return filtered;
}

export function filterSameOldVideosInCategory(sortedVideos, categoryName) {
  if (categoryName == null) return sortedVideos;
  const filtered = [];
  for (let index = 0; index < sortedVideos.length; ++index) {
    let found = false;
    const video = sortedVideos[index];
    for (let jndex = 0; jndex < filtered.length; ++jndex) {
      if (video['VideoURL'] === filtered[jndex]['VideoURL']) {
        found = true;
        break;
      }
    }
    if (!found) filtered.push(video);
  }
  return filtered;
}

export function sortParsedVideos(parsedVideos) {
  const sorted = [];
  for (let index = 0; index < parsedVideos.length; ++index) {
    const parsedVideo = parsedVideos[index];
    if (
      parsedVideo['TimeWhenAdded'] == null ||
      parsedVideo['Title'] == null ||
      parsedVideo['VideoURL'] == null || 
      !isValidYouTubeId(getYouTubeVideoIdFromUrl(parsedVideo['VideoURL']))
    ) {
      continue;
    }
    const timeWhenAdded = moment.tz(parsedVideo['TimeWhenAdded'], 'America/Los_Angeles').toDate();
    sorted.push({
      Title: parsedVideo['Title'],
      VideoURL: parsedVideo['VideoURL'],
      TimeWhenAdded: timeWhenAdded,
      Description: parsedVideo['Description'],
      SourceName: parsedVideo['SourceName'],
      SourceLink: parsedVideo['SourceLink'],
      Categories: parsedVideo['Categories'],
      Votes: parsedVideo['Votes'] ?? 0,
      Comments: parsedVideo['Comments'] ?? 0,
    });
  }
  sorted.sort((a, b) =>
    a.TimeWhenAdded > b.TimeWhenAdded
      ? -1
      : b.TimeWhenAdded > a.TimeWhenAdded
        ? 1
        : 0
  );
  return sorted;
}

export function shuffle(a) {
  const arr = [...a];
  let j, x, i;
  for (i = arr.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = arr[i];
    arr[i] = arr[j];
    arr[j] = x;
  }
  return arr;
}

export function shuffleSortedVideos(videos) {
  const sameDaysVideos = [];
  for (let index = 0; index < videos.length; ++index) {
    let datePresent = false;
    const timeToCompare = videos[index]['TimeWhenAdded'];
    for (let yndex = 0; yndex < sameDaysVideos.length; ++yndex) {
      const alreadySavedTime = sameDaysVideos[yndex].TimeWhenAdded;
      if (
        alreadySavedTime.getFullYear() === timeToCompare.getFullYear() &&
        alreadySavedTime.getMonth() === timeToCompare.getMonth() &&
        alreadySavedTime.getDate() === timeToCompare.getDate()
      ) {
        datePresent = true;
        break;
      }
    }
    if (datePresent) continue;
    const videosOfSameDay = [];
    for (let jndex = 0; jndex < videos.length; ++jndex) {
      const timeWhenAdded = videos[jndex]['TimeWhenAdded'];
      if (
        timeWhenAdded.getFullYear() === timeToCompare.getFullYear() &&
        timeWhenAdded.getMonth() === timeToCompare.getMonth() &&
        timeWhenAdded.getDate() === timeToCompare.getDate()
      ) {
        videosOfSameDay.push(videos[jndex]);
      }
    }
    const shuffledVideosOfSameDay = shuffle(videosOfSameDay);
    sameDaysVideos.push({
      TimeWhenAdded: timeToCompare,
      Videos: shuffledVideosOfSameDay,
    });
  }
  const resultingVideos = [];
  for (let yndex = 0; yndex < sameDaysVideos.length; ++yndex) {
    const sameDayVideos = sameDaysVideos[yndex].Videos;
    for (let zndex = 0; zndex < sameDayVideos.length; ++zndex) {
      resultingVideos.push(sameDayVideos[zndex]);
    }
  }
  return resultingVideos;
}

export function processVideos(raw) {
  const sortedVideos = shuffleSortedVideos(sortParsedVideos(raw));
  const categoryName = getCategoryName(sortedVideos);
  const filteredVideos = filterParsedVideosCategory(
    filterSameOldVideosInCategory(sortedVideos, categoryName),
    categoryName
  );
  return { sortedVideos, filteredVideos, categoryName };
}

export const isToday = (someDate) => {
  const laNow = moment.tz('America/Los_Angeles');
  const laSomeDate = moment.tz(someDate, 'America/Los_Angeles');
  return laSomeDate.isSame(laNow, 'day');
};

export function isYesterday(someDate) {
  const laNow = moment.tz('America/Los_Angeles');
  const laSomeDate = moment.tz(someDate, 'America/Los_Angeles');
  const laYesterday = laNow.clone().subtract(1, 'day');
  return laSomeDate.isSame(laYesterday, 'day');
}

export function getYouTubeVideoIdFromUrl(youTubeVideoURL) {
  const match = youTubeVideoURL.match(
    /(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/shorts\/|\/watch\?v=|\/)([a-zA-Z0-9_-]+)/
  );
  return match ? match[1] : null;
}

export function isValidYouTubeId(id) {
  if (id == null) {
    return false;
  }
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id);
}

export function getVideoIndex(allVideos, video) {
  let videoIndex = 0;
  while (videoIndex < allVideos.length) {
    const videoURL = allVideos[videoIndex]['VideoURL'];
    const timeWhenAdded = allVideos[videoIndex]['TimeWhenAdded'];
    if (
      videoURL === video['VideoURL'] &&
      timeWhenAdded === video['TimeWhenAdded']
    )
      return videoIndex;
    videoIndex++;
  }
  return null;
}

export function isVideoWatched(videoURL, timeWhenAdded) {
  const localStorageValue = localStorage.getItem(String(videoURL));
  //console.log(`isVideoWatched ${videoURL} ${localStorageValue}`);
  return localStorageValue == timeWhenAdded.toString();
}

export function storePlayedVideo(videoURL, timeWhenAdded) {
  //console.log(`storePlayedVideo ${videoURL} ${timeWhenAdded}`);
  const key = String(videoURL);
  localStorage.setItem(key, timeWhenAdded.toString());
}

export function allVideosWatched(allVideos) {
  for (let index = 0; index < allVideos.length; ++index) {
    const videoURL = allVideos[index]['VideoURL'];
    const timeWhenAdded = allVideos[index]['TimeWhenAdded'];
    if (!isVideoWatched(videoURL, timeWhenAdded)) return false;
  }
  return true;
}

export function anyWatchedVideos(allVideos) {
  for (let index = 0; index < allVideos.length; ++index) {
    const videoURL = allVideos[index]['VideoURL'];
    const timeWhenAdded = allVideos[index]['TimeWhenAdded'];
    if (isVideoWatched(videoURL, timeWhenAdded)) return true;
  }
  return false;
}

export function getVideoToPlayNext(allVideos, currentVideo) {
  let videoIndex = 0;
  if (currentVideo != null) {
    videoIndex = getVideoIndex(allVideos, currentVideo);
    if (videoIndex == null) return null;
    ++videoIndex;
  }
  if (videoIndex >= allVideos.length) videoIndex = 0;
  let nextVideo;
  const allVidsWatched = allVideosWatched(allVideos);
  while (videoIndex < allVideos.length) {
    const videoURL = allVideos[videoIndex]['VideoURL'];
    const timeWhenAdded = allVideos[videoIndex]['TimeWhenAdded'];
    const videoId = getYouTubeVideoIdFromUrl(videoURL);
    if (!isValidYouTubeId(videoId)) {
      videoIndex++;
      continue;
    }
    if (allVidsWatched || !isVideoWatched(videoURL, timeWhenAdded)) {
      nextVideo = allVideos[videoIndex];
      //console.log(`nextVideo ${videoURL} ${timeWhenAdded}`);
      break;
    }
    videoIndex++;
  }
  return nextVideo;
}

export function mustShowWatchedVideos(filteredVideos, categoryName) {
  if (categoryName != null) return true;
  return allVideosWatched(filteredVideos);
}

export function mustShowWatchedCheckBox(allVideos) {
  return anyWatchedVideos(allVideos) && !allVideosWatched(allVideos);
}

export function formatAddedDate(singleVideo) {
  let formatted = singleVideo['TimeWhenAdded'].toLocaleDateString();
  if (isToday(singleVideo['TimeWhenAdded'])) formatted = 'Today';
  if (isYesterday(singleVideo['TimeWhenAdded'])) formatted = 'Yesterday';
  return formatted;
}

export function countTodayVideos(allVideos) {
  return allVideos.filter((v) => isToday(v['TimeWhenAdded'])).length;
}

export function getDateFilterFromUrl() {
  const params = getURLParameters();
  const mode = params['dateMode'] || 'week';
  const dateStr = params['dateValue'];
  let selectedDate = null;
  if (mode === 'pick' && dateStr) {
    // Parse the date string as a date in America/Los_Angeles (midnight LA time)
    const laMoment = moment.tz(dateStr, 'America/Los_Angeles');
    if (laMoment.isValid()) {
      selectedDate = laMoment.toDate(); // converts to JS Date (UTC-based)
    } else {
      selectedDate = new Date(dateStr);
    }
  }
  return { mode, selectedDate };
}

export function createLADateInstance(dateValue) {
  const laMoment = moment.tz(dateValue, 'America/Los_Angeles');
  if (laMoment.isValid()) {
      return laMoment.toDate();
  }
  return new Date(dateValue)
}

export function updateDateFilterInUrl(mode, selectedDate) {
  const url = new URL(window.location.href);
  if (mode === 'week') {
    url.searchParams.delete('dateMode');
    url.searchParams.delete('dateValue');
  } else {
    url.searchParams.set('dateMode', mode);
    if (mode === 'pick' && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      url.searchParams.set('dateValue', `${year}-${month}-${day}`);
    } else {
      url.searchParams.delete('dateValue');
    }
  }
  window.history.pushState({}, '', url);
}

// Returns true if the given date (as a Date object) falls inside the current week
// (Monday 00:00 to Sunday 23:59:59.999) in America/Los_Angeles time zone.
export function isCurrentWeekLA(date) {
  const laMoment = moment.tz(date, 'America/Los_Angeles');
  const nowLA = moment.tz('America/Los_Angeles');
  const startOfWeek = nowLA.clone().isoWeekday(1).startOf('day');   // Monday 00:00
  const endOfWeek = startOfWeek.clone().add(6, 'days').endOf('day'); // Sunday 23:59:59
  const isCurrentWeek =  laMoment.isBetween(startOfWeek, endOfWeek, null, '[]');
  //console.log(`isCurrentWeekLA: ${date} ${isCurrentWeek}`);
  return isCurrentWeek;
}

export function filterVideosByDate(videos, mode, selectedDate) {
  if (!videos) return videos;
  return videos.filter(video => {
    const videoDate = video.TimeWhenAdded;
    if (mode === 'week') return isCurrentWeekLA(videoDate);
    if (mode === 'today') return isToday(videoDate);
    if (mode === 'yesterday') return isYesterday(videoDate);
    if (mode === 'pick' && selectedDate) {
      return (
        videoDate.getFullYear() === selectedDate.getFullYear() &&
        videoDate.getMonth() === selectedDate.getMonth() &&
        videoDate.getDate() === selectedDate.getDate()
      );
    }
    return true;
  });
}

export function getVoteCommentFilterFromUrl() {
  const params = getURLParameters();
  const minUpvotes = parseInt(params.minUpvotes, 10);
  const minComments = parseInt(params.minComments, 10);
  return {
    minUpvotes: isNaN(minUpvotes) ? 0 : minUpvotes,
    minComments: isNaN(minComments) ? 0 : minComments,
  };
}

export function updateVoteCommentFilterInUrl(minUpvotes, minComments) {
  const url = new URL(window.location.href);
  if (minUpvotes > 0) {
    url.searchParams.set('minUpvotes', String(minUpvotes));
  } else {
    url.searchParams.delete('minUpvotes');
  }
  if (minComments > 0) {
    url.searchParams.set('minComments', String(minComments));
  } else {
    url.searchParams.delete('minComments');
  }
  window.history.pushState({}, '', url);
}

export function filterVideosByVotesComments(videos, minUpvotes, minComments) {
  if (!videos) return videos;
  return videos.filter(video => {
    const upvotes = video.Votes ?? 0;
    const comments = video.Comments ?? 0;
    return upvotes >= minUpvotes && comments >= minComments;
  });
}

export function getDateRangeForFilter(mode, selectedDate) {
  const nowLA = moment.tz('America/Los_Angeles');
  let start, end;

  switch (mode) {
    case 'week':
      start = nowLA.clone().isoWeekday(1).startOf('day').format();
      end = start.clone().add(7, 'days').format();
      break;
    case 'today':
      start = nowLA.clone().startOf('day').format();
      end = nowLA.clone().endOf('day').format();
      break;
    case 'yesterday':
      const yesterday = nowLA.clone().subtract(1, 'day');
      start = yesterday.startOf('day').format();
      end = yesterday.endOf('day').format();
      break;
    case 'pick':
      if (selectedDate) {
        const laDate = moment.tz(selectedDate, 'America/Los_Angeles');
        start = laDate.clone().startOf('day').format();
        end = laDate.clone().endOf('day').format();
      }
      break;
    default:
      return { startDate: null, endDate: null };
  }
  return { startDate: start, endDate: end };
}

export function videoKey(video) {
  return `${video.VideoURL}_${video.TimeWhenAdded.toString()}`;
}

export function filterVideosByCategory(videos, category) {
  if (!category || category === "Any Category") return videos;
  return filterParsedVideosCategory(videos, category);
}
