

window.CaptureAPI = (function() {

    var MAX_PRIMARY_DIMENSION = 15000 * 2,
        MAX_SECONDARY_DIMENSION = 4000 * 2,
        MAX_AREA = MAX_PRIMARY_DIMENSION * MAX_SECONDARY_DIMENSION;


    //
    // URL Matching test - to verify we can talk to this URL
    //

    var matches = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'],
        noMatches = [/^https?:\/\/chrome.google.com\/.*$/];

    function isValidUrl(url) {
        // couldn't find a better way to tell if executeScript
        // wouldn't work -- so just testing against known urls
        // for now...
        var r, i;
        for (i = noMatches.length - 1; i >= 0; i--) {
            if (noMatches[i].test(url)) {
                return false;
            }
        }
        for (i = matches.length - 1; i >= 0; i--) {
            r = new RegExp('^' + matches[i].replace(/\*/g, '.*') + '$');
            if (r.test(url)) {
                return true;
            }
        }
        return false;
    }


    function initiateCapture(tab, callback) {
        chrome.tabs.sendMessage(tab.id, {msg: 'scrollPage'}, function() {
            // We're done taking snapshots of all parts of the window. Display
            // the resulting full screenshot images in a new browser tab.
            callback();
        });
    }


    function capture(data, screenshots, sendResponse, splitnotifier) {
        chrome.tabs.captureVisibleTab(
            null, {format: 'png', quality: 100}, function(dataURI) {
                if (dataURI) {

                    var image = new Image();
                    image.onload = function() {
                        data.image = {width: image.width, height: image.height};

                        // given device mode emulation or zooming, we may end up with
                        // a different sized image than expected, so let's adjust to
                        // match it!
                        if (data.windowWidth !== image.width) {
                            var scale = image.width / data.windowWidth;
                            data.x *= scale;
                            data.y *= scale;
                            data.totalWidth *= scale;
                            data.totalHeight *= scale;
                        }

                        // lazy initialization of screenshot canvases (since we need to wait
                        // for actual image size)
                        if (!screenshots.length) {
                            Array.prototype.push.apply(
                                screenshots,
                                _initScreenshots(data.totalWidth, data.totalHeight)
                            );
                            if (screenshots.length > 1) {
                                if (splitnotifier) {
                                    //splitnotifier();
                                }
                                $('screenshot-count').innerText = screenshots.length;
                            }
                        }

                        // draw it on matching screenshot canvases
                        _filterScreenshots(
                            data.x, data.y, image.width, image.height, screenshots
                        ).forEach(function(screenshot) {
                            screenshot.ctx.drawImage(
                                image,
                                data.x - screenshot.left,
                                data.y - screenshot.top
                            );
                        });

                        // send back log data for debugging (but keep it truthy to
                        // indicate success)
                        sendResponse(JSON.stringify(data, null, 4) || true);
                    };
                    image.src = dataURI;
                }
            });
    }


    function _initScreenshots(totalWidth, totalHeight) {
        // Create and return an array of screenshot objects based
        // on the `totalWidth` and `totalHeight` of the final image.
        // We have to account for multiple canvases if too large,
        // because Chrome won't generate an image otherwise.
        //
        var badSize = (totalHeight > MAX_PRIMARY_DIMENSION ||
                       totalWidth > MAX_PRIMARY_DIMENSION ||
                       totalHeight * totalWidth > MAX_AREA),
            biggerWidth = totalWidth > totalHeight,
            maxWidth = (!badSize ? totalWidth :
                        (biggerWidth ? MAX_PRIMARY_DIMENSION : MAX_SECONDARY_DIMENSION)),
            maxHeight = (!badSize ? totalHeight :
                         (biggerWidth ? MAX_SECONDARY_DIMENSION : MAX_PRIMARY_DIMENSION)),
            numCols = Math.ceil(totalWidth / maxWidth),
            numRows = Math.ceil(totalHeight / maxHeight),
            row, col, canvas, left, top;

        var canvasIndex = 0;
        var result = [];

        for (row = 0; row < numRows; row++) {
            for (col = 0; col < numCols; col++) {
                canvas = document.createElement('canvas');
                canvas.width = (col == numCols - 1 ? totalWidth % maxWidth || maxWidth :
                                maxWidth);
                canvas.height = (row == numRows - 1 ? totalHeight % maxHeight || maxHeight :
                                 maxHeight);

                left = col * maxWidth;
                top = row * maxHeight;

                result.push({
                    canvas: canvas,
                    ctx: canvas.getContext('2d'),
                    index: canvasIndex,
                    left: left,
                    right: left + canvas.width,
                    top: top,
                    bottom: top + canvas.height
                });

                canvasIndex++;
            }
        }

        return result;
    }


    function _filterScreenshots(imgLeft, imgTop, imgWidth, imgHeight, screenshots) {
        // Filter down the screenshots to ones that match the location
        // of the given image.
        //
        var imgRight = imgLeft + imgWidth,
            imgBottom = imgTop + imgHeight;
        return screenshots.filter(function(screenshot) {
            return (imgLeft < screenshot.right &&
                    imgRight > screenshot.left &&
                    imgTop < screenshot.bottom &&
                    imgBottom > screenshot.top);
        });
    }


    function getBlobs(screenshots) {
        return screenshots.map(function(screenshot) {
            var dataURI = screenshot.canvas.toDataURL();

            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs
            var byteString = atob(dataURI.split(',')[1]);

            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

            // write the bytes of the string to an ArrayBuffer
            var ab = new ArrayBuffer(byteString.length);
            var ia = new Uint8Array(ab);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            // create a blob for writing to a file
            var blob = new Blob([ab], {type: mimeString});
            return blob;
        });
    }


    function saveBlob(blob, filename, index, callback, errback) {
        filename = _addFilenameSuffix(filename, index);

        function onwriteend() {
            // open the file that now contains the blob - calling
            // `openPage` again if we had to split up the image
            var urlName = ('filesystem:chrome-extension://' +
                           chrome.i18n.getMessage('@@extension_id') +
                           '/temporary/' + filename);

            callback(urlName);
        }

        // come up with file-system size with a little buffer
        var size = blob.size + (1024 / 2);
        
        // save dataURL/Blob to local storage 
            chrome.storage.local.set({'screenshotImg': blob}, function() {
            // Notify that we saved.
            
        });



        // create a blob for writing to a file
        var reqFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        reqFileSystem(window.TEMPORARY, size, function(fs){
            fs.root.getFile(filename, {create: true}, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                    fileWriter.onwriteend = onwriteend;
                    fileWriter.write(blob);
                }, errback); // TODO - standardize error callbacks?
            }, errback);
        }, errback);
    }


    function _addFilenameSuffix(filename, index) {
        if (!index) {
            return filename;
        }
        var sp = filename.split('.');
        var ext = sp.pop();
        return sp.join('.') + '-' + (index + 1) + '.' + ext;
    }


    function captureToBlobs(tab, callback, errback, progress, splitnotifier) {
        var loaded = false,
            screenshots = [],
            timeout = 3000,
            timedOut = false,
            noop = function() {};

        callback = callback || noop;
        errback = errback || noop;
        progress = progress || noop;

        if (!isValidUrl(tab.url)) {
            errback('invalid url'); // TODO errors
        }

        // TODO will this stack up if run multiple times? (I think it will get cleared?)
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.msg === 'capture') {
                progress(request.complete);
                capture(request, screenshots, sendResponse, splitnotifier);

                // https://developer.chrome.com/extensions/messaging#simple
                //
                // If you want to asynchronously use sendResponse, add return true;
                // to the onMessage event handler.
                //
                return true;
            } else {
                //console.error('Unknown message received from content script: ' + request.msg);
                errback('internal error');
                return false;
            }
        });

        chrome.tabs.executeScript(tab.id, {file: 'js/screenshot/page.js'}, function() {
            if (timedOut) {
                // console.error('Timed out too early while waiting for ' +
                //               'chrome.tabs.executeScript. Try increasing the timeout.');
            } else {
                loaded = true;
                progress(0);

                initiateCapture(tab, function() {
                    callback(getBlobs(screenshots));
                });
            }
        });

        window.setTimeout(function() {
            if (!loaded) {
                timedOut = true;
                errback('execute timeout');
            }
        }, timeout);
    }


    function captureToFiles(tab, filename, callback, errback, progress, splitnotifier) {
        captureToBlobs(tab, function(blobs) {
            var i = 0,
                len = blobs.length,
                filenames = [];

            (function doNext() {
                saveBlob(blobs[i], filename, i, function(filename) {
                    i++;
                    filenames.push(filename);
                    i >= len ? callback(filenames) : doNext();
                }, errback);
            })();
        }, errback, progress, splitnotifier);
    }


    return {
        captureToBlobs: captureToBlobs,
        captureToFiles: captureToFiles
    };

})();




