(function popup($) {

    var checkRun = document.querySelector("#check_run");
    var saveButton = document.querySelector("#save_key");
    var updatePopupHtmlFirstTime = false;

    async function updatePopupHtml() {
        const POPUP_DATA = await getData(['status', 'api_key', 'point', 'name', 'api_error']);
        if (POPUP_DATA["status"] === true || POPUP_DATA["status"] === false) {
            document.querySelector("#check_run").checked = POPUP_DATA["status"];
        }
        if (POPUP_DATA["api_key"]) {
            document.querySelector("#api_key").value = POPUP_DATA["api_key"];
        }
        if (POPUP_DATA["point"]) {
            document.querySelector("#point").innerHTML = POPUP_DATA["point"];
        }
        if (POPUP_DATA["name"]) {
            document.querySelector("#username").innerHTML = POPUP_DATA["name"];
        }
        if (POPUP_DATA["api_error"]) {
            $("#error-summery").show();
            document.querySelector("#errors").innerHTML = POPUP_DATA["api_error"];
        } else {
            $("#error-summery").hide();
        }

    }

    function getData(arr) {
        return new Promise(resolve => {
            chrome.storage.local.get(arr, function (items) {
                resolve(items);
            });
        })
    }

    function setData(obj) {
        chrome.storage.local.set(obj);
    }

    function callApi(api_key) {
        $.get(
            "http://luya.ir/api", {
                api_key: api_key,
            }
        ).done(function (response) {
            if (response.error.message) {
                setData({
                    'point': response.point,
                    'name': response.name,
                    'api_key': api_key,
                    'api_error': response.error.message
                });
            } else {
                setData({
                    'point': response.point,
                    'name': response.name,
                    'api_key': api_key
                });
            }
        }).fail(function () {
            setData({'api_error': 'Network Failed'});
        });
    }

    function checkAlexaToolbar(chromeToolbarId) {
        chrome.management.get(chromeToolbarId, function (response) {
            if (response.enabled !== true) {
                $("#alexa-toolbar").append('<div class="alert alert-success alert-dismissible" id="alexa-toolbar"><h4>Alexa Traffic Rank</h4><p>For proper your must install Alexa Traffic Rank extension first</p><div class="btn-list"><a href="https://chrome.google.com/webstore/detail/alexa-traffic-rank/cknebhggccemgcnbidipinkifmmegdel?hl=en" class="btn btn-success" type="button" target="_blank">Yes, install</a> </div> </div>');
            }
        });
    }

    async function initPopupCheck() {
        const DATA = await getData(['api_key']);
        if (DATA['api_key']) {
            callApi(DATA['api_key']);
        }
        // if updatePopupHtml not called before
        if (updatePopupHtmlFirstTime === false) {
            updatePopupHtml()
        }
        checkAlexaToolbar("cknebhggccemgcnbidipinkifmmegdel");
    }

    initPopupCheck();

    // trigger change event when status of extension in popup updated
    checkRun.addEventListener('change', function () {
        setData({'status': this.checked});
    });

    // trigger click event when save button click
    saveButton.addEventListener('click', function () {
        let api_key = document.querySelector("#api_key").value;
        callApi(api_key);
    });

    // change icon when ajax call start and then update icon when ajax success
    $(document).ajaxStart(function () {
        $("#save-icon").attr('class', 'fa fa-spinner fa-spin');
    }).ajaxSuccess(function () {
        $("#save-icon").attr('class', 'fe fe-activity');
    });

    // add listener for changes in storage
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (namespace === 'local') {
            updatePopupHtml();
            updatePopupHtmlFirstTime = true;
        }
    });

})(jQuery);
