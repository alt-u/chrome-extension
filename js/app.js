
// register handlers for removing items
function registerBlockedUrlsRemoveButtons() {
  $('#blocked_sites button').each(function(i) {
    $(this).click(function() {
      urlSet.delete($(this).data('url'));
      populateBlockedUrls();
    });
  });
}

// displays the list of our blocked sites
function populateBlockedUrls() {
  var urlList = $("<div class='blocked_list list-group'></div>");
  for (var i = 0; i < urlSet.urls.length; i++) {
    urlList.append("<button type='button' class='list-group-item' data-url='" + urlSet.urls[i] + "'>" + urlSet.urls[i] + '</button>');
  }
  $('#blocked_sites').html(urlList);

  registerBlockedUrlsRemoveButtons(); 
}

function toggleBadge(rgbColor, badgeText) {
  chrome.browserAction.setBadgeBackgroundColor({'color': rgbColor});
  chrome.browserAction.setBadgeText({'text': badgeText});
}

$(document).ready(function() {

  populateBlockedUrls();

  // handler to add the current site
  $('#block_current_site').click(function() {
    chrome.tabs.getSelected(null, function(tab) {
      urlSet.create(getHostname(tab.url));
      populateBlockedUrls();
    });

    window.close();
  });

  $('#accessToken').val(settings.all.accessToken);
  $('#save-config').click(function() {
    settings.all.accessToken = $('#accessToken').val();
    settings.save();

    window.close();
  });

  $('#fix-everything').click(function() {
    console.log('Fixing everything!');
    localStorage['time_remaining'] = 10;
  });

  // setInterval(function() {

  // }, 1000)
});
