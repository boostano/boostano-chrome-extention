var myInterval;
var tabId = false;
var now;
var end;
var remaining;
var m;
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'local') {
        requestApi();
    }
});
requestApi();

function requestApi() {
    chrome.management.get("cknebhggccemgcnbidipinkifmmegdel", function (resp) {
        chrome.storage.local.get(['api_key', 'status', 'api_error'], function (items) {
            var status = items.status, api_key = items.api_key,api_error = items.api_error ;
            if (api_key && status === true && resp.enabled === true) {
                $.get(
                    "http://luya.ir/api", {
                        api_key: api_key,
                    }
                ).done(function (response) {
                    if (response.request.request_status === true) {
                        chrome.storage.local.remove('api_error');
                        var timer = Number(response.timer),site_list = response.request.site_list;
                        !isNaN(timer) ? setIntervalRequestApi(site_list,timer):setIntervalRequestApi(site_list,60);
                    } else {
                        items.api_error ? setError(api_error): setError();
                    }
                }).fail(function (err) {
                    clearVariables(err);
                });
            } else {
                if( status===false && resp.enabled !== true) {
                    var errorMsg = 'Extension is not active and alexa extension is not install or enable';
                }else if(status===false && resp.enabled === true){
                    var errorMsg = 'Extension is not active';
                }else if(status===true && resp.enabled !== true){
                    var errorMsg = 'Alexa extension is not install or enable';
                }
                chrome.storage.local.set({'status': false});
                clearVariables(errorMsg);
            }
        });
    });
}

function setIntervalRequestApi(url,apiTime) {
    if (tabId === false) {
        chrome.tabs.create({url: url}, function (tab) {
            tabId = tab.id;
        })
    } else {
        chrome.tabs.get(tabId, function () {
            if (chrome.runtime.lastError) {
                chrome.tabs.create({url: url}, function (tab) {
                    tabId = tab.id;
                })
            } else {
                chrome.tabs.update(tabId, {url: url});
            }
        });
    }
    end = (new Date).getTime() + apiTime*1000;
    clearBackgroundVariable();
    setBatchText(end);
    myInterval = setInterval(requestApi, apiTime * 1000);
}
function setBatchText(endTime) {
    remaining = setInterval(function () {
        now = (new Date).getTime();
        m = Math.floor(( endTime - now ) / 1000);
        if(m < 0){
            m = 0
        }
        chrome.browserAction.setBadgeText({text: '' + m});
        chrome.browserAction.setBadgeBackgroundColor({color: "gray"});
    }, 1000);
}
function setError(lastError = false) {
    clearBackgroundVariable();
    if(lastError === false){
        chrome.storage.local.set({'api_error': 'Your api is not active'});
    }else{
        chrome.storage.local.set({'api_error': lastError.toString() + '\n Your api is not active'});
    }
}
function clearVariables(err) {
    clearBackgroundVariable();
    chrome.browserAction.setBadgeBackgroundColor({color: "black"});
    chrome.browserAction.setBadgeText({text: 'Off'});
    (typeof err ==='string' ? chrome.storage.local.set({'api_error': err}) : chrome.storage.local.set({'api_error': 'Network Failed'}));
}
function clearBackgroundVariable() {
    clearInterval(remaining);
    clearInterval(myInterval);
}

