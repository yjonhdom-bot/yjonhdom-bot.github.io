(function () {
  "use strict";

  var cfg = window.TS_EMAILJS || {};
  var inited = false;

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
        console.warn("emailjs init:", err);
      }
    }
    inited = true;
  }

  function field(form, name) {
    var el = form.elements.namedItem(name);
    return el && el.value ? String(el.value).trim() : "";
  }

  function showAlert(form, msg, type) {
    var alertEl = form.querySelector("[data-form-alert]");
    if (!alertEl) return;
    alertEl.hidden = false;
    alertEl.textContent = msg;
    alertEl.classList.remove("is-success", "is-error");
    if (type) alertEl.classList.add("is-" + type);
  }

  function clearAlert(form) {
    var alertEl = form.querySelector("[data-form-alert]");
    if (!alertEl) return;
    alertEl.hidden = true;
    alertEl.textContent = "";
    alertEl.classList.remove("is-success", "is-error");
  }

  function markQuoted() {
    try {
      sessionStorage.setItem("tsq_done", "1");
      localStorage.setItem("tsq_submitted", "1");
      localStorage.setItem("tsq_seen", "1");
    } catch (_) {}
  }

  function payloadFor(form) {
    var kind = form.getAttribute("data-emailjs") || "inquiry";
    var email = field(form, "email");
    var category = field(form, "category");
    var message = field(form, "message");
    var source = field(form, "source") || kind;
    if (kind === "newsletter") {
      message = "[newsletter] New list signup — garment accessories";
    } else if (kind === "contact" && message) {
      message = "[contact] " + message;
    } else if (category) {
      message = "[" + category + "] " + (message || "Quote request");
    }
    return {
      name: field(form, "name") || "N/A",
      email: email,
      website: field(form, "website") || window.location.href,
      whatsapp: field(form, "phone") || field(form, "whatsapp") || "N/A",
      company: field(form, "company") || "N/A",
      country: field(form, "country") || "N/A",
      message: message || "[" + source + "] Inquiry",
      reply_to: email,
      title: kind === "newsletter" ? "TrimGem Newsletter" : "TrimGem Accessory Inquiry",
      time: new Date().toISOString(),
    };
  }

  function bindForm(form) {
    var submitBtn = form.querySelector('[type="submit"]');
    var sending = false;
    var submitLabel = submitBtn ? submitBtn.textContent : cfg.submitLabel;

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (sending) return;
      clearAlert(form);

      var email = field(form, "email");
      var kind = form.getAttribute("data-emailjs");
      var needsMessage = kind !== "newsletter";
      var websiteEl = form.elements.namedItem("website");
      if (websiteEl && !String(websiteEl.value || "").trim()) {
        websiteEl.value = window.location.href;
      }
      if (!email || (needsMessage && !field(form, "message")) || !form.checkValidity()) {
        form.reportValidity();
        showAlert(form, kind === "newsletter"
          ? (cfg.popupRequired || cfg.requiredText || "Please enter your email.")
          : (cfg.requiredText || "Please fill in the required fields."), "error");
        return;
      }
      if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) {
        showAlert(form, cfg.errorText || "Form is not configured.", "error");
        return;
      }

      sending = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        if (!submitBtn.querySelector("i")) {
          submitBtn.textContent = cfg.sendingLabel || "Sending…";
        }
      }

      ensureEmailJs()
        .then(function (emailjs) {
          initEmailJs(emailjs);
          return emailjs.send(cfg.serviceId, cfg.templateId, payloadFor(form));
        })
        .then(function () {
          form.reset();
          markQuoted();
          var ok = kind === "newsletter" ? cfg.newsletterSuccess : cfg.successText;
          showAlert(form, ok || "Thanks — we will write back shortly.", "success");
          var legacy = form.querySelector(".ts-form__ok");
          if (legacy) legacy.hidden = false;
        })
        .catch(function (err) {
          console.warn("emailjs send:", err);
          var detail = (err && (err.text || err.message)) || "";
          showAlert(
            form,
            (cfg.errorText || "Something went wrong. Please try again.") + (detail ? " (" + detail + ")" : ""),
            "error"
          );
        })
        .finally(function () {
          sending = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            if (!submitBtn.querySelector("i")) {
              submitBtn.textContent = submitLabel || cfg.submitLabel || "Submit";
            }
          }
        });
    });
  }

  document.querySelectorAll("[data-emailjs]").forEach(bindForm);
  ensureEmailJs().then(initEmailJs).catch(function () {});
})();
