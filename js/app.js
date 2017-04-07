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
  $('#blocked_sites li').each(function(i) {
    $(this).click(function() {
      urlSet.delete($(this).data('url'));
      populateBlockedUrls();
    });
  });
}

// displays the list of our blocked sites
function populateBlockedUrls() {
  var urlList = $("<ul class='blocked_list'></ul>");
  for (var i = 0; i < urlSet.urls.length; i++) {
    urlList.append("<li data-url='" + urlSet.urls[i] + "'>" + urlSet.urls[i] + '</li>');
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

  // handler to add the current site
  $('#block_current_site').click(function() {
    chrome.tabs.getSelected(null, function(tab) {
      urlSet.create(getHostname(tab.url));
      populateBlockedUrls();
    });

    window.close();
  });
});

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
