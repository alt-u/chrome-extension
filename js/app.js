Settings = function() {
  this.init();
  return this;
}

Settings.prototype = {
  all: {},

  init: function() {
    this.load();
  },

  load: function() {
    this.all = localStorage['settings'] ? JSON.parse(localStorage['settings']) : {};
  },

  save: function() {
    localStorage['settings'] = JSON.stringify(this.all);
  }
}

UrlSet = function() {
  this.init();
  return this;
}

UrlSet.prototype = {
  urls: [],
  index: 0,

  init: function() {
    this.load();
  },

  load: function() {
    this.urls = localStorage['urls'] ? JSON.parse(localStorage['urls']) : [];
    this.index = localStorage['index'] ? JSON.parse(localStorage['index']) : 0;
  },

  save: function() {
    localStorage['urls'] = JSON.stringify(this.urls); 
    localStorage['index'] = this.index; 
  },

  urlExists: function(url) {
    return (this.urls.indexOf(url) !== -1);
  },

  create: function(url) {
    if (!this.urlExists(url)) {
      url.id = this.index++;
      this.urls.push(url);
      this.save();
    }
  },

  delete: function(url) {
    var self = this;
    this.urls.forEach(function(t, i) {
      if (t == url) {
        self.urls.splice(i, 1);
      }
    });
    this.save();
  }
}

// blocks access to sites if blocking is enabled
function shouldBlockSite(tabId, changeInfo, tab) {
  settings.load();
  urlSet.load();
  if (urlSet.urls.indexOf(getHostname(tab.url)) !== -1) {
    blockSite(tabId);
  }
}

// block the page
function blockSite(tabId) {
  chrome.tabs.update(tabId, {url: 'blocked.html'});
}

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
  urlSet.load();
  settings.load();

  populateBlockedUrls();

  var grace_time = 10; // seconds
  var deadline = new Date(Date.parse(new Date()) + grace_time * 1000);
  initializeClock('countdown-clock', deadline);

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
});

function getTimeRemaining(endtime) {
  var t = Date.parse(endtime) - Date.parse(new Date());
  var seconds = Math.floor((t / 1000) % 60);
  var minutes = Math.floor((t / 1000 / 60) % 60);
  var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
  var days = Math.floor(t / (1000 * 60 * 60 * 24));
  return {
    'total': t,
    'days': days,
    'hours': hours,
    'minutes': minutes,
    'seconds': seconds
  };
}

function initializeClock(id, endtime) {
  var clock = document.getElementById(id);

  if (!clock) {
    return; // running in background, so no DOM available!
  }

  var hoursSpan = clock.querySelector('.hours');
  var minutesSpan = clock.querySelector('.minutes');
  var secondsSpan = clock.querySelector('.seconds');

  function updateClock() {
    var t = getTimeRemaining(endtime);

    hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
    minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
    secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

    if (t.total <= 0) {
      clearInterval(timeinterval);
    }
  }

  updateClock();
  var timeinterval = setInterval(updateClock, 1000);
}

var getLocation = function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
};

var getHostname = function(href) {
  var loc = getLocation(href);
  return loc.hostname;
}

var settings = new Settings();
var urlSet = new UrlSet();

chrome.tabs.onUpdated.addListener(shouldBlockSite);
