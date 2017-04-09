
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
    console.log("Auth Token: ", authToken);
    var ajax_headers = { 'Authorization': authToken };
    var ajax_data = JSON.stringify({
      description: 'Web Browsing Time!',
      value: 1 // 1.00
    });
    var ajax_success = function() {
      console.log('Server Success!');
      setRemainingTime(10); // set to 10 seconds
      initializeClock();
      processCurrentTab(function(tabId) {
        chrome.tabs.update(tabId, { url: 'http://www.bbc.co.uk/news' } );
        // history.go(-1);
        window.close();
      });
    };

    console.log('Buying more time...');
    $.ajax({
      url: ajax_url,
      type: 'post',
      data: ajax_data,
      headers: ajax_headers,
      dataType: 'json', // for expected response
      contentType: "application/json" // for request
    });

    // For demo purposes, assume success!
    setTimeout(ajax_success, 1000);

    // $.post(ajax_url, ajax_data, ajax_config).done(function() {
    //   setRemainingTime(10); // set to 10 seconds
    //   initializeClock();
    //   processCurrentTab(function(tabId) {
    //     chrome.tabs.update(tabId, { url: 'https://www.google.com/' } );
    //     window.close();
    //   });
    // }).fail(function(error) {
    //   console.log(`Error from server`);
    // });

  });
});
