(function popup($) {
    var checkRun = document.querySelector("#check_run");
    var saveButtom = document.querySelector("#save_key");
    function checkStatus(api_key){
        if(api_key) {
            $.get(
                "http://luya.ir/api", {
                    api_key: api_key,
                }
            ).done(function (response) {
                let obj = response;
                chrome.storage.local.set({'point': W.point, 'name': obj.name, 'api_key': api_key});
                document.querySelector("#point").innerHTML = obj.point;
                document.querySelector("#username").innerHTML = obj.name;
            }).fail(function () {
                chrome.storage.local.set({'api_error': 'Network Failed'});
            });
            chrome.management.get("cknebhggccemgcnbidipinkifmmegdel", function (response) {
                console.log('majid:'+response.enabled);
                if (response.enabled === true) {
                    console.log('test:'+response.enabled);
                    $("#alexa-toolbar").hide();
                }
            });
        }
    };

    // (1) when popup click first call checkStatus
    chrome.storage.local.get(['api_key'], function (items) {
        checkStatus(items['api_key']);
    });

    // (2) update popup properties after call checkStatus with update storage
    updatePopup();

    function updatePopup(){
        chrome.storage.local.get(['status', 'api_key','point','name','api_error'], function (items) {
            if (items["status"]===true || items["status"]===false) {
                document.querySelector("#check_run").checked = items["status"];
            }
            if (items["api_key"]) {
                document.querySelector("#api_key").value = items["api_key"];
            }
            if (items["point"]) {
                document.querySelector("#point").innerHTML = items["point"];
            }
            if (items["name"]) {
                document.querySelector("#username").innerHTML = items["name"];
            }
            if (items["api_error"]) {
                $("#error-summery").show();
                document.querySelector("#errors").innerHTML = items["api_error"];
            }else{
                $("#error-summery").hide();
            }
        });
    };

    // trigger change event when status of extension in popup updated
    checkRun.addEventListener('change', function () {
        chrome.storage.local.set({'status': this.checked});
    });

    // trigger click event when save button click
    saveButtom.addEventListener('click',function () {
        let api_key = document.querySelector("#api_key").value;
        $.get(
            "http://luya.ir/api", {
                api_key: api_key,
            }
        ).done(function (response) {
            let obj = response;
            chrome.storage.local.set({'point': obj.point, 'name': obj.name, 'api_key': api_key});
        }).fail(function () {
            chrome.storage.local.set({'api_error': 'Network Failed'});
        });
    });

    // add listener for changes in storage
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (namespace === 'local') {
            updatePopup();
        }
    });

    // change icon when ajax call start and then update icon when ajax success
    $(document).ajaxStart(function() {
        $("#save-icon").attr('class', 'fa fa-spinner fa-spin');
    }).ajaxSuccess(function() {
        $("#save-icon").attr('class', 'fe fe-activity');
    });

})(jQuery);
