(function () {
  "use strict";

  var modal = document.getElementById("ts-quote-modal");
  var form = document.getElementById("ts-quote-popup-form");
  if (!modal || !form) return;
  if (document.getElementById("ts-inquiry-form")) return;

  var cfg = window.TS_EMAILJS || {};
  var dialog = modal.querySelector(".ts-quote-modal__dialog");
  var alertEl = document.getElementById("ts-qp-alert");
  var submitBtn = document.getElementById("ts-qp-submit");
  var sourceEl = document.getElementById("ts-qp-source");
  var submitLabel = submitBtn ? submitBtn.textContent : cfg.popupSubmit;

  var SK_DONE = "tsq_done";
  var SK_STAY = "tsq_stay";
  var SK_EXIT = "tsq_exit";
  var LK_DONE = "tsq_submitted";

  var open = false;
  var sending = false;
  var inited = false;
  var lastFocus = null;
  var stayTimer = null;

  function storeGet(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }
  function storeSet(key, val) {
    try {
      sessionStorage.setItem(key, val);
    } catch (_) {}
  }
  function localGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }
  function localSet(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (_) {}
  }

  function alreadyQuoted() {
    return storeGet(SK_DONE) === "1" || localGet(LK_DONE) === "1";
  }

  function fieldValue(id) {
    var el = document.getElementById(id);
    return el && el.value ? String(el.value).trim() : "";
  }

  function showAlert(msg, type) {
    if (!alertEl) return;
    alertEl.hidden = false;
    alertEl.textContent = msg;
    alertEl.classList.remove("is-success", "is-error");
    if (type) alertEl.classList.add("is-" + type);
  }

  function clearAlert() {
    if (!alertEl) return;
    alertEl.hidden = true;
    alertEl.textContent = "";
    alertEl.classList.remove("is-success", "is-error");
  }

  function openModal(mode) {
    if (open || alreadyQuoted()) return;
    if (mode === "stay" && storeGet(SK_STAY) === "1") return;
    if (mode === "exit" && storeGet(SK_EXIT) === "1") return;
    if (sourceEl) sourceEl.value = mode === "exit" ? "quote-popup-exit" : "quote-popup-stay";
    clearAlert();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("is-quote-open");
    open = true;
    storeSet(mode === "exit" ? SK_EXIT : SK_STAY, "1");
    window.requestAnimationFrame(function () {
      if (window.matchMedia("(pointer: coarse)").matches) return;
      var first = document.getElementById("ts-qp-email") || dialog;
      if (first && typeof first.focus === "function") first.focus();
    });
  }

  function closeModal() {
    if (!open) return;
    modal.hidden = true;
    document.body.classList.remove("is-quote-open");
    open = false;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function ensureEmailJs() {
    return new Promise(function (resolve, reject) {
      if (window.emailjs && typeof window.emailjs.send === "function") {
        resolve(window.emailjs);
        return;
      }
      var tries = 0;
      var timer = setInterval(function () {
        tries += 1;
        if (window.emailjs && typeof window.emailjs.send === "function") {
          clearInterval(timer);
          resolve(window.emailjs);
        } else if (tries > 80) {
          clearInterval(timer);
          reject(new Error("EmailJS SDK failed to load"));
        }
      }, 50);
    });
  }

  function initEmailJs(emailjs) {
    if (inited || !emailjs || typeof emailjs.init !== "function") return;
    try {
      emailjs.init({ publicKey: cfg.publicKey });
    } catch (_) {
      try {
        emailjs.init(cfg.publicKey);
      } catch (err) {
        console.warn("quote-popup emailjs init:", err);
      }
    }
    inited = true;
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (sending) return;
    clearAlert();

    var email = fieldValue("ts-qp-email");
    if (!email || !form.checkValidity()) {
      form.reportValidity();
      showAlert(cfg.popupRequired || "Please enter your email.", "error");
      return;
    }
    if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) {
      showAlert(cfg.errorText || "Form is not configured.", "error");
      return;
    }

    var source = fieldValue("ts-qp-source") || "quote-popup";
    var payload = {
      name: "N/A",
      email: email,
      website: fieldValue("ts-qp-website") || window.location.href,
      whatsapp: "N/A",
      company: "N/A",
      country: "N/A",
      message: "[" + source + "] New customer signup — garment accessories",
      reply_to: email,
      title: "TrimGem New Customer Signup",
      time: new Date().toISOString(),
    };

    sending = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = cfg.sendingLabel || "Sending…";
    }

    ensureEmailJs()
      .then(function (emailjs) {
        initEmailJs(emailjs);
        return emailjs.send(cfg.serviceId, cfg.templateId, payload);
      })
      .then(function () {
        form.reset();
        storeSet(SK_DONE, "1");
        localSet(LK_DONE, "1");
        showAlert(cfg.popupSuccess || "Thanks! We'll email you shortly.", "success");
        window.setTimeout(closeModal, 1600);
      })
      .catch(function (err) {
        console.warn("quote-popup emailjs:", err);
        var detail = (err && (err.text || err.message)) || "";
        showAlert(
          (cfg.errorText || "Something went wrong. Please try again.") + (detail ? " (" + detail + ")" : ""),
          "error"
        );
      })
      .finally(function () {
        sending = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel || cfg.popupSubmit || "SUBMIT";
        }
      });
  });

  modal.querySelectorAll("[data-ts-quote-close]").forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });

  if (!alreadyQuoted()) {
    stayTimer = window.setTimeout(function () {
      var showStay = function () {
        openModal("stay");
      };
      if (document.visibilityState === "visible") {
        showStay();
        return;
      }
      var onVis = function () {
        if (document.visibilityState !== "visible") return;
        document.removeEventListener("visibilitychange", onVis);
        showStay();
      };
      document.addEventListener("visibilitychange", onVis);
    }, 6000);

    document.documentElement.addEventListener("mouseleave", function (e) {
      if (e.clientY > 12) return;
      if (open) return;
      if (stayTimer) {
        window.clearTimeout(stayTimer);
        stayTimer = null;
      }
      openModal("exit");
    });
  }

  ensureEmailJs().then(initEmailJs).catch(function () {});
})();
