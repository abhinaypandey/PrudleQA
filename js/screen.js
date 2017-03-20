! function() {
    function a(a, b) {
        a.className.indexOf(b) >= 0 || (a.className = a.className + " " + b)
    }

    function b(a, b) {
        a.className = a.className.replace(new RegExp("\\b" + b + "\\b", "g"), "")
    }

    function c() {
        d();
        var a = s.naturalWidth,
            b = s.naturalHeight;
        u.width = a, u.height = b, K.drawImage(s, 0, 0)
    }

    function d() {
        L = [], M = 0, N = null, O = null, P = !1, t = new Image, b(u, "crop"), a(A, "hide"), a(B, "hide"), b(z, "hide"), u.removeEventListener("mousedown", i), u.removeEventListener("touchstart", i), u.removeEventListener("mousemove", k), u.removeEventListener("touchmove", k), u.removeEventListener("mouseup", l), u.removeEventListener("touchend", l)
    }

    function e() {
        K.clearRect(0, 0, u.width, u.height), K.drawImage(v, 0, 0)
    }

    function f() {
        v.width = u.width, v.height = u.height, v.getContext("2d").drawImage(u, 0, 0)
    }

    function g(a, b) {
        var c = u.getBoundingClientRect();
        return {
            x: Math.round(a) - c.left * (u.width / c.width),
            y: Math.round(b) - c.top * (u.height / c.height)
        }
    }

    function h() {
        a(u, "crop"), b(A, "hide"), a(z, "hide"), L = [], M = 0, L.push(u.toDataURL()), t.src = s.src, f(), j(), u.addEventListener("mousedown", i), u.addEventListener("touchstart", i), u.addEventListener("mousemove", k), u.addEventListener("touchmove", k), u.addEventListener("mouseup", l), u.addEventListener("touchend", l), o()
    }

    function i(b) {
        b.preventDefault(), a(B, "hide"), e(), N = g("undefined" == typeof b.clientX ? b.touches[0].clientX : b.clientX, "undefined" == typeof b.clientY ? b.touches[0].clientY : b.clientY), P = !0, j()
    }

    function j() {
        K.save(), K.globalAlpha = .5, K.fillStyle = "black", K.fillRect(0, 0, u.width, u.height), K.restore()
    }

    function k(a) {
        a.preventDefault();
        var b = g("undefined" == typeof a.clientX ? a.touches[0].clientX : a.clientX, "undefined" == typeof a.clientY ? a.touches[0].clientY : a.clientY);
        if (P) {
            var c = Math.min(N.x, b.x),
                d = Math.max(N.x, b.x),
                f = Math.min(N.y, b.y),
                h = Math.max(N.y, b.y);
            e(), j(), K.save(), K.beginPath(), K.rect(c, f, d - c, h - f), K.clip(), K.drawImage(t, 0, 0), K.restore()
        }
    }

    function l(a) {
        a.preventDefault();
        var c = "undefined" == typeof a.clientX ? a.changedTouches[0].clientX : a.clientX,
            d = "undefined" == typeof a.clientY ? a.changedTouches[0].clientY : a.clientY;
        O = g(c, d), P = !1, B.style.top = d + "px", B.style.left = c + "px", b(B, "hide")
    }

    function m() {
        var b = Math.min(N.x, O.x),
            c = Math.max(N.x, O.x),
            d = Math.min(N.y, O.y),
            e = Math.max(N.y, O.y);
        a(B, "hide");
        var g = new Image;
        g.src = u.toDataURL(), g.onload = function() {
            K.clearRect(0, 0, u.width, u.height), u.width = c - b, u.height = e - d, K.drawImage(g, b, d, c - b, e - d, 0, 0, c - b, e - d), f(), L.push(u.toDataURL()), M = L.length - 1, t.src = L[M], o()
        }
    }

    function n() {
        a(B, "hide"), e()
    }

    function o() {
        L.length && 0 !== M ? b(C, "disabled") : a(C, "disabled"), L.length && M !== L.length - 1 ? b(D, "disabled") : a(D, "disabled")
    }

    function p() {
        if (L.length && 0 !== M) {
            var a = L[--M],
                b = new Image;
            b.src = a, t.src = a, b.onload = function() {
                K.clearRect(0, 0, u.width, u.height), u.width = b.naturalWidth, u.height = b.naturalHeight, K.drawImage(b, 0, 0), f()
            }, o()
        }
    }

    function q() {
        if (L.length && M !== L.length - 1) {
            var a = L[++M],
                b = new Image;
            b.src = a, t.src = a, b.onload = function() {
                K.clearRect(0, 0, u.width, u.height), u.width = b.naturalWidth, u.height = b.naturalHeight, K.drawImage(b, 0, 0), f()
            }, o()
        }
    }

    function r() {
        s.src === L[M] ? c() : s.src = L[M]
    }
    var s = new Image,
        t = new Image,
        u = document.getElementById("target"),
        v = document.createElement("canvas"),
        w = document.getElementById("download"),
        x = document.getElementById("print"),
        y = document.getElementById("crop"),
        z = document.getElementById("controls"),
        A = document.getElementById("cropControls"),
        B = document.getElementById("confirmControls"),
        C = document.getElementById("crop-back"),
        D = document.getElementById("crop-forward"),
        E = document.getElementById("crop-stop"),
        F = document.getElementById("confirm-crop"),
        G = document.getElementById("cancel-crop"),
        H = document.getElementById("instruction"),
        I = document.getElementById("boxclose"),
        J = document.getElementById("copyToClipboard"),
        K = u.getContext("2d"),
        L = [],
        M = 0,
        N = null,
        O = null,
        P = !1;
    ! function() {
        s.addEventListener("load", c, !1), chrome.runtime.onMessage.addListener(function(a, b, c) {
            "update_url" === a.method && (s.src = a.url, c({
                success: !0
            }))
        }), w.addEventListener("click", function() {            
            var a = document.createElement("a");
            a.download = "screenshot.jpg", a.href = s.src, a.click()
        }), x.addEventListener("click", function() {
            window.print()
        }), J.addEventListener("click", function() {
            a(H, "visible")
        }), I.addEventListener("click", function() {
            b(H, "visible")
        }), y.addEventListener("click", h), F.addEventListener("click", m), G.addEventListener("click", n), C.addEventListener("click", p), D.addEventListener("click", q), E.addEventListener("click", r)
    }()
}();