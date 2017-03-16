var NP = {
    init: function() {
        chrome.browserAction.onClicked.addListener(this.inject), chrome.runtime.onMessage.addListener(function(a, b, c) {
            if ("take_screen_shot" === a.method) NP.screenShot(c);
            else if ("get_pixel_color" === a.method) {
                var d = a.point;
                NP.getPixelColor(d, c)
            } else "save_data" === a.method ? NP.saveData(a.config) : "get_data" === a.method && NP.getData(c);
            return !0
        })
    },
    getPixelColor: function(a, b) {
        chrome.tabs.captureVisibleTab(null, null, function(c) {
            var d = document.createElement("canvas"),
                e = d.getContext("2d"),
                f = new Image;
            document.documentElement.appendChild(d), f.src = c, f.onload = function() {
                d.width = f.naturalWidth, d.height = f.naturalHeight, e.drawImage(f, 0, 0);
                var c = e.getImageData(0, 0, d.width, d.height),
                    g = 4 * (a.y * c.width + a.x),
                    h = c.data;
                if ("function" == typeof b) {
                    var i = {
                        r: h[g],
                        g: h[g + 1],
                        b: h[g + 2],
                        a: h[g + 3]
                    };
                    document.documentElement.removeChild(d), b(i)
                }
            }
        })
    },
    saveData: function(a) {
        try {
            localStorage.setItem("config", JSON.stringify(a))
        } catch (b) {}
    },
    getData: function(a) {
        var b = localStorage.getItem("config"),
            c = null;
        try {
            c = JSON.parse(b)
        } catch (d) {}
        a(c)
    },
    inject: function() {
        chrome.tabs.insertCSS(null, {
            file: "css/main.min.css"
        }, function() {
            if (chrome.extension.lastError) {
                chrome.extension.lastError.message;
                alert("We are sorry, but chrome reserved pages (new tab, extensions, etc) and chrome web store are not supported. Please try another page.")
            }
            chrome.tabs.executeScript(null, {
                file: "js/inject.js"
            })
        })
    },
    screenShot: function(a) {
        chrome.tabs.captureVisibleTab(null,{format : "png"},function(b) {

            var username = "prasoon.rana@prudlelabs.com";
            var password = "Ladakh2012";
            var issueKeyid;
            var issue ={
                            "fields": {
                                "project":
                                { 
                                    "key": "PRUD"
                                },
                                "summary": "Prudle QA test issue",
                                "description": "Creating an issue to test Prudle QA",
                                "issuetype": {
                                    "name": "Bug"
                                }       
                            }
                        };
            $.ajax({
                url: "https://prudlelabs.atlassian.net/rest/api/2/issue/",
                type: 'POST', 
                data : JSON.stringify(issue),
                dataType: "json", 
                contentType: "application/json",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader ("Authorization", "Basic " + btoa(username + ":" + password));
                },
                success: function(data) {

                    issueKeyid = data.key;
                    $.ajax({
                        url: "https://prudlelabs.atlassian.net/rest/api/2/issue/"+issueKeyid+"/attachments",
                        type: 'POST', 
                        data : b,
                        contentType: 'multipart/form-data',
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader ("Authorization", "Basic " + btoa(username + ":" + password));
                            xhr.setRequestHeader ("X-Atlassian-Token:no-check");
                        },
                        success: function(data) {
                            alert("issue created");
                            
                        }
                    });
                }
            });
        });
        // chrome.tabs.captureVisibleTab(function(b) {
        //     var c = chrome.extension.getURL("bugreport.html");
        //     chrome.tabs.query({
        //         url: c
        //     }, function(d) {
        //         d.length ? chrome.tabs.update(d[0].id, {
        //             active: !0
        //         }, Function.prototype.bind.call(NP.updateScreenshot, NP, b, a, 0)) : chrome.tabs.create({
        //             url: c
        //         }, Function.prototype.bind.call(NP.updateScreenshot, NP, b, a, 0))
        //     })
        // })
    },
    updateScreenshot: function(a, b) {
        var c = arguments[2];
        "undefined" != typeof c && null !== c || (c = 0), c > 10 || chrome.runtime.sendMessage({
            method: "update_url",
            url: a
        }, function(d) {
            d && d.success || window.setTimeout(Function.prototype.bind.call(NP.updateScreenshot, NP, a, b, ++c), 300)
        })
    }
};
NP.init();