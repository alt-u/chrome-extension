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

function urlOnBlacklist(url) {
  urlSet.load();
  return urlSet.urls.indexOf(getHostname(url)) !== -1
}

function processCurrentTab(callback) {
  chrome.tabs.query(
    { active: true, windowType: "normal", currentWindow: true },
    function(d) { callback(d[0].id, null, d[0]); }
  )
}

function shouldBlockCurrentSite() {
  processCurrentTab(shouldBlockSite);
}

function shouldBlockSite(tabId, changeInfo, tab) {
  console.log('shouldBlockSite?');
  console.log("localStorage['time_remaining']", localStorage['time_remaining']);
  if (!localStorage['time_remaining'] || localStorage['time_remaining'] > 0) {
    console.log('TIME REMAINS!');
    return;
  }

  if (urlOnBlacklist(tab.url)) {
    blockSite(tabId);
  }
}

// block the page
function blockSite(tabId) {
  chrome.tabs.update(tabId, {url: 'blocked.html'});
}

function getTimeRemaining(endtime) {
  var t = Date.parse(endtime) - Date.parse(new Date());

  return formatTimeRemaining(t / 1000);
}

function formatTimeRemaining(secs) {
  var seconds = Math.floor(secs % 60);
  var minutes = Math.floor((secs / 60) % 60);
  var hours = Math.floor((secs / (60 * 60)) % 24);
  var days = Math.floor(secs / (60 * 60 * 24));
  return {
    'total': secs * 1000,
    'days': days,
    'hours': hours,
    'minutes': minutes,
    'seconds': seconds
  };
}

function setRemainingTime(secs) {
  if (secs < 0) { return }
  localStorage['time_remaining'] = secs;
  refreshRemainingTimeUi(secs);
}

function refreshRemainingTimeUi(secs) {
  console.log('refreshRemainingTimeUi...');
  chrome.browserAction.setBadgeText({ text: '' + secs });

  var clock = document.getElementById('countdown-clock');
  if (clock) {
    var t = formatTimeRemaining(secs);
    // avoid updating UI if running in background (where no DOM available)!
    clock.querySelector('.hours').innerHTML = ('0' + t.hours).slice(-2);
    clock.querySelector('.minutes').innerHTML = ('0' + t.minutes).slice(-2);
    clock.querySelector('.seconds').innerHTML = ('0' + t.seconds).slice(-2);
  }
}

function initializeClock() {
  var grace_time = 10; // seconds

  var time_remaining = (localStorage['time_remaining'] == null) ? grace_time : localStorage['time_remaining'];

  var endtime = new Date(Date.parse(new Date()) + time_remaining * 1000);


  function updateClock() {
    var t = getTimeRemaining(endtime);

    setRemainingTime(t.total / 1000);

    if (t.total <= 0) {
      shouldBlockCurrentSite();
    }

    // Run next iteration if we're still a blacklisted site
    processCurrentTab(function(tabId, _, tab) {
      if (urlOnBlacklist(tab.url)) {
        setTimeout(updateClock, 1000);
      }
    });
  }

  updateClock();
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

function tabChanged(tabId, changeInfo, tab) {
  shouldBlockSite(tabId, changeInfo, tab);
  if (urlOnBlacklist(tab.url)) {
    initializeClock();
  }
}

chrome.tabs.onUpdated.addListener(tabChanged);

urlSet.load();
settings.load();
