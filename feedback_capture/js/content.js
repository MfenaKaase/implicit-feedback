let search_results = {};
//Url handler
function getUrlVars(href) {
  var vars = [], hash;
  var hashes = href.slice(href.indexOf("?") + 1).split("&");
  for (var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split("=");
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
  }
  return vars;
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {

    if (request["type"] == 'msg_from_popup') {
      console.log("msg receive from popup");
      sendResponse(search_results);

    }
    return true;

  }
);

/*
 *Save Capture function
 **
 */
var saveCaptureData = {
  //timer id
  timeIntervalID: "",
  init: function () {
    this.loadedTime = Date.now();
    this.newTime = new Date();
    this.openTimeStamp = Math.floor(this.newTime.getTime() / 1000);
    console.log("The time loading is: " + this.openTimeStamp);
    this.setCloseEvent();
    //start counter on page load
    saveCaptureData.startTimeCount();
    this.monitorKeyPress();
    this.monitorClicks();
    this.monitorScroll();
    this.monitorTabVisibility();
    this.CopyPaste();
    this.pageSelectionEvent();
    this.userPrintEvents();
    this.pageSaveEvent();
    this.getIP();
    this.getUserID();
    this.getPageTitle();
    this.getContent();
    this.getLeadingParagraph();

    //Retrieve search query from storage
    chrome.storage.sync.get(["searchQuery"], function (result) {
      saveCaptureData.search_query = result.searchQuery;
      console.log(
        "Search query that brought up this page: " + saveCaptureData.search_query
      );
      // chrome.storage.sync.set({ searchQuery: '' }, function () { });
    });

    //Listen for bookmark and getIP events from background script.
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.type === 'bookmark') {
        if (request.bookmark == 1) {
          saveCaptureData.bookmarked += request.bookmark;
          // console.log("Page bookmarked.");
        }
      } else {
        if (request.bookmark == 1) {
          saveCaptureData.userIP = request.IP;
          // console.log("IP address recorded!");
        }
      }
      sendResponse({ farewell: "goodbye" });
    });
  },

  getSearchQuery: function () {
    lastUrl = window.location.href;
    console.log("URL: " + lastUrl);
    query = String(getUrlVars(lastUrl).q);
    r = query.split('+').join(' ');


    chrome.storage.local.get(['authToken'], function (result) {
      let authToken = result.authToken;

      const myHeaders = new Headers();
      myHeaders.append('Authorization', `Bearer ${authToken}`);

      var requestOptions = {
        method: 'GET',
        redirect: 'follow',
        headers: myHeaders
      };

      console.log(query);
      console.log(authToken);

      fetch(`http://localhost:5000/api/implicit-feedback?query=${query}`, requestOptions)
        .then(response => {
          // Log the raw response before parsing JSON
          console.log(response);
          return response.json();
        })
        .then(results => {
          // Log the parsed JSON data
          console.log('Parsed JSON:', results);
          // Access object properties as needed
          search_results = results.response;
          console.log('Search results:', search_results);
        })
        .catch(error => {
          console.log('Error:', error);
          // chrome.storage.local.remove('authToken', () => {
          //   console.log("user session invalidated");
          // });
        });

    });

    chrome.storage.sync.set({ 'searchQuery': r }, function () {
      console.log("Value is set to " + r);
    });
  },

  userPrintEvents: function () {
    window.addEventListener("afterprint", function (event) {
      ++saveCaptureData.printed_document;
      // console.log("This document just got printed. " + saveCaptureData.printed_document);
    });
  },

  pageSaveEvent: function () {
    document.addEventListener("keydown", function (event) {
      // console.log("Got here.");
      if (event.ctrlKey && event.key == "s") {
        ++saveCaptureData.page_saved;
        console.log('Page saved, record taken.');
      }
    });
  },

  pageSelectionEvent: function () {
    // onselectionchange version
    document.onselectionchange = () => {
      console.log("selection made on page " + document.getSelection());
      ++saveCaptureData.total_text_selections;
      console.log(saveCaptureData.total_text_selections + " selections made.");
    };
  },

  setCloseEvent: function () {
    //Window close listener
    window.addEventListener("beforeunload", function (e) {
      // If you prevent default behavior in Mozilla Firefox prompt will always be shown
      e.preventDefault();
      // Chrome requires returnValue to be set

      var dt = Date.now();
      var d = new Date();
      saveCaptureData.closeTimeStamp = Math.floor(d.getTime() / 1000);
      // console.log("The time at closing is: " + saveCaptureData.closeTimeStamp);

      // if ((saveCaptureData.loadedTime > 0 || dt >= 1000) && saveCaptureData.search_query) {
      //   // save here as null (don't have to save because it's default)

      // }

      saveCaptureData.user_rating = 1;
      saveCaptureData.save();
      e.returnValue = "";
    });
  },

  monitorKeyPress: function () {
    $(parent.document).keypress(function () {
      saveCaptureData.total_key_stroke += 1;
    });
  },

  monitorClicks: function () {
    $(parent.document).click(function () {
      saveCaptureData.total_user_clicks += 1;
    });
  },

  monitorScroll: function () {
    $(parent.document).scroll(function () {
      saveCaptureData.total_user_scroll += 1;
    });
  },

  CopyPaste: function () {
    $(document).ready(function () {
      $(document).bind("copy", function () {
        saveCaptureData.total_copy += 1;
      });
    });
  },

  monitorTabVisibility: function () {
    var hidden = "hidden";

    if (hidden in document) {
      document.addEventListener("visibilitychange", this.onVisibilityChange);
    } else if ((hidden = "mozHidden") in document) {
      document.addEventListener("mozvisibilitychange", this.onVisibilityChange);
    } else if ((hidden = "webkitHidden") in document) {
      document.addEventListener(
        "webkitvisibilitychange",
        this.onVisibilityChange
      );
    } else if ((hidden = "msHidden") in document) {
      document.addEventListener("msvisibilitychange", this.onVisibilityChange);
    } else if ("onfocusin" in document) {
      // IE 9 and lower:
      document.onfocusin = document.onfocusout = this.onVisibilityChange;
    } else {
      // All others:
      window.onpageshow = window.onpagehide = window.onfocus = window.onblur = this.onVisibilityChange;
    }
  },

  onVisibilityChange: function (evt) {
    evt = evt || window.event;

    var v = "visible",
      h = "hidden",
      visiblilty = "",
      evtMap = {
        focus: v,
        focusin: v,
        pageshow: v,
        blur: h,
        focusout: h,
        pagehide: h,
      };

    if (evt.type in evtMap) {
      visiblilty = evtMap[evt.type];
    } else {
      visiblilty = this[h] ? "hidden" : "visible";
    }

    if (visiblilty == "hidden") {
      //stop active time count
      saveCaptureData.stopTimeCount();
    } else {
      //start time count
      saveCaptureData.startTimeCount();
    }
  },

  //stop timer
  stopTimeCount: function () {
    clearInterval(saveCaptureData.timeIntervalID);
    // console.log("cleared..");
  },

  //start timer
  startTimeCount: function () {
    saveCaptureData.timeIntervalID = setInterval(function () {
      saveCaptureData.active_time_counter++;
      console.log(saveCaptureData.active_time_counter);
    }, 1000);
  },

  getIP: async function () {
    try {
      const response = await fetch("https://api.hostip.info/get_html.php");

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.text();
      const hostipInfo = responseData.split("\n");

      // console.log(hostipInfo);

      for (let i = 0; i < hostipInfo.length; i++) {
        const ipAddress = hostipInfo[i].split(":");
        if (ipAddress[0] === "IP") {
          let IP = ipAddress[1].trim();
          saveCaptureData.userIP = IP;
          return IP;
        }
      }

      return false;
    } catch (error) {
      // console.error("Error fetching IP:", error);
      return false;
    }
  },

  getUserID: function () {
    chrome.storage.local.get(["authToken"]).then((result) => {
      if (!result.authToken) {
        console.error("No auth token found in storage.");
        return;
      }
      saveCaptureData.token = result.authToken;
      fetch("http://localhost:5000/api/user", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${result.authToken}`,
          "Content-Type": "application/json"
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(data => {
          if (data && data.id) {
            chrome.storage.local.set({ implicit_feedback_ID: data.id }).then(() => {
              saveCaptureData.userID = data.id;
              console.log("User ID is set to: " + data.id);
            });
          } else {
            console.error("Failed to fetch user ID.");
          }
        })
        .catch(error => {
          console.error("There was a problem with the fetch operation:", error);
          chrome.storage.local.remove('authToken', () => {
            console.log("user session invalidated");
          });
        });
    });
  },

  getPageTitle: function () {
    saveCaptureData.pageTitle = document.title;
  },

  getContent: function () {
    saveCaptureData.content = document.body.innerText;
    console.log(saveCaptureData.content);
  },
  getLeadingParagraph: async function () {

    let paragraphs = document.querySelectorAll('body p');

    let meaningfulParagraph = await findMeaningfulParagraph(paragraphs);

    if (paragraphs) {
      saveCaptureData.leadingParagraph = meaningfulParagraph;
    } else {
      console.log("No meaningful paragraph found.");
    }

  },

  //Save captured data
  save: function () {
    // console.log('data saving function was called.');
    var data = {
      total_user_clicks: this.total_user_clicks,
      total_mouse_movement_x: this.total_mouse_movement_x,
      total_mouse_movement_y: this.total_mouse_movement_y,
      total_user_scroll: this.total_user_scroll,
      user_rating: this.user_rating,
      total_key_stroke: this.total_key_stroke,
      total_active_time: this.active_time_counter,
      total_mouse_distance: this.total_mouse_distance,
      total_mouse_speed: this.total_mouse_speed,
      url: document.location.href,
      userIP: this.userIP,
      total_copy: this.total_copy,
      openTimeStamp: this.openTimeStamp,
      closeTimeStamp: this.closeTimeStamp,
      velocity_time_count: this.velocity_time_count,
      average_mouse_speed: this.average_mouse_speed,
      total_text_selections: this.total_text_selections,
      bookmarked: this.bookmarked,
      printed_document: this.printed_document,
      page_saved: this.page_saved,
      search_query: this.search_query,
      user_ID: this.userID,
      pageTitle: this.pageTitle,
      leadingParagraph: this.leadingParagraph,
      cohort: this.cohort,
      content: this.content,
      token: this.token
    };

    console.log(data);
    // chrome.runtime.sendMessage({type: 'save_data', payload: data});
    $.ajax({
      type: "POST",
      url: "http://localhost:5000/api/implicit-feedback",
      dataType: "json",
      data: data,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      success: function (data) {
        if (data.success == true) {
          console.log("Captured user activity saved.");
        }
      },
      error: function (xhr, status, error) {
        var errorMessage = xhr.status + ": " + xhr.statusText;
        console.log(errorMessage);
      }
    });


  },

  user_id: 0,
  total_copy: 0,
  userIP: '',
  loadedTime: -1,
  total_user_clicks: 0,
  total_mouse_movement_x: 0,
  total_mouse_movement_y: 0,
  total_user_scroll: 0,
  user_rating: 0,
  total_key_stroke: 0,
  total_active_time: 0,
  active_time_counter: 0,
  total_mouse_distance: 0,
  total_mouse_speed: 0,
  url: '',
  openTimeStamp: 0,
  closeTimeStamp: 0,
  velocity_time_count: 0,
  average_mouse_speed: 0,
  total_text_selections: 0,
  bookmarked: 0,
  printed_document: 0,
  page_saved: 0,
  search_query: '',
  userID: '',
  pageTitle: '',
  leadingParagraph: '',
  cohort: '',
  token: '',
  content: ''
};

const excludedDomains = /(facebook|twitter|localhost|chat\.openai|msgoba|35\.221\.213\.87|namecheap|^https?:\/\/(www\.)?google\.com)/i;

if (excludedDomains.test(window.location.href)) {
  // console.log("capture won't work here.");
  saveCaptureData.getSearchQuery();
} else {
  saveCaptureData.init();
}

async function findMeaningfulParagraph(paragraphs) {
  for (var i = 0; i < paragraphs.length; i++) {
    var trimmedText = paragraphs[i].textContent.trim();
    if (trimmedText.length >= 200) {
      return trimmedText;
    }
  }
  // Return null if no meaningful paragraph is found
  return null;
}
