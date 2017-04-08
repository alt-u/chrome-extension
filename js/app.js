
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
    var time_remaining = (localStorage['time_remaining'] == null) ? 0 : localStorage['time_remaining'];

    // Process payment via server before granting credit!
    var ajax_url = 'http://73fb0bbf.eu.ngrok.io/api/badthing';
    var authToken = settings.all.accessToken;
    var ajax_config = { headers: { 'Authorization': authToken } };
    var ajax_data = {
      description: 'Web Browsing Time!',
      value: 1 // 1.00
    };

    console.log('Buying more time...');
    $.post(ajax_url, ajax_data, ajax_config).done(function() {
      setRemainingTime(10); // set to 10 seconds
      initializeClock();
      processCurrentTab(function(tabId) {
        chrome.tabs.update(tabId, { url: 'https://www.google.com/' } );
        window.close();
      });
    }).fail(function() {
      alert( "error" );
    });

  });
});
