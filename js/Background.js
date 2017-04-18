
var BG = {
    init: function() {
         chrome.runtime.onMessage.addListener(function(a, b, c) {
            if ("openJiraModal" === a.method){ BG.openJiraModal(c)}
            else if ("takeScreenShotAndSave" === a.method){ BG.takeScreenShotAndSave()}
            else if ("createIssue" === a.method){ BG.createIssue(a.issueData); }
            else if ("get_pixel_color" === a.method) {
                var d = a.point;
                BG.getPixelColor(d, c)
            } else "save_data" === a.method ? BG.saveData(a.config) : "get_data" === a.method && BG.getData(c);
            return !0
        });   
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
            file: "css/main.css"
        }, function() {
            if (chrome.extension.lastError) {
                chrome.extension.lastError.message;
                alert("We are sorry, but chrome reserved pages (new tab, extensions, etc) and chrome web store are not supported. Please try another page.")
            }

            chrome.tabs.executeScript(null, {
                file: "js/inject.js"
            })

        });
    },

    injectBootstrap: function(){
        chrome.tabs.insertCSS(null, {
        file: "css/bootstrap.min.css"
        }, function() {
            if (chrome.extension.lastError) {
                chrome.extension.lastError.message;
                alert("We are sorry, but chrome reserved pages (new tab, extensions, etc) and chrome web store are not supported. Please try another page.")
            }

            chrome.tabs.executeScript(null, {
                file: "js/lib/jquery.js"
            });
            chrome.tabs.executeScript(null, {
                file: "js/lib/bootstrap.min.js"
            });
            
        });
    },

    authorize: function (){

    },
    openJiraModal: function(a) {

            chrome.tabs.insertCSS(null, {
            file: "css/bootstrap.min.css",
            allFrames: true
            }, function() {
                if (chrome.extension.lastError) {
                    chrome.extension.lastError.message;
                    alert("We are sorry, but chrome reserved pages (new tab, extensions, etc) and chrome web store are not supported. Please try another page.")
                }

                 chrome.tabs.executeScript(null, {
                    file: "js/lib/jquery.js",
                    allFrames: true
                });

                chrome.tabs.executeScript(null, {
                    file: "js/lib/bootstrap.min.js",
                    allFrames: true
                });
                
                chrome.tabs.executeScript(null, {
                    file: "js/modal.js"
                });

            });

            // capture screenshot before sending to JIRA 
            chrome.tabs.captureVisibleTab(function(dataURL) {
                chrome.storage.local.set({'screenshotImg': dataURL}, function() {
                    // Notify that we saved.
                    
                });
            });
    },

    takeScreenShotAndSave : function (){
        chrome.tabs.captureVisibleTab(function(dataURL) {
            chrome.storage.local.set({'screenshotImg': dataURL}, function() {
                // Notify that we saved.
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                
                blob = BG.dataURItoBlobAsOctateStream(dataURL);
                url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = "screenshot.png";
                a.click();
                window.URL.revokeObjectURL(url);
                
            });
        });
       
    },
    updateScreenshot: function(a, b) {
        var c = arguments[2];
        "undefined" != typeof c && null !== c || (c = 0), c > 10 || chrome.runtime.sendMessage({
            method: "update_url",
            url: a
        }, function(d) {
            d && d.success || window.setTimeout(Function.prototype.bind.call(BG.updateScreenshot, BG, a, b, ++c), 300)
        })
    },

    dataURItoBlob: function (dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ia], {type:mimeString});
    },

    dataURItoBlobAsOctateStream: function(dataURI){
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component as octate stream
        var mimeString = "octet/stream";

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ia], {type:mimeString});
    },

    createIssue: function (issueData){
         var status;
         chrome.storage.local.get(null, function(items) {
            if(items.name && items.value && items.jiraUrl){
                console.log(issueData);
                var jiraUrl = items.jiraUrl;
                $.ajax({
                    url: "https://"+jiraUrl+"/rest/api/2/issue/",
                    type: 'POST', 
                    data : JSON.stringify(issueData),
                    dataType: "json", 
                    xhrFields: {
                            withCredentials: true
                    },
                    contentType: "application/json",
                    success: function(data) {
                        
                        issueKeyid = data.key;

                        chrome.storage.local.get('screenshotImg', function(items) {
                            if(items.screenshotImg && items.screenshotImg!==''){

                            var blob = BG.dataURItoBlob(items.screenshotImg);
                            var fd = new FormData();
                            fd.append("file", blob,"screenshot_"+issueKeyid+"_.png");
                            fd.append('comment', "screenshot");
                            fd.append('minorEdit', "true");

                            $.ajax({
                                url: "https://"+jiraUrl+"/rest/api/2/issue/"+issueKeyid+"/attachments",
                                type: 'POST', 
                                data: fd,
                                processData: false,
                                contentType: false,
                                headers: {
                                    "X-Atlassian-Token": "nocheck"
                                },
                                success: function(data) {
                                    status = "success";
                                    alert("Issue ID "+issueKeyid+" created successfully");
                                    
                                },
                                error:function(data){
                                    status = "failed";
                                    alert("Could not create issue. Something went wrong !!");
                                }
                            });
            
                            }
                        });
                        
                    }
                });

         }

         });
    

        return status;
    }

};
BG.init();