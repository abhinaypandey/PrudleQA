var theWindow = window;
theWindow.TextCursor || (theWindow.TextCursor = function(a, b) {
    this.fillStyle = a || "rgba(0, 0, 0, 0.7)", this.width = b || 2, this.left = 0, this.top = 0
}, theWindow.TextCursor.prototype = {
    getHeight: function(a) {
        var b = a.measureText("W").width;
        return b + b / 6
    },
    createPath: function(a) {
        a.beginPath(), a.rect(this.left, this.top, this.width, this.getHeight(a))
    },
    draw: function(a, b, c) {
        a.save(), this.left = b, this.top = c - this.getHeight(a), this.createPath(a), a.lineWidth = 1, a.fillStyle = this.fillStyle, a.fill(), a.restore()
    },
    erase: function(a) {
        theWindow.NOTEPAD.restoreCanvas([this.left - 1, this.top, this.width + 2, this.getHeight(a)])
    }
}), theWindow.TextLine || (theWindow.TextLine = function(a, b) {
    this.text = "", this.left = a, this.bottom = b, this.caret = 0
}, theWindow.TextLine.prototype = {
    insert: function(a) {
        var b = this.text.slice(0, this.caret),
            c = this.text.slice(this.caret);
        b += a, this.text = b, this.text += c, this.caret += a.length
    },
    getCaretX: function(a) {
        var b = this.text.substring(0, this.caret),
            c = a.measureText(b).width;
        return this.left + c
    },
    removeCharacterBeforeCaret: function() {
        0 !== this.caret && (this.text = this.text.substring(0, this.caret - 1) + this.text.substring(this.caret), this.caret--)
    },
    removeLastCharacter: function() {
        this.text = this.text.slice(0, -1)
    },
    getWidth: function(a) {
        return a.measureText(this.text).width
    },
    getHeight: function(a) {
        var b = a.measureText("W").width;
        return b + b / 6
    },
    draw: function(a) {
        a.save(), a.textAlign = "start", a.textBaseline = "bottom", a.lineWidth = 1, a.strokeText(this.text, this.left, this.bottom), a.fillText(this.text, this.left, this.bottom), a.restore()
    },
    erase: function(a) {
        theWindow.NOTEPAD.restoreCanvas()
    }
}), theWindow.Paragraph || (theWindow.Paragraph = function(a, b, c, d, e) {
    this.context = a, this.drawingSurface = d, this.left = b, this.top = c, this.lines = [], this.activeLine = void 0, this.cursor = e, this.blinkingInterval = void 0
}, theWindow.Paragraph.prototype = {
    clearIntervals: function(a) {
        this.blinkingInterval = theWindow.clearInterval(this.blinkingInterval), this.blinkingTimeout = theWindow.clearTimeout(this.blinkingTimeout), this.cursor.erase(this.context, this.drawingSurface), "function" != typeof a || this.blinkingInterval ? this.blinkingInterval && this.clearIntervals(a) : a()
    },
    isPointInside: function(a) {
        var b = this.context;
        return b.beginPath(), b.rect(this.left, this.top, this.getWidth(), this.getHeight()), b.isPointInPath(a.x, a.y)
    },
    getHeight: function() {
        var a = 0;
        return this.lines.forEach(Function.prototype.bind.call(function(b) {
            a += b.getHeight(this.context)
        }, this)), a
    },
    getWidth: function() {
        var a = 0,
            b = 0;
        return this.lines.forEach(Function.prototype.bind.call(function(c) {
            a = c.getWidth(this.context), a > b && (b = a)
        }, this)), b
    },
    draw: function() {
        this.lines.forEach(Function.prototype.bind.call(function(a) {
            a.draw(this.context)
        }, this))
    },
    erase: function(a) {
        theWindow.NOTEPAD.restoreCanvas()
    },
    addLine: function(a) {
        this.lines.push(a), this.activeLine = a, this.moveCursor(a.left, a.bottom)
    },
    insert: function(a) {
        this.erase(this.context, this.drawingSurface), this.activeLine.insert(a);
        var b = this.activeLine.text.substring(0, this.activeLine.caret),
            c = this.context.measureText(b).width;
        this.moveCursor(this.activeLine.left + c, this.activeLine.bottom), this.draw(this.context)
    },
    blinkCursor: function(a, b) {
        var c = this,
            d = 200,
            e = 900;
        this.blinkingInterval && (this.blinkingInterval = theWindow.clearInterval(this.blinkingInterval)), this.blinkingInterval = setInterval(function(a) {
            var b = theWindow.NOTEPAD.drawOptions[theWindow.NOTEPAD.selectedDrawOption];
            return b && "text" === b.type ? (c.cursor.erase(c.context, c.drawingSurface), c.blinkingTimeout && (c.blinkingTimeout = theWindow.clearTimeout(c.blinkingTimeout)), void(c.blinkingTimeout = setTimeout(function(a) {
                c.cursor.draw(c.context, c.cursor.left, c.cursor.top + c.cursor.getHeight(c.context))
            }, d))) : void(c.blinkingInterval = theWindow.clearInterval(c.blinkingInterval))
        }, e)
    },
    moveCursorCloseTo: function(a, b) {
        var c = this.getLine(b);
        c && (c.caret = this.getColumn(c, a), this.activeLine = c, this.moveCursor(c.getCaretX(this.context), c.bottom))
    },
    moveCursor: function(a, b) {
        this.cursor.erase(this.context, this.drawingSurface), this.cursor.draw(this.context, a, b), this.blinkingInterval || this.blinkCursor(a, b)
    },
    moveLinesDown: function(a) {
        for (var b = a; b < this.lines.length; ++b) {
            var c = this.lines[b];
            c.bottom += c.getHeight(this.context)
        }
    },
    newline: function() {
        var a, b, c = this.activeLine.text.substring(0, this.activeLine.caret),
            d = this.activeLine.text.substring(this.activeLine.caret),
            e = this.context.measureText("W").width + this.context.measureText("W").width / 6,
            f = this.activeLine.bottom + e;
        this.erase(this.context, this.drawingSurface), this.activeLine.text = c, b = new TextLine(this.activeLine.left, f), b.insert(d), a = this.lines.indexOf(this.activeLine), this.lines.splice(a + 1, 0, b), this.activeLine = b, this.activeLine.caret = 0, a = this.lines.indexOf(this.activeLine);
        for (var g = a + 1; g < this.lines.length; ++g) b = this.lines[g], b.bottom += e;
        this.draw(), this.cursor.draw(this.context, this.activeLine.left, this.activeLine.bottom)
    },
    getLine: function(a) {
        for (var b, c = 0; c < this.lines.length; ++c)
            if (b = this.lines[c], a > b.bottom - b.getHeight(this.context) && a < b.bottom) return b
    },
    getColumn: function(a, b) {
        var c, d, e, f, g, h = !1;
        for (f = new TextLine(a.left, a.bottom), f.insert(a.text); !h && f.text.length > 0;) c = f.left + f.getWidth(this.context), f.removeLastCharacter(), d = f.left + f.getWidth(this.context), d < b && (e = b - d < c - b ? d : c, g = e === c ? f.text.length + 1 : f.text.length, h = !0);
        return g
    },
    activeLineIsOutOfText: function() {
        return 0 === this.activeLine.text.length
    },
    activeLineIsTopLine: function() {
        return this.lines[0] === this.activeLine
    },
    moveUpOneLine: function() {
        var a, b, c = this.activeLine;
        a = "" + c.text;
        var d = this.lines.indexOf(this.activeLine);
        this.activeLine = this.lines[d - 1], this.activeLine.caret = this.activeLine.text.length, this.lines.splice(d, 1), this.moveCursor(this.activeLine.left + this.activeLine.getWidth(this.context), this.activeLine.bottom), this.activeLine.text += a;
        for (var e = d; e < this.lines.length; ++e) b = this.lines[e], b.bottom -= b.getHeight(this.context)
    },
    backspace: function() {
        var a, b;
        this.context.save(), 0 === this.activeLine.caret ? this.activeLineIsTopLine() || (this.erase(this.context, this.drawingSurface), this.moveUpOneLine(), this.draw()) : (this.erase(this.context, this.drawingSurface), this.activeLine.removeCharacterBeforeCaret(), a = this.activeLine.text.slice(0, this.activeLine.caret), b = this.context.measureText(a).width, this.moveCursor(this.activeLine.left + b, this.activeLine.bottom), this.draw(this.context), this.context.restore())
    }
}), Function.prototype.bind || (Function.prototype.bind = function(a) {
    if ("function" != typeof this) throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    var b = Array.prototype.slice.call(arguments, 1),
        c = this,
        d = function() {},
        e = function() {
            return c.apply(this instanceof d && a ? this : a, b.concat(Array.prototype.slice.call(arguments)))
        };
    return d.prototype = this.prototype, e.prototype = new d, e
});
var getCSSAnimationManager = function() {
    for (var a, b, c, d = !1, e = ["webkit", "Moz", "O", ""], f = e.length, g = document.documentElement.style; f--;)
        if (e[f]) {
            if (void 0 !== g[e[f] + "AnimationName"]) {
                switch (a = e[f], f) {
                    case 0:
                        b = a.toLowerCase() + "AnimationStart", c = a.toLowerCase() + "AnimationEnd", d = !0;
                        break;
                    case 1:
                        b = "animationstart", c = "animationend", d = !0;
                        break;
                    case 2:
                        b = a.toLowerCase() + "animationstart", c = a.toLowerCase() + "animationend", d = !0
                }
                break
            }
        } else if (void 0 !== g.animationName) {
        a = e[f], b = "animationstart", c = "animationend", d = !0;
        break
    }
    return {
        supported: d,
        prefix: a,
        start: b,
        end: c
    }
};
! function(a, b) {
    "undefined" != typeof unsafeWindow && null !== unsafeWindow ? unsafeWindow.NOTEPAD_INIT || (a.NOTEPAD = b(a), a.NOTEPAD.init()) : ("undefined" != typeof a.NOTEPAD && null !== a.NOTEPAD || (a.NOTEPAD = b(a)), a.NOTEPAD.initialized || a.NOTEPAD.init())
}("undefined" != typeof theWindow ? theWindow : this, function(a) {
    var b = function() {
        this.MAX_ITEMS = 50, this.currentIndex = 0, this.array = []
    };
    b.prototype.add = function(a) {
        if (this.currentIndex < this.array.length - 1 ? (this.array[++this.currentIndex] = a, this.array = this.array.slice(0, this.currentIndex + 1)) : (this.array.push(a), this.currentIndex = this.array.length - 1), this.array.length > this.MAX_ITEMS) {
            var b = this.array.length - this.MAX_ITEMS;
            this.array = this.array.splice(-this.MAX_ITEMS), this.currentIndex = this.currentIndex - b
        }
    }, b.prototype.previous = function() {
        return 0 === this.currentIndex ? null : this.array[--this.currentIndex]
    }, b.prototype.next = function() {
        return this.currentIndex === this.array.length - 1 ? null : this.array[++this.currentIndex]
    }, b.prototype.hasPrevious = function() {
        return this.currentIndex > 0
    }, b.prototype.hasNext = function() {
        return this.currentIndex < this.array.length - 1
    };
    var c = {
        canvas: null,
        context: null,
        initialized: !1,
        history: null,
        config: {},
        drawOptions: [{
            type: "pen",
            title: "Pencil - draw a custom line"
        }, {
            type: "text",
            font: "Arial",
            minSize: 15,
            maxSize: 50,
            title: "Text - insert text"
        }, {
            type: "line",
            title: "Line - draw a straight line"
        }, {
            type: "circle",
            title: "Ellipse - draw an ellipse or a circle"
        }, {
            type: "rectangle",
            title: "Rectangle - draw a rectangle or a square"
        }, {
            type: "eraser",
            title: "Eraser - erase part of your drawings",
            width: 30,
            height: 30
        }],
        selectedDrawOption: null,
        selectedColorOption: null,
        selectedAlphaOption: null,
        mousedown: !1,
        lastMouseDownLoc: null,
        drawingSurfaceImageData: null,
        resizeTimeoutID: null,
        cursor: new TextCursor,
        paragraph: null,
        panel: null,
        createCanvas: function() {
            this.canvas = a.document.createElement("canvas"), this.context = this.canvas.getContext("2d"), this.canvas.setAttribute("id", "NOTEPAD"), this.buffer = document.createElement("canvas"), a.document.body.appendChild(this.canvas), a.addEventListener("resize", this.resizeBinded), a.addEventListener("scroll", this.resizeBinded), this.handleResize(), this.storeHistory()
        },
        checkHistoryButtonStatus: function() {
            this.nextBtn && this.backBtn && (this.history.hasNext() ? this.removeClass(this.nextBtn, "disabled") : this.addClass(this.nextBtn, "disabled"), this.history.hasPrevious() ? this.removeClass(this.backBtn, "disabled") : this.addClass(this.backBtn, "disabled"))
        },
        storeHistory: function() {
            this.history.add(this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)), this.checkHistoryButtonStatus()
        },
        handleBackButtonClick: function() {
            this.history.hasPrevious() && (this.finishLastDrawing(), this.context.putImageData(this.history.previous(), 0, 0), this.storeCanvas(), this.checkHistoryButtonStatus())
        },
        handleForwardButtonClick: function() {
            this.history.hasNext() && (this.finishLastDrawing(), this.context.putImageData(this.history.next(), 0, 0), this.storeCanvas(), this.checkHistoryButtonStatus())
        },
        storeCanvas: function() {
            this.buffer.width = this.canvas.width, this.buffer.height = this.canvas.height, this.buffer.getContext("2d").drawImage(this.canvas, 0, 0)
        },
        restoreCanvas: function(a) {
            a ? (this.context.clearRect.apply(this.context, a), a.unshift(this.buffer), this.context.drawImage.apply(this.context, a)) : (this.context.clearRect(0, 0, this.canvas.width, this.canvas.height), this.context.drawImage(this.buffer, 0, 0))
        },
        handlePanelAppearing: function(a) {
            a.target.style.opacity = 1
        },
        handleResize: function() {
            this.storeCanvas();
            var a = this.context.lineWidth,
                b = Math.max(document.documentElement.clientWidth, document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth),
                c = Math.max(document.documentElement.clientHeight, document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight);
            this.canvas.width = b, this.canvas.height = c, this.restoreCanvas(), this.updatePaintStyle(), this.context.lineWidth = a
        },
        createControlPanel: function() {
            this.panel = a.document.createElement("div"), this.backBtn = a.document.createElement("div"), this.nextBtn = a.document.createElement("div");
            var b = a.document.createElement("div"),
                c = a.document.createElement("div"),
                d = a.document.createElement("div"),
                e = a.document.createElement("div"),
                f = a.document.createElement("div");
            this.panel.setAttribute("id", "NOTEPAD_controls"), b.setAttribute("class", "NOTEPAD_controls_draw"), c.setAttribute("class", "NOTEPAD_controls_color"), d.setAttribute("class", "NOTEPAD_controls_control"), e.setAttribute("class", "NOTEPAD_controls_range alpha_control"), f.setAttribute("class", "NOTEPAD_controls_range size_control"), a.document.body.appendChild(this.panel), this.panel.appendChild(b), this.panel.appendChild(c), this.panel.appendChild(e), this.panel.appendChild(f), this.panel.appendChild(d);
            for (var g = 0; g < this.drawOptions.length; g++) {
                var h = this.drawOptions[g],
                    i = a.document.createElement("div");
                i.setAttribute("class", "NOTEPAD_controls_draw_option"), i.setAttribute("title", h.title), this.addClass(i, h.type), i.addEventListener("click", Function.prototype.bind.call(this.onControlPanelClick, this, g)), b.appendChild(i), (null !== this.config.tool && "undefined" != typeof this.config.tool || 0 !== g) && g !== this.config.tool || this.triggerClick(i)
            }
            this.colorPicker = a.document.createElement("input"), this.colorPicker.setAttribute("type", "color"), this.colorPicker.value = this.config.color || "#000000", this.colorPicker.setAttribute("title", "Select a color"), this.colorPicker.addEventListener("change", Function.prototype.bind.call(this.onColorPanelClick, this), !1), c.appendChild(this.colorPicker), this.alphaPicker = a.document.createElement("input"), this.alphaPicker.setAttribute("type", "range"), this.alphaPicker.setAttribute("min", "0"), this.alphaPicker.setAttribute("max", "1"), this.alphaPicker.setAttribute("step", "0.01"), this.alphaPicker.value = null !== this.config.alpha && "undefined" != typeof this.config.alpha ? this.config.alpha : 1, this.alphaPicker.setAttribute("title", "Select transparency"), this.alphaPicker.addEventListener("change", Function.prototype.bind.call(this.onAlphaChange, this), !1), this.alphaPicker.addEventListener("input", Function.prototype.bind.call(this.onAlphaUpdate, this), !1), this.alphaPickerPreview = a.document.createElement("p"), e.appendChild(this.alphaPicker), e.appendChild(this.alphaPickerPreview);
            var j = a.document.createElement("input");
            j.setAttribute("type", "range"), j.setAttribute("min", "1"), j.setAttribute("max", "20"), j.setAttribute("step", "1"), j.value = this.config.thickness || 1, j.setAttribute("title", "Select line width"), j.addEventListener("change", Function.prototype.bind.call(this.onLineChange, this), !1), j.addEventListener("input", Function.prototype.bind.call(this.onLineUpdate, this), !1), this.linePickerPreview = a.document.createElement("p"), f.appendChild(j), f.appendChild(this.linePickerPreview), this.selectedColorOption = this.hexToRgb(this.colorPicker.value), this.selectedAlphaOption = this.alphaPicker.value, this.context.lineWidth = j.value, this.alphaPickerPreview.innerHTML = Math.round(100 * this.selectedAlphaOption) + "%", this.linePickerPreview.innerHTML = Math.round(this.context.lineWidth / 20 * 100) + "%", this.updatePaintStyle();
            var k = a.document.createElement("div"),
                l = a.document.createElement("div");
                m = a.document.createElement("div");

            // k.setAttribute("class", "NOTEPAD_controls_control_option prtBtn"),
            // k.setAttribute("title", "Take a screenshot of the current web page with your drawings"), 
            k.setAttribute("class", "NOTEPAD_controls_control_option bugBtn"),
            k.setAttribute("title", "Bug report"), 
            l.setAttribute("class", "NOTEPAD_controls_control_option exitBtn"), 
            l.setAttribute("title", "Clean up your drawings and disable the tools"), 
            
            this.backBtn.setAttribute("class", "NOTEPAD_controls_control_option backBtn"), 
            this.backBtn.setAttribute("title", "Step backward"), 
            this.nextBtn.setAttribute("class", "NOTEPAD_controls_control_option nextBtn"), 
            this.nextBtn.setAttribute("title", "Step forward"), 
            k.addEventListener("click", Function.prototype.bind.call(this.onBugButtonClick, this)), 
            l.addEventListener("click", Function.prototype.bind.call(this.exit, this)), 
            // m.addEventListener("click", Function.prototype.bind.call(this.onBugButtonClick, this)),
            this.backBtn.addEventListener("click", Function.prototype.bind.call(this.handleBackButtonClick, this)), 
            this.nextBtn.addEventListener("click", Function.prototype.bind.call(this.handleForwardButtonClick, this)), 
            d.appendChild(this.backBtn), 
            d.appendChild(this.nextBtn), 
            d.appendChild(k), 
            d.appendChild(l), 
            // d.appendChild(m),
            this.checkHistoryButtonStatus(), this.CSSAnimationManager.supported ? this.panel.addEventListener(this.CSSAnimationManager.end, Function.prototype.bind.call(this.handlePanelAppearing, this), !1) : this.panel.style.opacity = 1
        },
        finishLastDrawing: function() {
            var a = this.drawOptions[this.selectedDrawOption];
            a && "polygon" === a.type && a.lastLoc && a.initLoc ? (this.context.beginPath(), this.context.moveTo(a.lastLoc.x, a.lastLoc.y), this.context.lineTo(a.initLoc.x, a.initLoc.y), this.context.stroke(), this.context.closePath(), this.mousedown = !1, a.initLoc = null, a.lastLoc = null, this.storeCanvas(), this.storeHistory()) : a && "quadratic_curve" === a.type && 0 !== a.iteration ? (this.context.closePath(), this.storeCanvas(), this.storeHistory(), this.mousedown = !1, a.iteration = 0, a.initLoc = null, a.lastLoc = null) : a && "bezier_curve" === a.type && 0 !== a.iteration ? (this.context.closePath(), this.storeCanvas(), this.storeHistory(), this.mousedown = !1, a.iteration = 0, a.initLoc = null, a.firstPoint = null, a.lastPoint = null) : "eyedropper" !== a && this.mousedown === !0 && (this.mousedown = !1, this.storeCanvas(), this.storeHistory()), this.paragraph && this.paragraph.clearIntervals(Function.prototype.bind.call(function() {
                this.paragraph = null, this.storeCanvas(), this.storeHistory()
            }, this))
        },
        setColor: function(a) {
            a && (this.colorPicker.value = this.rgbToHex(a.r, a.g, a.b), this.selectedColorOption = {
                r: a.r,
                g: a.g,
                b: a.b
            }, this.alphaPicker.value = a.a / 255, this.selectedAlphaOption = this.alphaPicker.value, this.alphaPickerPreview && (this.alphaPickerPreview.innerHTML = Math.round(100 * this.selectedAlphaOption) + "%"), this.updatePaintStyle(), this.config.color === this.colorPicker.value && this.config.alpha === this.selectedAlphaOption || (this.config.color = this.colorPicker.value, this.config.alpha = this.selectedAlphaOption, this.saveData()))
        },
        getColorOfCurrentPixel: function(b) {
            "undefined" != typeof chrome ? chrome.runtime.sendMessage({
                method: "get_pixel_color",
                point: b
            }, this.setColorBinded) : "undefined" != typeof self && null !== self && self.port ? self.port.emit("get_pixel_color", {
                point: b
            }) : a.postMessage({
                method: "get_pixel_color",
                point: b
            }, a.location.origin)
        },
        // onPrintButtonClick: function() {
        //     this.addClass(this.panel, "hide"), a.setTimeout(function() {
        //         "undefined" != typeof chrome ? chrome.runtime.sendMessage({
        //             method: "take_screen_shot"
        //         }) : "undefined" != typeof self && null !== self && self.port ? self.port.emit("take_screen_shot") : a.postMessage({
        //             method: "take_screen_shot"
        //         }, a.location.origin)
        //     }, 100), a.setTimeout(Function.prototype.bind.call(function() {
        //         this.removeClass(this.panel, "hide")
        //     }, this), 500)
        // },
        onBugButtonClick: function() {
            this.addClass(this.panel, "hide"), a.setTimeout(function() {
                "undefined" != typeof chrome ? chrome.runtime.sendMessage({
                    method: "take_screen_shot"
                }) : "undefined" != typeof self && null !== self && self.port ? self.port.emit("take_screen_shot") : a.postMessage({
                    method: "take_screen_shot"
                }, a.location.origin)
            }, 100), a.setTimeout(Function.prototype.bind.call(function() {
                this.removeClass(this.panel, "hide")
            }, this), 500)
        },
        onControlPanelClick: function(b, c) {
            if (this.selectedDrawOption !== b) {
                var d = a.document.querySelectorAll("#NOTEPAD_controls .NOTEPAD_controls_draw_option");
                this.finishLastDrawing();
                for (var e = 0; e < d.length; e++) this.removeClass(d[e], "selected");
                this.addClass(d[b], "selected"), this.removeClass(this.canvas, "pen"), this.removeClass(this.canvas, "cross"), this.removeClass(this.canvas, "eraser"), this.removeClass(this.canvas, "text"), this.removeClass(this.canvas, "cursor"), this.removeClass(this.canvas, "eyedropper"), this.removeClass(this.canvas, "fill"), this.selectedDrawOption = b;
                var f = this.drawOptions[this.selectedDrawOption];
                "pen" === f.type ? this.addClass(this.canvas, "pen") : "eraser" === f.type ? this.addClass(this.canvas, "eraser") : "text" === f.type ? this.addClass(this.canvas, "text") : "cursor" === f.type ? this.addClass(this.canvas, "cursor") : "eyedropper" === f.type ? this.addClass(this.canvas, "eyedropper") : "fill" === f.type ? this.addClass(this.canvas, "fill") : this.addClass(this.canvas, "cross"), this.config.tool !== this.selectedDrawOption && (this.config.tool = this.selectedDrawOption, this.saveData())
            }
        },
        hexToRgb: function(a) {
            var b = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(a);
            return b ? {
                r: parseInt(b[1], 16),
                g: parseInt(b[2], 16),
                b: parseInt(b[3], 16)
            } : null
        },
        rgbToHex: function(a, b, c) {
            return "#" + ((1 << 24) + (a << 16) + (b << 8) + c).toString(16).slice(1)
        },
        onColorPanelClick: function(a) {
            this.selectedColorOption = this.hexToRgb(a.currentTarget.value), this.updatePaintStyle(), this.config.color !== a.currentTarget.value && (this.config.color = a.currentTarget.value, this.saveData())
        },
        onAlphaChange: function(a) {
            this.selectedAlphaOption = a.currentTarget.value, this.alphaPickerPreview && (this.alphaPickerPreview.innerHTML = Math.round(100 * this.selectedAlphaOption) + "%"), this.updatePaintStyle(), this.config.alpha !== this.selectedAlphaOption && (this.config.alpha = this.selectedAlphaOption, this.saveData())
        },
        onAlphaUpdate: function(a) {
            this.alphaPickerPreview && (this.alphaPickerPreview.innerHTML = Math.round(100 * a.currentTarget.value) + "%")
        },
        onLineChange: function(a) {
            this.context.lineWidth = a.currentTarget.value, this.linePickerPreview && (this.linePickerPreview.innerHTML = Math.round(this.context.lineWidth / 20 * 100) + "%"), this.config.thickness !== this.context.lineWidth && (this.config.thickness = this.context.lineWidth, this.saveData())
        },
        onLineUpdate: function(a) {
            this.linePickerPreview && (this.linePickerPreview.innerHTML = Math.round(a.currentTarget.value / 20 * 100) + "%")
        },
        updatePaintStyle: function() {
            null !== this.selectedColorOption && null !== this.selectedAlphaOption && (this.cursor.fillStyle = "rgba(" + this.selectedColorOption.r + "," + this.selectedColorOption.g + "," + this.selectedColorOption.b + "," + this.selectedAlphaOption + ")", this.context.strokeStyle = "rgba(" + this.selectedColorOption.r + "," + this.selectedColorOption.g + "," + this.selectedColorOption.b + "," + this.selectedAlphaOption + ")", this.context.fillStyle = "rgba(" + this.selectedColorOption.r + "," + this.selectedColorOption.g + "," + this.selectedColorOption.b + "," + this.selectedAlphaOption + ")")
        },
        addMouseEventListener: function() {
            var b = Function.prototype.bind.call(this.handleMouseDown, this),
                c = Function.prototype.bind.call(this.handleMouseMove, this),
                d = Function.prototype.bind.call(this.handleMouseUp, this),
                e = Function.prototype.bind.call(this.handleMouseLeave, this);
            this.canvas.addEventListener("mousedown", b), this.canvas.addEventListener("touchstart", b), this.canvas.addEventListener("mousemove", c), this.canvas.addEventListener("touchmove", c), this.canvas.addEventListener("mouseup", d), this.canvas.addEventListener("touchend", d), this.canvas.addEventListener("mouseleave", e), a.document.addEventListener("keydown", this.keydownBinded), a.document.addEventListener("keypress", this.keypressBinded)
        },
        initMessageHandler: function() {
            "undefined" != typeof self && null !== self && self.port ? (self.port.on("get_pixel_color_response", this.setColorBinded), self.port.on("get_data_response", this.renderBinded)) : "undefined" == typeof chrome && a.addEventListener("message", this.handlePostMessageResponseBinded, !1)
        },
        matchOutlineColor: function(a, b, c, d) {
            return 255 !== a && 255 !== b && 255 !== c && 0 !== d
        },
        handleFill: function(a) {
            var b = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height),
                c = 4 * (a.y * this.canvas.width + a.x),
                d = b.data[c],
                e = b.data[c + 1],
                f = b.data[c + 2],
                g = b.data[c + 3],
                h = {
                    r: this.selectedColorOption.r,
                    g: this.selectedColorOption.g,
                    b: this.selectedColorOption.b,
                    a: Math.round(255 * this.selectedAlphaOption)
                };
            d === h.r && e === h.g && f === h.b && g === h.a || this.matchOutlineColor(d, e, f, g) || (this.floodFill(a.x, a.y, d, e, f, g, b, h), this.context.putImageData(b, 0, 0), this.storeCanvas(), this.storeHistory())
        },
        matchStartColor: function(a, b, c, d, e, f, g) {
            var h = f.data[a],
                i = f.data[a + 1],
                j = f.data[a + 2],
                k = f.data[a + 3];
            return !this.matchOutlineColor(h, i, j, k) && (h === b && i === c && j === d && k === e || (h !== g.r || i !== g.g || j !== g.b || k !== g.a))
        },
        floodFill: function(a, b, c, d, e, f, g, h) {
            for (var i, j, k, l, m, n, o = 0, p = 0, q = this.canvas.width - 1, r = this.canvas.height - 1, s = [
                    [a, b]
                ]; s.length;) {
                for (i = s.pop(), j = i[0], k = i[1], l = 4 * (k * this.canvas.width + j); k >= p && this.matchStartColor(l, c, d, e, f, g, h);) k -= 1, l -= 4 * this.canvas.width;
                for (l += 4 * this.canvas.width, k += 1, m = !1, n = !1; k <= r && this.matchStartColor(l, c, d, e, f, g, h);) k += 1, this.colorPixel(l, h.r, h.g, h.b, h.a, g), j > o && (this.matchStartColor(l - 4, c, d, e, f, g, h) ? m || (s.push([j - 1, k]), m = !0) : m && (m = !1)), j < q && (this.matchStartColor(l + 4, c, d, e, f, g, h) ? n || (s.push([j + 1, k]), n = !0) : n && (n = !1)), l += 4 * this.canvas.width
            }
        },
        colorPixel: function(a, b, c, d, e, f) {
            f.data[a] = b, f.data[a + 1] = c, f.data[a + 2] = d, f.data[a + 3] = void 0 !== e ? e : 255
        },
        handleKeyDown: function(a) {
            this.paragraph && (8 !== a.keyCode && 13 !== a.keyCode || a.preventDefault(), 8 === a.keyCode ? this.paragraph.backspace() : 13 === a.keyCode && this.paragraph.newline())
        },
        handleKeyPress: function(a) {
            if (this.paragraph) {
                var b = String.fromCharCode(a.which);
                if (8 !== a.keyCode && !a.ctrlKey && !a.metaKey) {
                    a.preventDefault();
                    var c = this.drawOptions[this.selectedDrawOption];
                    this.context.font = c.minSize + (c.maxSize - c.minSize) * this.context.lineWidth / 20 + "px " + c.font, this.paragraph.insert(b)
                }
            }
        },
        handleMouseDown: function(b) {
            b.preventDefault(), this.mousedown = !0;
            var c = this.drawOptions[this.selectedDrawOption];
            if (this.lastMouseDownLoc = this.windowToCanvas("undefined" == typeof b.clientX ? b.touches[0].clientX : b.clientX, "undefined" == typeof b.clientY ? b.touches[0].clientY : b.clientY), "pen" === c.type) this.context.beginPath(), this.context.moveTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y + 16);
            else if ("eyedropper" === c.type) this.getColorOfCurrentPixel({
                x: Math.round(a.devicePixelRatio * ("undefined" == typeof b.clientX ? b.touches[0].clientX : b.clientX - 2)),
                y: Math.round(a.devicePixelRatio * ("undefined" == typeof b.clientY ? b.touches[0].clientY : b.clientY + 22))
            });
            else if ("line" === c.type) this.storeCanvas();
            else if ("quadratic_curve" === c.type) {
                if (0 === c.iteration) this.storeCanvas(), c.initLoc = {
                    x: this.lastMouseDownLoc.x,
                    y: this.lastMouseDownLoc.y
                };
                else if (1 !== c.iteration) throw new Error("invalid iteration")
            } else if ("bezier_curve" === c.type) {
                if (0 === c.iteration) this.storeCanvas(), c.initLoc = {
                    x: this.lastMouseDownLoc.x,
                    y: this.lastMouseDownLoc.y
                };
                else if (1 === c.iteration);
                else if (2 !== c.iteration) throw new Error("invalid iteration")
            } else if ("polygon" === c.type) this.storeCanvas(), c.lastLoc ? (this.context.beginPath(), this.context.moveTo(c.lastLoc.x, c.lastLoc.y), this.context.lineTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y), this.context.stroke()) : (c.lastLoc = {
                x: this.lastMouseDownLoc.x,
                y: this.lastMouseDownLoc.y
            }, c.initLoc = {
                x: this.lastMouseDownLoc.x,
                y: this.lastMouseDownLoc.y
            });
            else if ("circle" === c.type) this.storeCanvas();
            else if ("rectangle" === c.type) this.storeCanvas();
            else if ("eraser" === c.type) this.restoreCanvas(), this.context.save(), this.context.translate(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y), this.context.clearRect(0, 0, c.width, c.height), this.context.restore();
            else if ("fill" === c.type) this.handleFill(this.lastMouseDownLoc);
            else if ("text" === c.type)
                if (this.cursor.erase(this.context, this.drawingSurfaceImageData), this.storeCanvas(), this.paragraph && this.paragraph.isPointInside(this.lastMouseDownLoc)) this.paragraph.moveCursorCloseTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y);
                else {
                    this.paragraph && (this.paragraph.clearIntervals(), this.paragraph = null);
                    var d = this.context.measureText("W").width;
                    d += d / 6, this.paragraph = new Paragraph(this.context, this.lastMouseDownLoc.x, this.lastMouseDownLoc.y - d, this.drawingSurfaceImageData, this.cursor), this.paragraph.addLine(new TextLine(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y))
                }
        },
        handleMouseMove: function(a) {
            a.preventDefault();
            var b = this.drawOptions[this.selectedDrawOption],
                c = this.windowToCanvas("undefined" == typeof a.clientX ? a.touches[0].clientX : a.clientX, "undefined" == typeof a.clientY ? a.touches[0].clientY : a.clientY);
            this.setLineProperty(), this.mousedown || "eraser" !== b.type || (this.restoreCanvas(), this.context.save(), this.context.translate(c.x, c.y), this.context.clearRect(0, 0, b.width, b.height), this.context.restore()), "quadratic_curve" === b.type ? 1 === b.iteration && b.lastLoc && (this.restoreCanvas(), this.context.beginPath(), this.context.moveTo(b.initLoc.x, b.initLoc.y), this.context.quadraticCurveTo(c.x, c.y, b.lastLoc.x, b.lastLoc.y), this.context.stroke()) : "bezier_curve" === b.type && (1 === b.iteration && b.firstPoint ? (this.restoreCanvas(), this.context.beginPath(), this.context.moveTo(b.initLoc.x, b.initLoc.y), this.context.quadraticCurveTo(c.x, c.y, b.firstPoint.x, b.firstPoint.y), this.context.stroke()) : 2 === b.iteration && b.firstPoint && b.lastPoint && (this.restoreCanvas(), this.context.beginPath(), this.context.moveTo(b.initLoc.x, b.initLoc.y), this.context.bezierCurveTo(b.lastPoint.x, b.lastPoint.y, c.x, c.y, b.firstPoint.x, b.firstPoint.y), this.context.stroke())), this.mousedown && ("pen" === b.type ? (this.restoreCanvas(), this.context.lineTo(c.x, c.y + 16), this.context.stroke()) : "line" === b.type ? (this.restoreCanvas(), this.context.beginPath(), this.context.moveTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y), this.context.lineTo(c.x, c.y), this.context.stroke()) : "quadratic_curve" === b.type && 0 === b.iteration ? (this.restoreCanvas(), this.context.beginPath(), this.context.moveTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y), this.context.lineTo(c.x, c.y), this.context.stroke()) : "bezier_curve" === b.type && 0 === b.iteration ? (this.restoreCanvas(), this.context.beginPath(), this.context.moveTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y), this.context.lineTo(c.x, c.y), this.context.stroke()) : "polygon" === b.type ? (this.restoreCanvas(), this.context.beginPath(), this.context.moveTo(b.lastLoc.x, b.lastLoc.y), this.context.lineTo(c.x, c.y), this.context.stroke()) : "circle" === b.type ? (this.restoreCanvas(), this.drawEllipse(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y, c.x - this.lastMouseDownLoc.x, c.y - this.lastMouseDownLoc.y)) : "rectangle" === b.type ? (this.restoreCanvas(), this.context.beginPath(), this.context.moveTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y), this.context.lineTo(this.lastMouseDownLoc.x, c.y), this.context.lineTo(c.x, c.y), this.context.lineTo(c.x, this.lastMouseDownLoc.y), this.context.lineTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y), this.context.stroke()) : "eraser" === b.type && (this.context.save(), this.context.translate(c.x, c.y), this.context.clearRect(0, 0, b.width, b.height), this.context.restore()))
        },
        handleMouseUp: function(a) {
            a.preventDefault(), this.mousedown = !1;
            var b = this.drawOptions[this.selectedDrawOption],
                c = this.windowToCanvas("undefined" == typeof a.clientX ? a.changedTouches[0].clientX : a.clientX, "undefined" == typeof a.clientY ? a.changedTouches[0].clientY : a.clientY);
            "pen" === b.type ? (this.context.closePath(), this.storeCanvas(), this.storeHistory()) : "line" === b.type ? (this.context.closePath(), this.storeCanvas(), this.storeHistory()) : "quadratic_curve" === b.type ? 0 === b.iteration ? (b.lastLoc = {
                x: c.x,
                y: c.y
            }, b.iteration++) : 1 === b.iteration && (this.context.closePath(), this.storeCanvas(), this.storeHistory(), b.iteration = 0, b.initLoc = null, b.lastLoc = null) : "bezier_curve" === b.type ? 0 === b.iteration ? (b.firstPoint = {
                x: c.x,
                y: c.y
            }, b.iteration++) : 1 === b.iteration ? (b.lastPoint = {
                x: c.x,
                y: c.y
            }, b.iteration++) : 2 === b.iteration && (this.context.closePath(), this.storeCanvas(), this.storeHistory(), b.iteration = 0, b.initLoc = null, b.firstPoint = null, b.lastPoint = null) : "polygon" === b.type ? (this.storeCanvas(), this.storeHistory(), b.lastLoc = {
                x: c.x,
                y: c.y
            }) : "circle" === b.type ? (this.storeCanvas(), this.storeHistory()) : "rectangle" === b.type ? (this.context.closePath(), this.storeCanvas(), this.storeHistory()) : "eraser" === b.type && (this.storeCanvas(), this.storeHistory())
        },
        handleMouseLeave: function() {
            var a = this.drawOptions[this.selectedDrawOption];
            "eraser" === a.type && this.restoreCanvas()
        },
        setLineProperty: function() {
            this.context.lineJoin = "round", this.context.lineCap = "round"
        },
        drawEllipse: function(a, b, c, d) {
            var e = .5522848,
                f = c / 2 * e,
                g = d / 2 * e,
                h = a + c,
                i = b + d,
                j = a + c / 2,
                k = b + d / 2;
            this.context.beginPath(), this.context.moveTo(a, k), this.context.bezierCurveTo(a, k - g, j - f, b, j, b), this.context.bezierCurveTo(j + f, b, h, k - g, h, k), this.context.bezierCurveTo(h, k + g, j + f, i, j, i), this.context.bezierCurveTo(j - f, i, a, k + g, a, k), this.context.stroke()
        },
        addClass: function(a, b) {
            a.className.indexOf(b) >= 0 || (a.className = a.className + " " + b)
        },
        removeClass: function(a, b) {
            a.className = a.className.replace(new RegExp("\\b" + b + "\\b", "g"), "")
        },
        triggerClick: function(a) {
            this.triggerEvent(a, "click")
        },
        triggerEvent: function(a, b) {
            var c;
            document.createEvent ? (c = document.createEvent("HTMLEvents"), c.initEvent(b, !0, !0)) : document.createEventObject && (c = document.createEventObject(), c.eventType = b), c.eventName = b, a.dispatchEvent ? a.dispatchEvent(c) : a.fireEvent && htmlEvents["on" + b] ? a.fireEvent("on" + c.eventType, c) : a[b] ? a[b]() : a["on" + b] && a["on" + b]()
        },
        initDragging: function() {
            this.panel.addEventListener("mousedown", this.handleDraggingStart), this.panel.addEventListener("touchstart", this.handleDraggingStart), a.document.addEventListener("mouseup", this.handleDragDone), a.document.addEventListener("touchend", this.handleDragDone);
        },
        handleDraggingStart: function(a) {
            c.pos_x = this.getBoundingClientRect().left - ("undefined" == typeof a.clientX ? a.touches[0].clientX : a.clientX), c.pos_y = this.getBoundingClientRect().top - ("undefined" == typeof a.clientY ? a.touches[0].clientY : a.clientY), this.addEventListener("mousemove", c.handleDragging), this.addEventListener("touchmove", c.handleDragging)
        },
        handleDragging: function(a) {
            "INPUT" !== a.target.nodeName.toUpperCase() && (a.preventDefault(), this.style.top = ("undefined" == typeof a.clientY ? a.touches[0].clientY : a.clientY) + c.pos_y + "px", this.style.left = ("undefined" == typeof a.clientX ? a.touches[0].clientX : a.clientX) + c.pos_x + "px")
        },
        handleDragDone: function(a) {
            c.panel.removeEventListener("mousemove", c.handleDragging), c.panel.removeEventListener("touchmove", c.handleDragging)
        },
        windowToCanvas: function(a, b) {
            var c = this.canvas.getBoundingClientRect();
            return {
                x: Math.round(a) - c.left * (this.canvas.width / c.width),
                y: Math.round(b) - c.top * (this.canvas.height / c.height)
            }
        },
        handlePostMessageResponse: function(b) {
            if (b.origin === a.location.origin) {
                var c = b.data;
                "get_pixel_color_response" === c.method ? this.setColor(c.response) : "get_data_response" === c.method && this.render(c.response)
            }
        },
        exit: function() {
            this.canvas.parentNode.removeChild(this.canvas), this.panel.parentNode.removeChild(this.panel), a.document.removeEventListener("keydown", this.keydownBinded), a.document.removeEventListener("keypress", this.keypressBinded), a.document.removeEventListener("mouseup", this.handleDragDone), a.removeEventListener("resize", this.resizeBinded), a.removeEventListener("scroll", this.resizeBinded), this.canvas = null, this.context = null, this.selectedDrawOption = null, this.selectedColorOption = null, this.selectedAlphaOption = null, this.mousedown = !1, this.lastMouseDownLoc = null, this.drawingSurfaceImageData = null, this.paragraph = null, this.panel = null, this.initialized = !1, "undefined" != typeof self && null !== self && self.port ? (self.port.removeListener("get_pixel_color_response", this.setColorBinded), self.port.removeListener("get_data_response", this.renderBinded)) : "undefined" == typeof chrome && a.removeEventListener("message", this.handlePostMessageResponseBinded), "undefined" != typeof unsafeWindow && null !== unsafeWindow && (unsafeWindow.NOTEPAD_INIT = !1)
        },
        saveData: function() {
            "undefined" != typeof chrome ? chrome.runtime.sendMessage({
                method: "save_data",
                config: this.config
            }) : "undefined" != typeof self && null !== self && self.port ? self.port.emit("save_data", {
                config: this.config
            }) : a.postMessage({
                method: "save_data",
                config: this.config
            }, a.location.origin)
        },
        render: function(a) {
            this.config = a || {}, this.createCanvas(), this.setLineProperty(), this.createControlPanel(), this.initDragging(), this.addMouseEventListener()
        },
        initConfig: function() {
            "undefined" != typeof chrome ? chrome.runtime.sendMessage({
                method: "get_data"
            }, this.renderBinded) : "undefined" != typeof self && null !== self && self.port ? self.port.emit("get_data") : a.postMessage({
                method: "get_data"
            }, a.location.origin)
        },
        init: function() {
            this.history = new b, this.CSSAnimationManager = getCSSAnimationManager(), this.setColorBinded = Function.prototype.bind.call(this.setColor, this), this.renderBinded = Function.prototype.bind.call(this.render, this), this.handlePostMessageResponseBinded = Function.prototype.bind.call(this.handlePostMessageResponse, this), this.keydownBinded = Function.prototype.bind.call(this.handleKeyDown, this), this.keypressBinded = Function.prototype.bind.call(this.handleKeyPress, this), this.resizeBinded = Function.prototype.bind.call(function() {
                this.resizeTimeoutID && (this.resizeTimeoutID = a.clearTimeout(this.resizeTimeoutID)), this.resizeTimeoutID = a.setTimeout(Function.prototype.bind.call(this.handleResize, this), 200)
            }, this), this.initMessageHandler(), this.initConfig(), this.initialized = !0, "undefined" != typeof unsafeWindow && null !== unsafeWindow && (unsafeWindow.NOTEPAD_INIT = !0)
        }
    };
    return c
});