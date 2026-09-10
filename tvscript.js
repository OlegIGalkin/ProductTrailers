							var parsedResults;
							var sortedVideos;
							var filteredVideos;
							
							var categoryName;
							
							//localStorage.clear();
							startPapaParse();
							
							async function startPapaParse()
							{
								Papa.parse("ProductVideosPlaylist.csv", 
									{
										download: true,
										delimiter: ';',
										header: true,
										complete: function(results) 
										{
											parsedResults = results;
											sortedVideos = shuffleSortedVideos(sortParsedVideos(parsedResults.data));
											
											categoryName = getCategoryName(sortedVideos);
											
											filteredVideos = filterParsedVideosCategory(filterSameOldVideosInCategory(sortedVideos, categoryName), categoryName);
										}
									});
							}
							
							function getCategoryFromUrl()
							{
								return getURLParameters()["category"];
							}
							
							function getCategoryName(sortedVideos)
							{
								var categoryInURL = getCategoryFromUrl();
								return isCategoryPresentAmongExisting(categoryInURL, sortedVideos) ? categoryInURL : null;
							}
							
							function isCategoryNamePresent()
							{
								return categoryName != null;
							}
							
							async function waitForVideos()
							{
								while(true)
								{
									if (filteredVideos != null)
										break;
									await Sleep(100);
								}
							}
							
							$( document ).ready( function ()
							{
								showContent();
							} );
							
							async function showContent()
							{
								await waitForVideos();
								
								buildPlaylist(filteredVideos);
								
								initShowWatchedCheckBox();								
								showWatchedCheckBox(filteredVideos);
								
								showTodayVideos(filteredVideos);
								
								fillCategoriesList(sortedVideos, categoryName);
								setCategorySiteHeader(sortedVideos, categoryName);
								$("#openNavBtn").show();
								
								$("#content").show();
							}
							
							function initShowWatchedCheckBox()
							{
								$("#showwatchedvideos").prop("checked", mustShowWatchedVideos());
								$('#showwatchedvideos').change(showHideWatchedVideos);
							}
							
							function mustShowWatchedVideos()
							{
								if (isCategoryNamePresent())
									return true;
								return allVideosWatched(filteredVideos);
							}
							
							function getURLParameters() 
							{
								var parameters = {};
								var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) 
								{
									parameters[key] = unescape(value);
								});
								return parameters;
							}

							function getCategories(parsedVideos)
							{
								var categories = new Array();
								for(var index = 0; index < parsedVideos.length; ++index)
								{
									var parsedVideo = parsedVideos[index];
									var commaCategories = parsedVideo["Categories"];
									if (commaCategories == null)
										continue;
									var splitCategories = commaCategories.split(',');
									if (splitCategories == null)
										continue;
									for(var jndex = 0; jndex < splitCategories.length; ++jndex)
									{
										var category = splitCategories[jndex];
										if (category == null || category == "")
											continue;
										if (jQuery.inArray(category, categories) >= 0)
											continue;
										categories.push(category);
									}
								}
								return categories;
							}
							
							function isCategoryPresentAmongExisting(category, parsedVideos)
							{
								if (category == null)
									return false;
								var allCategories = getCategories(parsedVideos);
								return jQuery.inArray(category, allCategories) >= 0;
							}
							
							function filterParsedVideosCategory(parsedVideos, categoryName)
							{
								if (categoryName == null)
									return parsedVideos;
								var filtered = new Array();
								for(var index = 0; index < parsedVideos.length; ++index)
								{
									var parsedVideo = parsedVideos[index];
									var commaCategories = parsedVideo["Categories"];
									if (commaCategories == null)
										continue;
									var categories = commaCategories.split(',');
									if (categories == null)
										continue;
									if (jQuery.inArray(categoryName, categories) < 0)
										continue;
									filtered.push(parsedVideo);
								}
								return filtered;
							}
							
							function filterSameOldVideosInCategory(sortedVideos, categoryName)
							{
								if (categoryName == null)
									return sortedVideos;
								var filtered = new Array();
								for(var index = 0; index < sortedVideos.length; ++index)
								{
									var found = false;
									var video = sortedVideos[index];
									for(var jndex = 0; jndex < filtered.length; ++jndex)
									{
										if (video["VideoURL"] == filtered[jndex]["VideoURL"])
										{
											found = true;
											break;
										}
									}
									if (!found)
									{
										filtered.push(video);
									}
								}
								return filtered;
							}
							
							function sortParsedVideos(parsedVideos)
							{
								var sorted = new Array();
								for(var index = 0; index < parsedVideos.length; ++index)
								{
									var parsedVideo = parsedVideos[index];
									if (parsedVideo["TimeWhenAdded"] == null || parsedVideo["Title"] == null || parsedVideo["VideoURL"] == null)
									{
										continue;
									}
									var timeWhenAdded = moment(parsedVideo["TimeWhenAdded"]).toDate();
									var videoWithDate = {Title : parsedVideo["Title"], VideoURL : parsedVideo["VideoURL"], TimeWhenAdded : timeWhenAdded, Description : parsedVideo["Description"], 
									Duration : parsedVideo["Duration"], SourceName : parsedVideo["SourceName"], 
									SourceLink : parsedVideo["SourceLink"], Categories : parsedVideo["Categories"]};
									sorted.push(videoWithDate);
								}
								
								sorted.sort((a,b) => (a.TimeWhenAdded > b.TimeWhenAdded) ? -1 : ((b.TimeWhenAdded > a.TimeWhenAdded) ? 1 : 0));
								
								return sorted;
							}
							
							function shuffleSortedVideos(videos)
							{
								var sameDaysVideos = new Array();
								for(var index = 0; index < videos.length; ++index)
								{
									var datePresent = false;
									var timeToCompare = videos[index]["TimeWhenAdded"];
									for(var yndex = 0; yndex < sameDaysVideos.length; ++yndex)
									{
										var alreadySavedTime = sameDaysVideos[yndex].TimeWhenAdded;
										if (alreadySavedTime.getFullYear() == timeToCompare.getFullYear() && 
											alreadySavedTime.getMonth() == timeToCompare.getMonth() && 
											alreadySavedTime.getDate() == timeToCompare.getDate())
										{
											datePresent = true;
											break;
										}
									}
									if (datePresent)
									{
										continue;
									}
									var videosOfSameDay = new Array();
									for(var jndex = 0; jndex < videos.length; ++jndex)
									{
										var timeWhenAdded = videos[jndex]["TimeWhenAdded"];
										if (timeWhenAdded.getFullYear() == timeToCompare.getFullYear() && 
											timeWhenAdded.getMonth() == timeToCompare.getMonth() && 
											timeWhenAdded.getDate() == timeToCompare.getDate())
										{
											videosOfSameDay.push(videos[jndex]);
										}
									}
									var shuffledVideosOfSameDay = shuffle(videosOfSameDay);
									var sameDayVideo = {TimeWhenAdded : timeToCompare, Videos : shuffledVideosOfSameDay};
									sameDaysVideos.push(sameDayVideo);
								}
								var resultingVideos = new Array();
								for(var yndex = 0; yndex < sameDaysVideos.length; ++yndex)
								{
									var sameDayVideos = sameDaysVideos[yndex].Videos;
									for(var zndex = 0; zndex < sameDayVideos.length; ++zndex)
									{
										resultingVideos.push(sameDayVideos[zndex]);
									}
								}
								return resultingVideos;
							}
							
							function shuffle(a) 
							{
								var j, x, i;
								for (i = a.length - 1; i > 0; i--) {
									j = Math.floor(Math.random() * (i + 1));
									x = a[i];
									a[i] = a[j];
									a[j] = x;
								}
								return a;
							}
							
							function calculateLasting(videos)
							{
								var totalSeconds = 0;
								var totalMinutes = 0;
								for(var index = 0; index < videos.length; ++index)
								{
									var duration = videos[index]["Duration"];
									if (duration == null)
										continue;
									var minsec = duration.split(":");
									if (minsec.length != 2)
										continue;
									var seconds = parseInt(minsec[1]);
									var minutes = parseInt(minsec[0]);
									totalSeconds += seconds;
									totalMinutes += minutes;
								}
								if (totalMinutes == 0 && totalSeconds == 0)
								{
									return "";
								}
								
								var minutesToAdd = Math.floor(totalSeconds / 60); 
								totalMinutes += minutesToAdd;
								totalSeconds -= minutesToAdd * 60;
								var totalHours = Math.floor(totalMinutes / 60);
								totalMinutes -= totalHours * 60;
								
								var lasting = " " + totalMinutes + " min. " + totalSeconds + " sec. ";
								if (totalHours != 0)
									lasting = " " + totalHours + " hr." + lasting;
									
								return lasting;
							}
							
							function showTodayVideos(allVideos)
							{
								var todayVideos = [];
								for(var index = 0; index < allVideos.length; ++index)
								{
									if (isToday(allVideos[index]["TimeWhenAdded"]))
									{
										todayVideos.push(allVideos[index]);
									}
								}
								var lasting = calculateLasting(todayVideos);
								if (lasting == "")
								{
									return;
								}								
								$("#videostoday").text(todayVideos.length + " videos added today lasting" + lasting);
								$("#videostoday").show();
							}
							
							function fillCategoriesList(parsedVideos, categoryName)
							{
								var pvtechURL = location.protocol + "//" + location.host + location.pathname;
								
								var allVideosLi = $("<li/>").appendTo("#navList");
								var allVideosA = $("<a />").text("All Videos").attr("href", pvtechURL);
								allVideosA.appendTo(allVideosLi);
								
								if (categoryName == null)
									allVideosA.css("color","orange");
								
								var categories = getCategories(parsedVideos);
								categories.sort();
								for(var zndex = 0; zndex < categories.length; ++zndex)
								{
									var category = categories[zndex];
									var categoryLi = $("<li/>").appendTo("#navList");
									var categoryUrl = pvtechURL + "?category=" + escape(category);
									var categoryA = $("<a />").text(category).attr("href", categoryUrl);
									categoryA.appendTo(categoryLi);
									if (categoryName == category)
										categoryA.css("color","orange");
								}
							}
							
							function setCategorySiteHeader(parsedVideos, categoryName)
							{
								if (categoryName == null)
								{
									$("#categoryHeader").text("");
									return;
								}
								$("#categoryHeader").text("Category: " + categoryName);
							}
							
							function mustShowWatchedCheckBox(allVideos)
							{
								return anyWatchedVideos(allVideos) && !allVideosWatched(allVideos);
							}
							
							function showWatchedCheckBox(allVideos)
							{
								if (mustShowWatchedCheckBox(allVideos))
								{
									$("#watchedvideosform").show();
								}
							}
							
							function anyWatchedVideos(allVideos)
							{
								for(var index = 0; index < allVideos.length; ++index)
								{
									var videoURL = allVideos[index]["VideoURL"];
									var timeWhenAdded = allVideos[index]["TimeWhenAdded"];
									if (isVideoWatched(videoURL, timeWhenAdded))
									{
										return true;
									}
								}
								return false;
							}
							
							function allVideosWatched(allVideos)
							{
								for(var index = 0; index < allVideos.length; ++index)
								{
									var videoURL = allVideos[index]["VideoURL"];
									var timeWhenAdded = allVideos[index]["TimeWhenAdded"];
									if (!isVideoWatched(videoURL, timeWhenAdded))
									{
										return false;
									}
								}
								return true;
							}
							
							function Sleep(ms) 
							{
							  return new Promise(resolve => setTimeout(resolve, ms));
							}
							
							const isToday = (someDate) => {
							  const today = new Date()
							  return someDate.getDate() == today.getDate() &&
								someDate.getMonth() == today.getMonth() &&
								someDate.getFullYear() == today.getFullYear()
							}
							
							function isYesterday(someDate)
							{
							  var yesterday = new Date();
							  yesterday.setDate(yesterday.getDate() - 1);
							  return someDate.getDate() == yesterday.getDate() &&
								someDate.getMonth() == yesterday.getMonth() &&
								someDate.getFullYear() == yesterday.getFullYear();
							}

							
							function getYouTubeVideoIdFromUrl(youTubeVideoURL)
							{
								var videoId = youTubeVideoURL.match(				/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
								return videoId[1];
							}
							
							function getVideoIndex(allVideos, video)
							{
								var videoIndex = 0;
								while(videoIndex < allVideos.length)
								{
									var videoURL = allVideos[videoIndex]["VideoURL"];
									var timeWhenAdded = allVideos[videoIndex]["TimeWhenAdded"];
									if (videoURL == video["VideoURL"] && timeWhenAdded == video["TimeWhenAdded"])
										return videoIndex;
									videoIndex++;
								}
								return null;
							}
							
							function getVideoToPlayNext(allVideos, currentVideo)
							{
								var videoIndex = 0;
								if (currentVideo != null)
								{
									var videoIndex = getVideoIndex(allVideos, currentVideo);
									if (videoIndex == null)
										return null;
									++videoIndex;
								}
								if (videoIndex >= allVideos.length)
									videoIndex = 0;
								var nextVideo;
								var allVidsWatched = allVideosWatched(allVideos);
								while(videoIndex < allVideos.length)
								{
									var videoURL = allVideos[videoIndex]["VideoURL"];
									var timeWhenAdded = allVideos[videoIndex]["TimeWhenAdded"];
									if (allVidsWatched || !isVideoWatched(videoURL, timeWhenAdded))
									{
										nextVideo = allVideos[videoIndex];
										break;
									}
									videoIndex++;
								}
								return nextVideo;
							}
							
							function storePlayedVideo(videoURL, timeWhenAdded)
							{
								if (isVideoWatched(videoURL, timeWhenAdded))
									return;
								if (localStorage.getItem(timeWhenAdded) == null)
									localStorage.setItem(timeWhenAdded, videoURL);
							}
							
							function isVideoWatched(videoURL, timeWhenAdded)
							{
								var watchedVideoURL = localStorage.getItem(timeWhenAdded);
								return watchedVideoURL == videoURL;
							}
							
							var playlist;
							function buildPlaylist(allVideos)
							{
								var playlistData = composePlaylistData(allVideos, mustShowWatchedVideos());
								playlist = new tTable( {
										titles : [
											{ "title": "Title", "type" : "string" },
											{ "title": "Added", "type" : "string" },
											{ "title": "TimeWhenAdded", "type" : "string" },
											{ "title": "Index", "type" : "number" },
											{ "title": "isWatched", "type" : "number" },
											{ "title": "Duration (mm:ss)", "type" : "string" },
											{ "title": "Source", "type" : "string" }
										],
										data : playlistData,
										hidden_cols : [3, 4, 5],
										page_size : 50,
										row_numbers : true,
										goto : false, 
										hover_cols : false, 
										nav_arrows : true, 
										sorting : [4],
										sort_by : 4,
										search : true,
										search_auto : true,
										search_container : "#table_id_search",
										search_sensitive : false,
										search_value : "",
										container : "#table_id",
										pager : "#table_id_pager"
									} );
							}
							
							function composePlaylistData(allVideos, fillWatchedVideos)
							{
								var rows = new Array();
								for(var index = 0; index < allVideos.length; ++index)
								{
									var singleVideo = allVideos[index];
									var isWatched = isVideoWatched(singleVideo.VideoURL, singleVideo.TimeWhenAdded);
									if (!fillWatchedVideos && isWatched)
									{
										continue;
									}
									var row = composeTableRow(singleVideo, index, isWatched);
									rows.push(row);
								}
								return rows;
							}
							
							function composeTableRow(singleVideo, videoIndex, isWatched)
							{
								var timeWhenAdded = singleVideo["TimeWhenAdded"].toString();
								var formattedTimeWhenAdded = singleVideo["TimeWhenAdded"].toLocaleDateString();
								if (isToday(singleVideo["TimeWhenAdded"]))
									formattedTimeWhenAdded = "Today";
								if (isYesterday(singleVideo["TimeWhenAdded"]))
									formattedTimeWhenAdded = "Yesterday";
								var titleAsLink = "<a href=\"" + singleVideo["VideoURL"] + "\" target=\"_blank\">" + singleVideo["Title"] + "</a>";
								var sourceName = singleVideo["SourceName"];
								var sourceLink = singleVideo["SourceLink"];
								var sourceAsLink = "";
								if (sourceName != null && sourceLink != null)
								{
									sourceAsLink = "<a href=\"" + sourceLink + "\" target=\"_blank\">" + sourceName + "</a>";
								}
								var row = [titleAsLink, formattedTimeWhenAdded, timeWhenAdded, videoIndex, isWatched ? 1 : 0, 
									singleVideo["Duration"], sourceAsLink];
								return row;
							}
							
							function showHideWatchedVideos() 
							{
								if($(this).is(":checked")) 
								{
									showWatchedVideos(filteredVideos);
									return;
								}
								hideWatchedVideos();
							}
							
							function showWatchedVideos(allVideos)
							{
								for(var index = 0; index < allVideos.length; ++index)
								{
									var singleVideo = allVideos[index];
									var isWatched = isVideoWatched(singleVideo.VideoURL, singleVideo.TimeWhenAdded);
									if (!isWatched)
									{
										continue;
									}
									
									var videoDateString = singleVideo["TimeWhenAdded"].toString();
									var delRow = {"3" : videoDateString};
									playlist.delRow(delRow);
									
									var row = composeTableRow(singleVideo, index, isWatched);
									row[0] = "<I>" + row[0] + "</I>";
									row[1] = "<I>" + row[1] + "</I>";
									row[5] = "<I>" + row[5] + "</I>";
									row[6] = "<I>" + row[6] + "</I>";
									playlist.data.push(row);
								}
								playlist.goto(playlist.page);
							}
							
							function hideWatchedVideos()
							{
								var delRow = {"5" : 1};
								playlist.delRow(delRow);
							}
							
							function markAsPlayingInPlaylist(allVideos, videoToMark)
							{
								var videoIndex = getVideoIndex(allVideos, videoToMark);
								var videoToMarkDateString = videoToMark["TimeWhenAdded"].toString();
								
								var delRow = {"3" : videoToMarkDateString};
								playlist.delRow(delRow);
								
								var row = composeTableRow(videoToMark, videoIndex, false);
								row[0] = "<strong>" + row[0] + "</strong>";
								row[1] = "<strong>" + row[1] + "</strong>";
								row[5] = "<strong>" + row[5] + "</strong>";
								row[6] = "<strong>" + row[6] + "</strong>";
								playlist.addRow(row);
							}
							
							function markAsPlayedInPlaylist(allVideos, videoToMark)
							{
								var videoIndex = getVideoIndex(allVideos, videoToMark);
								var videoToMarkDateString = videoToMark["TimeWhenAdded"].toString();
								
								var delRow = {"3" : videoToMarkDateString};
								playlist.delRow(delRow);
								
								var row = composeTableRow(videoToMark, videoIndex, true);
								row[0] = "<I>" + row[0] + "</I>";
								row[1] = "<I>" + row[1] + "</I>";
								row[5] = "<I>" + row[5] + "</I>";
								row[6] = "<I>" + row[6] + "</I>";
								playlist.addRow(row);
							}
							
							async function waitForPlaylist()
							{
								while(true)
								{
									if (playlist != null)
										break;
									await Sleep(100);
								}
							}

							var ytplayer;
							function onYouTubeIframeAPIReady()
							{								
									createYTPlayer();
							}													
							
							var playingVideo;
							async function createYTPlayer()
							{
								await waitForVideos();
								
								playingVideo = getVideoToPlayNext(filteredVideos, playingVideo);
								var playingVideoId = getYouTubeVideoIdFromUrl(playingVideo["VideoURL"]);
								ytplayer = new YT.Player('myytplayer', {
													width: "100%",
													height: "500",
													videoId: playingVideoId,
													playerVars: {
													  iv_load_policy: 3,  
													  autoplay : 1
													},
													events: {
														'onReady': onPlayerReady,
														'onStateChange': onPlayerStateChange,
														'onError': onPlayerError
													}
												});
												
								await waitForPlaylist();							
								markAsPlayingInPlaylist(filteredVideos, playingVideo);
							}
							
							function onPlayerReady(event) 
							{
								 //event.target.playVideo();
							}
							
							function onPlayerStateChange(a)
							{
								if(a.data==YT.PlayerState.ENDED)
								{
									playNextVideo();
								}
							}
							
							function showAllVideosWatched(allVideos)
							{
								if (!allVideosWatched(filteredVideos))
									return;								
								if ($('#showwatchedvideos').is(':checked') == false)
									$("#showwatchedvideos").prop("checked", true).change();
								$("#watchedvideosform").hide();								
							}
							
							function playNextVideo()
							{
								var playingVideoId = "";
								do
								{
									storePlayedVideo(playingVideo.VideoURL, playingVideo.TimeWhenAdded);
									markAsPlayedInPlaylist(filteredVideos, playingVideo);
									
									showAllVideosWatched(filteredVideos);
									
									playingVideo = getVideoToPlayNext(filteredVideos, playingVideo);
									markAsPlayingInPlaylist(filteredVideos, playingVideo);
									
									playingVideoId = getYouTubeVideoIdFromUrl(playingVideo["VideoURL"]);
									if(playingVideoId != null) 
									{
									   ytplayer.loadVideoById(playingVideoId);
									} 
									else 
									{ 
										console.log("The youtube video ID is not valid.");
										ytplayer.stopVideo();
									}
								}
								while (playingVideoId == null);
							}
							
							function onPlayerError(a)
							{
								playNextVideo();
							}