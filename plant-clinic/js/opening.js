var PPC = PPC || {};

// A presentation-only prologue. It never reads/writes progress or starts a case.
PPC.Opening = (function () {
  var root = null, phase = null, timers = [], generation = 0;
  var stage = document.getElementById("stage"), previousStage = null;
  var motion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  function node(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text) el.textContent = text;
    return el;
  }

  function schedule(fn, delay) {
    var ticket = generation;
    timers.push(setTimeout(function () { if (root && ticket === generation) fn(); }, delay));
  }

  function dismiss() {
    generation++;
    timers.forEach(clearTimeout);
    timers = [];
    document.removeEventListener("keydown", onKey, true);
    if (motion && motion.removeEventListener) motion.removeEventListener("change", onMotionChange);
    if (root) root.remove();
    root = null;
    phase = null;
    if (previousStage) {
      stage.inert = previousStage.inert;
      if (previousStage.aria === null) stage.removeAttribute("aria-hidden");
      else stage.setAttribute("aria-hidden", previousStage.aria);
      previousStage = null;
    }
  }

  function finish() {
    if (!root) return;
    dismiss();
    // Keep the existing patient cards, tutorial entry, labels and ordering intact.
    PPC.UI.menu();
  }

  function onMotionChange() {
    if (motion.matches && phase === "opening") finish();
  }

  function onKey(event) {
    if (!root) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (phase === "opening") finish();
      return;
    }
    if (event.key !== "Tab") return;
    var buttons = Array.prototype.slice.call(root.querySelectorAll("button:not([disabled]):not([hidden])"));
    if (!buttons.length) return;
    var first = buttons[0], last = buttons[buttons.length - 1];
    if (!root.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openClinic() {
    if (phase !== "title") return;
    phase = "opening";
    root.dataset.phase = phase;
    root.dataset.beat = "sign";
    root.querySelector("[data-opening-action=open]").disabled = true;
    var skip = root.querySelector("[data-opening-action=skip]");
    skip.hidden = false;
    skip.focus({ preventScroll: true });
    var status = root.querySelector("#opening-status");
    status.textContent = "Turning the sign. A new day begins.";
    if (motion && motion.matches) { finish(); return; }
    schedule(function () {
      root.dataset.beat = "lamp";
      status.textContent = "A little light for a closer look.";
    }, 700);
    schedule(function () {
      root.dataset.beat = "book";
      status.textContent = "The clinic is open. Let’s meet today’s patients.";
    }, 1400);
    schedule(function () { root.dataset.departing = "true"; }, 2400);
    schedule(finish, 2600);
  }

  function show() {
    // Reopening the title must never interrupt a patient's running timer.
    if (PPC.Game.getState()) return false;
    dismiss();
    PPC.UI.clearAll();
    PPC.UI.hudClear();
    phase = "title";
    root = node("section", "clinic-opening");
    root.id = "clinic-opening";
    root.dataset.phase = phase;
    root.dataset.beat = "closed";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "opening-title");
    root.setAttribute("aria-describedby", "opening-tagline");

    var room = node("div", "opening-room");
    room.setAttribute("aria-hidden", "true");
    // The workbench PNG is transparent: preserve the room -> counter layering.
    ["clinic-room.png", "clinic-workbench.png"].forEach(function (file) {
      var art = node("img", "opening-room-art");
      art.src = "assets/" + file;
      art.alt = "";
      art.draggable = false;
      art.onerror = function () { this.hidden = true; };
      room.appendChild(art);
    });
    room.appendChild(node("div", "opening-lamp-glow"));
    room.appendChild(node("div", "opening-lamp-pool"));

    var ledger = node("div", "opening-ledger");
    var leftPage = node("div", "ledger-page ledger-left");
    leftPage.appendChild(node("span", "ledger-leaf", "❧"));
    leftPage.appendChild(node("span", "ledger-rule"));
    var rightPage = node("div", "ledger-page ledger-right");
    rightPage.appendChild(node("span", "ledger-page-kicker", "RECEPTION"));
    rightPage.appendChild(node("strong", "ledger-page-title", "Today’s Patients"));
    rightPage.appendChild(node("span", "ledger-rule"));
    rightPage.appendChild(node("span", "ledger-rule ledger-rule-short"));
    var cover = node("div", "ledger-cover");
    cover.appendChild(node("div", "ledger-cover-front", "CLINIC\nREGISTER"));
    cover.appendChild(node("div", "ledger-cover-back"));
    ledger.appendChild(leftPage);
    ledger.appendChild(rightPage);
    ledger.appendChild(cover);
    room.appendChild(ledger);
    root.appendChild(room);
    root.appendChild(node("div", "opening-morning-light"));
    root.appendChild(node("div", "opening-shade"));

    var door = node("div", "opening-door-sign");
    door.setAttribute("aria-hidden", "true");
    var plaque = node("div", "opening-sign-flipper");
    var closed = node("div", "opening-sign-face opening-sign-closed");
    closed.appendChild(node("span", "opening-sign-small", "PLANT CLINIC"));
    closed.appendChild(node("strong", "", "CLOSED"));
    closed.appendChild(node("span", "opening-sign-small", "a new day awaits"));
    var opened = node("div", "opening-sign-face opening-sign-open");
    opened.appendChild(node("span", "opening-sign-small", "PLANT CLINIC"));
    opened.appendChild(node("strong", "", "OPEN"));
    opened.appendChild(node("span", "opening-sign-small", "please, come in"));
    plaque.appendChild(closed);
    plaque.appendChild(opened);
    door.appendChild(plaque);
    root.appendChild(door);

    var hero = node("div", "opening-hero");
    var crest = node("div", "opening-crest", "❧");
    crest.setAttribute("aria-hidden", "true");
    hero.appendChild(crest);
    hero.appendChild(node("p", "opening-kicker", "A QUIET MORNING AT THE CLINIC"));
    var title = node("h1", "opening-title");
    title.id = "opening-title";
    title.appendChild(node("span", "", "Pixel Plant"));
    title.appendChild(node("span", "", "Clinic"));
    hero.appendChild(title);
    hero.appendChild(node("p", "opening-credit", "BY ETHAN LEI"));
    var tagline = node("p", "opening-tagline", "Every plant tells a story. Look closer.");
    tagline.id = "opening-tagline";
    hero.appendChild(tagline);
    var open = node("button", "opening-open", "OPEN THE CLINIC");
    open.type = "button";
    open.dataset.openingAction = "open";
    open.onclick = openClinic;
    hero.appendChild(open);
    hero.appendChild(node("p", "opening-key-hint", "Press Enter to open"));
    root.appendChild(hero);

    var footer = node("footer", "opening-footer");
    footer.appendChild(node("span", "opening-footer-note", "OBSERVE · LISTEN · CARE"));
    var status = node("p", "opening-status");
    status.id = "opening-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    footer.appendChild(status);
    var skip = node("button", "opening-skip", "Skip opening →");
    skip.type = "button";
    skip.dataset.openingAction = "skip";
    skip.hidden = true;
    skip.onclick = finish;
    footer.appendChild(skip);
    root.appendChild(footer);
    previousStage = { inert: stage.inert, aria: stage.getAttribute("aria-hidden") };
    stage.inert = true;
    stage.setAttribute("aria-hidden", "true");
    document.body.appendChild(root);
    document.addEventListener("keydown", onKey, true);
    if (motion && motion.addEventListener) motion.addEventListener("change", onMotionChange);
    schedule(function () { open.focus({ preventScroll: true }); }, 0);
    return true;
  }

  return { show: show, dismiss: dismiss, isActive: function () { return !!root; }, getPhase: function () { return phase; } };
})();