var currentTab, // result of chrome.tabs.query of current active tab
    resultWindowId; // window id for putting resulting images


//
// Utility methods
//

function $(id) { return document.getElementById(id); }
//function show(id) { $(id).style.display = 'block'; }
//function hide(id) { $(id).style.display = 'none'; }


function getFilename(contentURL) {
    var name = contentURL.split('?')[0].split('#')[0];
    if (name) {
        name = name
            .replace(/^https?:\/\//, '')
            .replace(/[^A-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^[_\-]+/, '')
            .replace(/[_\-]+$/, '');
        name = '-' + name;
    } else {
        name = '';
    }
    return 'screencapture' + name + '-' + Date.now() + '.png';
}


//
// Capture Handlers
//

function injectJiraModal(){
     
}

function downloadCaptures(filenames) {
    if (!filenames || !filenames.length) {
        alert("unable to capture");
        return;
    }

    _downloadCapture(filenames);
}


function _downloadCapture(filenames, index) {
    index = index || 0;

    var filename = filenames[index];
    var last = index === filenames.length - 1;

    // download the screenshot as soon as it completes the capture 
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = filenames[0];
    a.download = "screenshot.png";
    a.click();
    //window.URL.revokeObjectURL(url);

    if (!last) {
        _displayCapture(filenames, index + 1);
    }
}


function errorHandler(reason) {
    //show('uh-oh'); // TODO - extra uh-oh info?
}


function progress(complete) {
    if (complete === 1) {
        try {
            localStorage.setItem("scroll_progress", JSON.stringify("complete"));
        } catch (b) {}
    }
    else {
        try {
            localStorage.setItem("scroll_progress", JSON.stringify("loading"));
        } catch (b) {}
    }
}


function splitnotifier() {
    //show('split-image');
}

var BG = {
    init: function() {
         chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if ("openJiraModal" === request.method){ BG.openJiraModal(sendResponse)}
            else if ("takeScreenShotAndSave" === request.method){ BG.takeScreenShotAndSave()}
            else if ("takeWindowScreenShotAndSave" === request.method){ BG.takeWindowScreenShotAndSave()}
            else if ("createIssue" === request.method){ BG.createIssue(request.data,sendResponse); }
            else if ("clearEverythingOnLogout" === request.method){ BG.clearEverythingOnLogout(); }
            else if ("enableJiraReporting" === request.method){ BG.enableJiraReporting(); }
            else if ("disableJiraReporting" === request.method){ BG.disableJiraReporting(); }
            else if ("initFirebaseLogin" === request.method){ BG.performFirebaseLoginWithEmailAndPassword(request.data) }
            else if ("get_pixel_color" === request.method) {
                var d = request.point;
                BG.getPixelColor(d, sendResponse)
            } else "save_data" === request.method ? BG.saveData(request.config) : "get_data" === request.method && BG.getData(sendResponse);
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

                chrome.tabs.executeScript(currentTab, {
                    file: "js/modal.js"
                });

            });

            //capture screenshot before sending to JIRA 
            chrome.tabs.captureVisibleTab(function(dataURL) {
                chrome.storage.local.set({'screenshotImg': dataURL}, function() {
                    // Notify that we saved.
                    
                });
            });

            
    },

    takeScreenShotAndSave : function (){

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var tab = tabs[0];
        currentTab = tab; // used in later calls to get tab info

        var filename = getFilename(tab.url);

        CaptureAPI.captureToFiles(tab, filename, downloadCaptures,
                                errorHandler, progress, splitnotifier);
        });
       
    },
    takeWindowScreenShotAndSave : function (){
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
                // window.URL.revokeObjectURL(url);
                
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

    createIssue: function (fdata,sendResponse){
         var status;
         chrome.storage.local.get(null, function(items) {
            if(items.name && items.value && items.jiraUrl){
                var jiraUrl = items.jiraUrl;
                $.ajax({
                    url: "https://"+jiraUrl+"/rest/api/2/issue/",
                    type: 'POST', 
                    data : JSON.stringify(fdata.issueData),
                    dataType: "json", 
                    xhrFields: {
                            withCredentials: true
                    },
                    contentType: "application/json",
                    success: function(data) {
                        issueKeyid = data.key;
                        if(fdata.includeScreenshot){
                            
                            chrome.storage.local.get('screenshotImg', function(items) {
                                    if(items.screenshotImg && items.screenshotImg!==''){

                                        var blob = BG.dataURItoBlob(items.screenshotImg);
                                        var fd = new FormData();
                                        fd.append("file", blob,issueKeyid+"_screenshot.png");
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
                                                sendResponse(status);
                                
                                            },
                                            error: function(data){
                                                console.log(data);
                                                status = "failed";
                                                alert("Could not the create issue. Something went wrong !!");
                                                sendResponse(status);

                                            }
                                        });
                        
                                    }
                                });
                        }else{
                            alert("Issue ID "+issueKeyid+" created successfully");
                            sendResponse(status);
                        }
                           
                    },
                    error: function(data){
                        console.log(data);
                        status = "failed";
                        alert("Could not create the issue. Something went wrong !!");
                        sendResponse(status);
                    }
                });

         }

         });

    },

    clearEverythingOnLogout: function(){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {action: "clearEverything"}, function(response) {});  
        });
    },

    enableJiraReporting: function(){
        chrome.tabs.query({active: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {action: "enableJiraReportingBtn"}, function(response) {});  
        });
    },
    disableJiraReporting: function(){
        chrome.tabs.query({active: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {action: "disableJiraReportingBtn"}, function(response) {});  
        });
    },

    hideJiraModal: function(){

    }

    };

   BG.init();

