(function background() {
    var remaining;
    var tabId = false;
    // listen to event if request send from popup.js
    chrome.runtime.onMessage.addListener(function (request) {
        if (request.check_run_change === true) {
            main();
        }
    });
    main();

    /**
     * main function
     * @returns {Promise<void>}
     */
    async function main() {
        try {
            const TOOLBAR_STATUS = await checkAlexaToolbar("cknebhggccemgcnbidipinkifmmegdel");
            const STORAGE_DATA = await getData(['api_key', 'status', 'api_error']);
            if (STORAGE_DATA.api_key && STORAGE_DATA.status === true && TOOLBAR_STATUS.enabled === true) {
                let response = await fetch(`http://boostano.ir/api?api_key=${STORAGE_DATA.api_key}`).then(resp => resp.json());
                if (response.request.request_status === true) {
                    setError('');
                    let timer = Number(response.timer);
                    let site_list = response.request.site_list;

                    let tabStatus = await getTab(tabId);
                    if (tabStatus === 100) {
                        let tab = await createTab(site_list);
                        tabId = tab.id;
                    } else if (tabStatus === 200) {
                        await updateTab(tabId, site_list);
                    }
                    if (!isNaN(timer)) {
                        let end = (new Date).getTime() + timer * 1000;
                        setBatchText(end);
                        setTimeout(main,timer * 1000);
                    } else {
                        let end = (new Date).getTime() + 60 * 1000;
                        setBatchText(end);
                        setTimeout(main,60 * 1000);
                    }
                } else {
                    setError(response.error.message);
                }
            } else {
                if (STORAGE_DATA.status === false && TOOLBAR_STATUS.enabled !== true) {
                    var errorMsg = 'For activate this extension, first you must enable Alexa Traffic Rank then click run button on top toolbar to start!';
                } else if (STORAGE_DATA.status === false && TOOLBAR_STATUS.enabled === true) {
                    var errorMsg = 'Click on Run button on top toolbar to start!';
                } else if (STORAGE_DATA.status === true && TOOLBAR_STATUS.enabled !== true) {
                    var errorMsg = 'Alexa extension is not install or enable';
                }
                setError(errorMsg);
            }
        } catch (err) {
            setError(err);
        }
    }

    /**
     * set batch text
     * @param endTime
     */
    function setBatchText(endTime) {
        remaining = setInterval(function () {
            let now = (new Date).getTime();
            let m = Math.floor((endTime - now) / 1000);
            if (m < 0) {
                m = 0
            }
            chrome.browserAction.setBadgeText({text: '' + m});
            chrome.browserAction.setBadgeBackgroundColor({color: "gray"});
        }, 1000);
    }

    /**
     * set error in the storage if error set
     * @param lastError
     */
    function setError(lastError) {
        clearBackgroundVariable();
        if (lastError) {
            setData({'status': false, 'api_error': lastError.toString()});
            chrome.browserAction.setBadgeBackgroundColor({color: "black"});
            chrome.browserAction.setBadgeText({text: 'Off'});
        } else {
            clearStorage(['api_error']);
        }
    }

    /**
     *  check alexa toolbar status
     * @param chromeToolbarId|string
     * @returns {Promise<any>}
     */
    function checkAlexaToolbar(chromeToolbarId) {
        return new Promise((resolve, reject) => {
            chrome.management.get(chromeToolbarId, function (response) {
                if (chrome.runtime.lastError) {
                    reject('Alexa toolbar not installed');
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * return array of stored items in local storage
     * @param arr|array
     * @returns {Promise<any>}
     */
    function getData(arr) {
        return new Promise(resolve => {
            chrome.storage.local.get(arr, function (items) {
                resolve(items);
            });
        })
    }

    /**
     * remove array of storage items
     * @param arr|array
     */
    function clearStorage(arr) {
        chrome.storage.local.remove(arr)
    }

    /**
     * store items in local storage
     * @param obj|object
     */
    function setData(obj) {
        chrome.storage.local.set(obj);
    }


    /**
     * get tab status
     * @param tabId
     * @returns {Promise<any>}
     */
    function getTab(tabId) {
        return new Promise(resolve => {
            if (tabId === false) {
                resolve(100);
            }
            chrome.tabs.get(tabId, function () {
                if (chrome.runtime.lastError) {
                    resolve(100);
                } else {
                    resolve(200);
                }
            });
        });
    }

    /**
     * create tab in reject response of getTab() function
     * @param url
     * @returns {Promise<any>}
     */
    function createTab(url) {
        return new Promise(resolve => {
            chrome.tabs.create({url: url, active: false}, function (tab) {
                resolve(tab);
            })
        })
    }

    /**
     * update tab in resolve response of getTab() function
     * @param tabId
     * @param url
     * @returns {Promise<any>}
     */
    function updateTab(tabId, url) {
        return new Promise(resolve => {
            chrome.tabs.update(tabId, {url: url}, function (response) {
                resolve(response);
            });
        })
    }

    /**
     * clear interval
     */
    function clearBackgroundVariable() {
        clearInterval(remaining);
    }
})();