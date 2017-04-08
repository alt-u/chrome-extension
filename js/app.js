
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
    setRemainingTime(10);
  });

  $('#buy-more-time').click(function() {
    // var time_remaining = (localStorage['time_remaining'] == null) ? 0 : localStorage['time_remaining'];
    // // console.log("Current time_remaining:", time_remaining);
    // // TODO: Process payment via server before granting credit!
    // localStorage['time_remaining'] = time_remaining + 20; // add credit!

    console.log('Buying more time...');
    setRemainingTime(15);
    refreshRemainingTimeUi(15);
    initializeClock();
    processCurrentTab(function(tabId) {
      chrome.tabs.update(tabId, { url: 'https://www.google.com/' } );
      window.close();
    });
  });

  // setInterval(function() {

  // }, 1000)
});
