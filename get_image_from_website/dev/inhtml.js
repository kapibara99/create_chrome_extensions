//dev
var testResult;


// get html
// utilize
var c = chrome;
var ws = c.windows;
var tbs = c.tabs;

document.getElementById('js-btn').addEventListener("click",function(e){
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      mes:"testだよ"
    });
  });
  // setTextAreaUrlAndTitle();
});
function setTextAreaUrlAndTitle() {

  try {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log("t");
      // since only one tab should be active and in the current window at once
      // the return variable should only have one entry
      var activeTab = tabs[0];
      var activeTabId = activeTab.id; // or do whatever you need
      console.log(activeTabId.url);
   });
  } catch (e) {
    console.log(e);
  }
}