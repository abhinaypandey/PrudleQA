var NP = {
    init: function() {
         chrome.runtime.onMessage.addListener(function(a, b, c) {
            if ("take_screen_shot" === a.method) NP.screenShot(c);
            else if ("createIssue" === a.method) NP.createIssue(b);
            else if ("get_pixel_color" === a.method) {
                var d = a.point;
                NP.getPixelColor(d, c)
            } else "save_data" === a.method ? NP.saveData(a.config) : "get_data" === a.method && NP.getData(c);
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
    screenShot: function(a) {

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

            chrome.runtime.sendMessage({
                    method: "exit_toolbar"
            });

            // $.ajax({
            //     url: "https://prudlelabs.atlassian.net/rest/api/2/project",
            //     type: 'GET',
            //     success: function(data) {
            //         alert(data[0].name);   
            //     }
            // });

            // capture screenshot before sending to JIRA 
            chrome.tabs.captureVisibleTab(function(dataURL) {
                chrome.storage.local.set({'screenshotImg': dataURL}, function() {
                    // Notify that we saved.
                    
                });
            
                // var issueKeyid;
                // var issue ={
                //                 "fields": {
                //                     "project":
                //                     { 
                //                         "key": "PRUD"
                //                     },
                //                     "summary": "Prudle QA test issue",
                //                     "description": "Creating an issue to test Prudle QA",
                //                     "issuetype": {
                //                         "name": "Bug"
                //                     }       
                //                 }
                //             };
                // $.ajax({
                //     url: "https://prudlelabs.atlassian.net/rest/api/2/issue/",
                //     type: 'POST', 
                //     data : JSON.stringify(issue),
                //     dataType: "json", 
                //     contentType: "application/json",
                //     // beforeSend: function (xhr) {
                //     //     xhr.setRequestHeader ("Authorization", "Basic " + btoa(username + ":" + password));
                //     // },
                //     success: function(data) {
                //         // alert("issue : "+data.key+" created");
                //         issueKeyid = data.key;

                //         $.ajax({
                //             url: "https://prudlelabs.atlassian.net/rest/api/2/issue/"+issueKeyid+"/attachments",
                //             type: 'POST', 
                //             data: {file: dataURL},
                //             processData: false,
                //             contentType: 'multipart/form-data',
                //             beforeSend: function (xhr) {
                //                 xhr.setRequestHeader ("X-Atlassian-Token:no-check");
                //             },
                //             success: function(data) {
                //                 alert("issue created");
                                
                //             },
                //             error:function(data){
                //                 console.log(data);
                //             },
                //             complete:function(xhr,status){
                //                 console.log(xhr);
                //             }
                //         });
                //     }
                // });
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

    createIssue: function (issueData){
        console.log(issueData);
        $.ajax({
                url: "https://prudlelabs.atlassian.net/rest/api/2/issue/",
                type: 'POST', 
                data : JSON.stringify(issueData),
                dataType: "json", 
                contentType: "application/json",
                xhrFields: {
                    withCredentials: true
                },
                beforeSend: function(xhr){
                    xhr.setRequestHeader("X-Atlassian-Token:nocheck");
                },
                success: function(data) {
                    console.log(data);
                   
                },
                error : function (xhr,data){
                    console.log(xhr);
                }
         });
        // $.ajax({
        //     url: "https://prudlelabs.atlassian.net/rest/api/2/issue/",
        //     type: 'POST', 
        //     data : JSON.stringify(issue),
        //     dataType: "json", 
        //     contentType: "application/json",
        //     success: function(data) {
        //         issueKeyid = data.key;

        //         $.ajax({
        //             url: "https://prudlelabs.atlassian.net/rest/api/2/issue/"+issueKeyid+"/attachments",
        //             type: 'POST', 
        //             data: {file: dataURL},
        //             processData: false,
        //             contentType: 'multipart/form-data',
        //             beforeSend: function (xhr) {
        //                 xhr.setRequestHeader ("X-Atlassian-Token:no-check");
        //             },
        //             success: function(data) {
        //                 alert("issue created");
                        
        //             },
        //             error:function(data){
        //                 console.log(data);
        //             },
        //             complete:function(xhr,status){
        //                 console.log(xhr);
        //             }
        //         });
        //     }
        // });
    }

};
NP.init();