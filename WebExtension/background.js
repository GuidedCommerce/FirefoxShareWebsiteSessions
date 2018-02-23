var LASTURL = "";

/*
Change icon for the currently active tab, whenever background.js is run.
*/
var gettingActiveTab = browser.tabs.query({
    active: true,
    currentWindow: true
});
gettingActiveTab.then((tabs) => {
    showOrHideIcon();
});

/*
Change icon for the currently active tab, whenever the user navigates.
*/
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!changeInfo.url) {
        return;
    }
    var gettingActiveTab = browser.tabs.query({
        active: true,
        currentWindow: true
    });
    gettingActiveTab.then((tabs) => {
        if (tabId == tabs[0].id) {
            showOrHideIcon();
        }
    });
});

/*
Change icon for the currently active tab, whenever a new tab becomes active.
*/
browser.tabs.onActivated.addListener((activeInfo) => {
    showOrHideIcon();

});


function showOrHideIcon() {
    var gettingActiveTab = browser.tabs.query({
        active: true,
        currentWindow: true
    });
    gettingActiveTab.then((tabs) => {
        var seperator = "#";
        let tab = tabs.pop();
        if (tab.url.indexOf("_cookies_") != -1) {
            // already added
            browser.pageAction.hide(tab.id);
            return;
        } else {
            browser.pageAction.show(tab.id);
        }
    });


}

/*
On page action click
*/
browser.pageAction.onClicked.addListener(() => {

    var gettingActiveTab = browser.tabs.query({
        active: true,
        currentWindow: true
    });
    gettingActiveTab.then((tabs) => {

        //browser.tabs.update({url: CATGIFS});
        let tab = tabs.pop();
        var seperator = "#";
        if (tab.url.indexOf("_cookies_") != -1) {
            // already added
            return;
        }
        if (tab.url.indexOf("#") != -1) {
            seperator = "&";
        }

        //alert("Session data has been set. Now send this tab to your other device running Firefox and click this button again.");

        var gettingAllCookies = browser.cookies.getAll({
            url: tab.url
        });
        gettingAllCookies.then((cookies) => {

            //  console.log(JSON.stringify(cookies));

            LASTURL = tab.url + seperator + "_cookies_" + encodeURI(JSON.stringify(cookies));
            var updating = browser.tabs.update({
                url: LASTURL
            });

        });

    });



});

function resumeSession(tabId) {
    console.log("resume session called.");

    var gettingActiveTab = browser.tabs.query({
        currentWindow: true
    });
    gettingActiveTab.then((tabs) => {

        if (tabId !== undefined) {
            // get the right tab
            for (i = 0; i < tabs.length; i++) {
                if (tabs[i].id === tabId) {
                    tab = tabs[i];
                }
            }
        } else {
            // default to active tab
            for (i = 0; i < tabs.length; i++) {
                if (tabs[i].active) {
                    tab = tabs[i];
                }
            }
        }


        if (tab.url.indexOf("_cookies_") != -1) {
            //TODO: only do this for the current site
            const url = new URL(tab.url);
            browser.browsingData.removeCookies({hostnames:[url.hostname]});

            if (tab.url.indexOf("#_cookies_") != -1) {
                seperator = "#";
            } else {
                seperator = "&";
            }

            var encodedCookiesString = tab.url.split("_cookies_")[1];
            var decodedCookiesString = decodeURI(encodedCookiesString);
            console.log(decodedCookiesString);
            var cookiesJSON = JSON.parse(decodedCookiesString);

            for (i = 0; i < cookiesJSON.length; i++) {
                cookieToAdd = cookiesJSON[i];
                cookieToAdd.url = tab.url.split(seperator + "_cookies")[0];
                console.log(cookieToAdd);
                if (cookieToAdd.hasOwnProperty('hostOnly')) {
                    delete cookieToAdd.hostOnly;
                }
                if (cookieToAdd.hasOwnProperty('session')) {
                    delete cookieToAdd.session;
                }
                if (cookieToAdd.hasOwnProperty('firstPartyDomain')) {
                    delete cookieToAdd.firstPartyDomain;
                }
                if (cookieToAdd.hasOwnProperty('storeId')) {
                    delete cookieToAdd.storeId;
                }

                console.log(cookieToAdd);

                browser.cookies.set(cookieToAdd);
            }


            //var updating = browser.tabs.update({url: tab.url.split(seperator + "_cookies_")[0]});

        }



    });


}

function logOnBefore(details) {
    console.log(details);
    console.log("onBeforeNavigate to: " + details.url);
    return;

    if (details.url === LASTURL) {
        return;
    } else if (details.url.indexOf("_cookies") != -1) {
        resumeSession();
    }
}

browser.webNavigation.onBeforeNavigate.addListener(logOnBefore);


function handleUpdated(tabId, changeInfo, tabInfo) {

    if (changeInfo.hasOwnProperty('url') && changeInfo.url.indexOf("_cookies_") != -1) {
        console.log("Tab: " + tabId +
            " URL changed to " + changeInfo.url);
    } else {
        console.log("ret1");
        return;

    }

    if (changeInfo.url === LASTURL) {
        return;
    } else if (changeInfo.url.indexOf("_cookies") != -1) {
        resumeSession(tabId);

        if (changeInfo.url.indexOf("#_cookies_") != -1) {
            seperator = "#";
        } else {
            seperator = "&";
        }


        var updating = browser.tabs.update(tabId, {
            url: changeInfo.url.split(seperator + "_cookies_")[0]
        });
    }



}

browser.tabs.onUpdated.addListener(handleUpdated);
