// Open game in new tab when extension icon is clicked
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'index.html' });
});
