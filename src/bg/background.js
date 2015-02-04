/*
 //example of using a message handler from the inject scripts
 chrome.extension.onMessage.addListener(
 function (request, sender, sendResponse) {
 //chrome.pageAction.show(sender.tab.id);
 console.log(request, sender, sendResponse);
 sendResponse();
 });
 */

function letsGo(tab) {
    chrome.tabs.executeScript(tab.id, {code: 'typeof(endDraw);'}, function (r) {
        var init = r && r[0].toString() == 'function';

        if (!init) {
            executeScripts(null, [{file: "src/js/jquery.js"}, {file: "src/js/jquery-ui.js"}, {file: "src/js/start.js"}, {file: "src/css/jquery-ui.css"}, {file: "src/css/start.css"}]);
        } else {
            chrome.browserAction.setBadgeText({text: "wait"});
            chrome.tabs.executeScript(tab.id, {code: 'endDraw();'});
        }
    });

    chrome.browserAction.setIcon({path: "icons/save.png", tabId: tab.id});
    chrome.browserAction.setTitle({title: "Generate HTML code", tabId: tab.id});
}

chrome.browserAction.onClicked.addListener(letsGo);
chrome.browserAction.setTitle({title: "Draw bootstrap grid"});

function executeScripts(tabId, injectDetailsArray) {
    function createCallback(tabId, injectDetails, innerCallback) {
        return function () {
            if (/\.css/.test(injectDetails['file'])) {
                chrome.tabs.insertCSS(tabId, injectDetails, innerCallback);
            } else {
                chrome.tabs.executeScript(tabId, injectDetails, innerCallback);
            }
        };
    }

    var callback = null;

    for (var i = injectDetailsArray.length - 1; i >= 0; --i) {
        callback = createCallback(tabId, injectDetailsArray[i], callback);
    }

    if (callback !== null) {
        callback();   // execute outermost function
    }
}

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    chrome.browserAction.setBadgeText({text: ""});
});