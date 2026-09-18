var PPC = PPC || {};

PPC.UI = (function () {

  var layer = document.getElementById("ui-layer");
  var hud = document.getElementById("hud");
  var status = document.getElementById("status");
  var activeDialog = null;
  var returnFocus = null;
  var dialogCount = 0;

  function setBackgroundInert(value) {
    var canvas = document.getElementById("game");
    var bar = document.getElementById("investigate-bar");
    var card = document.getElementById("patient-card");
    [canvas, bar, hud, card].forEach(function (node) {
      if (!node) return;
      node.inert = value;
      if (value && node.setAttribute) node.setAttribute("aria-hidden", "true");
      else if (node.removeAttribute) node.removeAttribute("aria-hidden");
    });
  }

  function clear() {
    if (PPC.Opening) PPC.Opening.dismiss();
    var focusTarget = returnFocus;
    // Specimen studies live on the full stage, outside the clipped room canvas.
    if (activeDialog && activeDialog.parentNode !== layer && activeDialog.parentNode) activeDialog.parentNode.removeChild(activeDialog);
    var kids = layer.children;
    for (var i = kids.length - 1; i >= 0; i--) {
      if (kids[i].id !== "investigate-bar" && kids[i].id !== "patient-card") kids[i].parentNode.removeChild(kids[i]);
    }
    activeDialog = null;
    returnFocus = null;
    setBackgroundInert(false);
    if (focusTarget && focusTarget.focus && document.contains && document.contains(focusTarget)) {
      setTimeout(function () { if (!activeDialog && document.contains(focusTarget)) focusTarget.focus(); }, 0);
    }
  }

  function clearAll() {
    if (PPC.Opening) PPC.Opening.dismiss();
    if (activeDialog && activeDialog.parentNode !== layer && activeDialog.parentNode) activeDialog.parentNode.removeChild(activeDialog);
    layer.innerHTML = "";
    activeDialog = null;
    returnFocus = null;
    setBackgroundInert(false);
  }

  function hudClear() {
    closeHudMenu(false);
    hudMenuButton = null;
    hudMenuPanel = null;
    hud.innerHTML = "";
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "html") node.innerHTML = attrs[k];
        else if (k === "cls") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k === "on") node.onclick = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else if (c) node.appendChild(c);
    });
    return node;
  }

  function btn(label, cls, onClick) {
    return el("button", { cls: "btn " + (cls || ""), text: label, on: onClick });
  }

  function panel(extraCls) {
    closeHudMenu(true);
    returnFocus = document.activeElement;
    var p = el("div", { cls: "panel overlay" + (extraCls ? " " + extraCls : ""), role: "dialog", "aria-modal": "true", tabindex: "-1" });
    // This study uses the viewport even when the zoomed room is letterboxed.
    (extraCls === "specimen-inspection" ? document.getElementById("stage") : layer).appendChild(p);
    activeDialog = p;
    setBackgroundInert(true);
    setTimeout(function () {
      var heading = p.querySelector && p.querySelector("h2, .menu-title, .grade");
      if (heading) {
        if (!heading.id) heading.id = "dialog-title-" + (++dialogCount);
        p.setAttribute("aria-labelledby", heading.id);
      } else {
        p.setAttribute("aria-label", "Pixel Plant Clinic dialog");
      }
      if (activeDialog !== p) return;
      var first = p.querySelector && p.querySelector("[data-dialogue-focus], button:not([disabled]), input:not([disabled]), [tabindex='0']");
      if (first && first.focus) first.focus();
      else if (p.focus) p.focus();
    }, 0);
    return p;
  }

  function handleKeydown(e) {
    if (!activeDialog || e.key !== "Tab" || !activeDialog.querySelectorAll) return false;
    var focusable = Array.prototype.slice.call(activeDialog.querySelectorAll("button:not([disabled]), input:not([disabled]), [tabindex='0']"));
    if (!focusable.length) return false;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (focusable.indexOf(document.activeElement) === -1) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
      return true;
    }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); return true; }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); return true; }
    return false;
  }

  function handleEscape() {
    if (closeHudMenu(true)) return true;
    if (!activeDialog) return false;
    if (activeDialog.classList.contains("clinic-confirm")) { clear(); return true; }
    if (activeDialog.classList.contains("menu-panel")) return false;
    if (activeDialog.classList.contains("tutorial-panel")) { menu(); return true; }
    var state = PPC.Game.getState();
    if (state && (state.phase === "diagnose" || state.phase === "treat")) { PPC.Game.backToClinic(); return true; }
    if (state && state.phase === "investigate" && !activeDialog.classList.contains("feature-intro")) { clear(); return true; }
    return false;
  }

  if (document.addEventListener) document.addEventListener("keydown", handleKeydown);

  function closeBtn() {
    return btn("Close", "ghost small", function () { clear(); });
  }

  function pixelLogo() {
    var PAL = {
      "1": "#4c7a3a", "2": "#5c9a46", "3": "#6aa84f",
      "4": "#8a5230", "5": "#b06040", "6": "#6e3a22",
      "7": "#1b1512", "W": "#fff8e6", ".": null
    };
    var ROWS = [
      "     22        ",
      "   2 22 2      ",
      "  2 22 22 2    ",
      "   2 22 22     ",
      "    2   2      ",
      "     33        ",
      "   555555      ",
      "  55555555     ",
      "  55455455     ",
      "  55WWWW55     ",
      "  55455455     ",
      "  55566655     ",
      "  55555555     ",
      " 7777777777    "
    ];
    var cols = 16, rows = ROWS.length, cell = 4;
    var c = document.createElement("canvas");
    c.width = cols * cell;
    c.height = rows * cell;
    c.style.imageRendering = "pixelated";
    var cx = c.getContext("2d");
    ROWS.forEach(function (line, y) {
      for (var x = 0; x < cols; x++) {
        var key = line[x];
        if (!key || PAL[key] === null) continue;
        cx.fillStyle = PAL[key];
        cx.fillRect(x * cell, y * cell, cell, cell);
      }
    });
    return c;
  }

  function refreshClinic(state) {
    if (state && state.phase === "investigate" && PPC.UI.investigateBar && PPC.UI.investigateBar.show) {
      PPC.UI.investigateBar.show(state.caseData, state);
    }
  }

  function toolIcon(name) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "tool-icon");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("width", "30");
    svg.setAttribute("height", "30");
    svg.setAttribute("viewBox", "0 0 32 32");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", name === "diagnose" ? "2.6" : "1.5");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", {
      inspect: "M21 13a8 8 0 1 1-16 0 8 8 0 0 1 16 0M19 19l9 9M13 8v10M8 13h10",
      list: "M12 8h15M12 16h15M12 24h15M4 7l2 2 3-4M4 15l2 2 3-4M4 23l2 2 3-4",
      owner: "M22 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0M4 28c0-7 5-11 12-11s12 4 12 11",
      chart: "M12 6H6v23h20V6h-6M12 4h8v5h-8zM10 15h12M10 21h10",
      notes: "M5 4h22v25H5zM12 4v25M16 10h7M16 16h7M16 22h5",
      ai: "M3 4h26v19H3zM11 29h10M16 23v6M7 16h4l3-7 4 10 3-6h4",
      meter: "M16 2c-3 7-9 14-9 19a9 9 0 0 0 18 0c0-5-6-12-9-19zM11 21c0 3 2 5 5 5",
      diagnose: "M6 16l7 8L27 7"
    }[name] || "M6 6h20v20H6z");
    svg.appendChild(path);
    return svg;
  }

  function ownerPortrait(caseData) {
    return PPC.Portraits.create(caseData);
  }

  function menu() {
    hudClear();
    clear();
    var p = panel("wide menu-panel");
    var header = el("div", { cls: "menu-header" });
    var logo = pixelLogo();
    logo.className = "menu-logo";
    header.appendChild(logo);
    var heading = el("div", { cls: "menu-heading" });
    heading.appendChild(el("div", { cls: "menu-title", text: "Pixel Plant Clinic" }));
    heading.appendChild(el("div", { cls: "menu-sub", text: "A plant diagnosis detective game by Ethan Lei" }));
    header.appendChild(heading);
    p.appendChild(header);
    var tutorialLaunch = el("div", { cls: "row tutorial-launch" });
    tutorialLaunch.appendChild(btn("Tutorial", "", function () { tutorial(); }));
    p.appendChild(tutorialLaunch);
    p.appendChild(el("p", { cls: "menu-intro", text: "Examine sick plants, interview their owners, diagnose from evidence, and build a safe treatment plan. Later, each patient returns to show the result." }));
    p.appendChild(el("h3", { cls: "case-load-title", text: "Choose a Patient" }));
    var list = el("div", { cls: "menu-case-list" });
    var startBtns = [];
    var progress = PPC.Game.getProgress();
    CASE_ORDER.forEach(function (id, idx) {
      var c = CASES[id];
      var row = el("div", { cls: "menu-case-card" });
      var info = el("div", { cls: "menu-case-info" });
      info.appendChild(el("div", { cls: "menu-case-number", text: "CASE " + (idx + 1) }));
      info.appendChild(el("div", { cls: "menu-case-name", text: c.title }));
      info.appendChild(el("div", { cls: "menu-case-plant", text: c.plant }));
      info.appendChild(el("div", { cls: "tiny menu-case-meta", text: c.difficulty + "  |  Focus: " + c.mainLesson }));
      info.appendChild(el("div", { cls: "tiny menu-case-tool", text: "New: " + c.mechanic }));
      var completed = !!progress.completed[id];
      var attempted = Object.prototype.hasOwnProperty.call(progress.bestScores, id);
      var badgeCount = attempted && progress.bestBadges[id] ? Object.keys(progress.bestBadges[id]).filter(function (key) { return progress.bestBadges[id][key]; }).length : 0;
      var progressText = completed ? "Completed | Best: " + progress.bestScores[id] + "/100 | Badges: " + badgeCount + "/4" : (attempted ? "Attempted | Best: " + progress.bestScores[id] + "/100" : "Not attempted");
      info.appendChild(el("div", { cls: "menu-case-progress" + (completed ? " complete" : ""), text: progressText }));
      row.appendChild(info);
      var unlocked = PPC.Game.isCaseUnlocked(id);
      var actions = el("div", { cls: "menu-case-actions" });
      var startLabel = idx === 0 ? "Standard" : "Treat Plant";
      var b = btn(unlocked ? startLabel : "Locked", unlocked ? "" : "ghost", function () { PPC.Game.startCase(id, false); });
      b.classList.add("menu-case-button");
      b.disabled = !unlocked;
      startBtns.push(b);
      actions.appendChild(b);
      var crunch = btn(unlocked ? "Emergency! 3:00" : "Locked", unlocked ? "danger" : "ghost", function () { PPC.Game.startCase(id, true); });
      crunch.classList.add("menu-case-button", "emergency-button");
      crunch.disabled = !unlocked;
      startBtns.push(crunch);
      actions.appendChild(crunch);
      row.appendChild(actions);
      list.appendChild(row);
    });
    p.appendChild(list);
    if (startBtns.some(function (b) { return b.disabled; })) {
      p.appendChild(el("p", { cls: "tiny", text: "Later cases unlock after you help the earlier patient." }));
    }
    p.appendChild(el("p", { cls: "tiny menu-tip", text: "Clinic tip: use the notebook and evidence computer as tools, not answers." }));
  }

  var hudMenuButton = null;
  var hudMenuPanel = null;

  function closeHudMenu(restoreFocus) {
    if (!hudMenuPanel || hudMenuPanel.hidden) return false;
    hudMenuPanel.hidden = true;
    hudMenuButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) hudMenuButton.focus();
    return true;
  }

  function confirmClinicAction(action) {
    closeHudMenu(true);
    clear();
    var p = panel("clinic-confirm");
    var restarting = action === "restart";
    p.appendChild(el("h2", { text: restarting ? "Restart this case?" : "Return to the main menu?" }));
    p.appendChild(el("p", { text: "Your current investigation will be cleared. Completed cases and saved best scores will be kept." }));
    if (PPC.Game.getState().timeCrunch) p.appendChild(el("p", { cls: "tiny", text: "The emergency timer continues while this confirmation is open." }));
    var actions = el("div", { cls: "row" });
    actions.appendChild(btn("Keep playing", "ghost", function () { clear(); }));
    actions.appendChild(btn(restarting ? "Restart case" : "Main menu", "", function () {
      if (restarting) PPC.Game.restart();
      else { PPC.UI.investigateBar.clear(); PPC.Game.toMenu(); }
    }));
    p.appendChild(actions);
  }

  function hudFor(state) {
    hudClear();
    // Magnified inspection owns the full canvas; hudClear also closes its menu.
    if (!state || !state.caseData || state.zoom) return;
    var cd = state.caseData;
    var header = el("header", { cls: "clinic-header", "aria-label": "Pixel Plant Clinic" });
    var brand = el("div", { cls: "clinic-brand" });
    brand.appendChild(el("span", { cls: "brand-mark", "aria-hidden": "true", html: '<svg viewBox="0 0 40 40" width="40" height="40"><rect width="40" height="40" rx="4" fill="#315747"/><path d="M11 29V17l7-10h12v11l-9 11z" fill="#c9d2a2"/><path d="M11 31L26 11" fill="none" stroke="#f1e8be" stroke-width="2"/></svg>' }));
    var brandCopy = el("div", { cls: "brand-copy" });
    brandCopy.appendChild(el("div", { cls: "brand-title", text: "PIXEL PLANT CLINIC" }));
    brandCopy.appendChild(el("div", { cls: "brand-credit", text: "BY ETHAN LEI" }));
    brand.appendChild(brandCopy);
    header.appendChild(brand);

    var info = el("div", { cls: "header-case" });
    info.appendChild(el("div", { cls: "header-case-title", text: cd.title }));
    var caseNumber = String(CASE_ORDER.indexOf(state.caseId) + 1).padStart(2, "0");
    var plantLabel = cd.plant.charAt(0) + cd.plant.slice(1).toLowerCase();
    info.appendChild(el("div", { cls: "header-case-subtitle", text: "Case " + caseNumber + "  /  " + plantLabel }));
    header.appendChild(info);

    // Status, not navigation: never let the progress display bypass diagnosis rules.
    var progress = el("ol", { cls: "header-progress", "aria-label": "Case progress" });
    var phases = ["investigate", "diagnose", "treat"];
    var active = phases.indexOf(state.phase);
    var finished = state.phase === "outcome" || state.phase === "summary";
    ["Investigate", "Diagnose", "Treat"].forEach(function (label, i) {
      var status = finished || (active > i) ? "complete" : (active === i ? "current" : "upcoming");
      var item = el("li", { cls: "header-step is-" + status, "data-phase": phases[i], "data-status": status });
      if (active === i) item.setAttribute("aria-current", "step");
      item.appendChild(el("span", { cls: "step-number", text: String(i + 1) }));
      item.appendChild(el("span", { cls: "step-label", text: label }));
      progress.appendChild(item);
    });
    header.appendChild(progress);

    var controls = el("div", { cls: "header-controls" });
    var mode = el("div", { cls: "header-mode" + (state.timeCrunch ? " is-emergency" : ""), "aria-label": state.timeCrunch ? "Emergency mode" : "Standard mode" });
    mode.appendChild(el("span", { cls: "mode-dot", "aria-hidden": "true" }));
    mode.appendChild(el("span", { text: state.timeCrunch ? "EMERGENCY" : "STANDARD" }));
    if (state.timeCrunch && active !== -1) mode.appendChild(el("span", {
      cls: "header-timer" + (state.timeRemaining <= 30 ? " urgent" : ""), id: "time-crunch-timer", role: "timer", "aria-live": "off",
      "aria-label": "Emergency time remaining " + PPC.Game.formatTime(state.timeRemaining), text: PPC.Game.formatTime(state.timeRemaining)
    }));
    controls.appendChild(mode);
    var menuHost = el("div", { cls: "header-menu" });
    hudMenuButton = el("button", { type: "button", cls: "header-menu-toggle", id: "clinic-menu-toggle", "aria-label": "Clinic menu", "aria-haspopup": "menu", "aria-expanded": "false", "aria-controls": "clinic-menu", html: '<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M2 4h22M2 13h22M2 22h22" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>', on: function () {
      if (!hudMenuPanel.hidden) { closeHudMenu(true); return; }
      hudMenuPanel.hidden = false;
      hudMenuButton.setAttribute("aria-expanded", "true");
      hudMenuPanel.querySelector("button").focus();
    } });
    hudMenuPanel = el("div", { cls: "header-dropdown", id: "clinic-menu", role: "menu", "aria-labelledby": "clinic-menu-toggle" });
    hudMenuPanel.hidden = true;
    [["Continue playing", function () { closeHudMenu(true); }], ["Restart case", function () { confirmClinicAction("restart"); }], ["Main menu", function () { confirmClinicAction("home"); }]].forEach(function (entry) {
      hudMenuPanel.appendChild(el("button", { type: "button", role: "menuitem", tabindex: "-1", cls: "header-menu-item", text: entry[0], on: entry[1] }));
    });
    menuHost.appendChild(hudMenuButton);
    menuHost.appendChild(hudMenuPanel);
    menuHost.onkeydown = function (e) {
      var open = !hudMenuPanel.hidden;
      if (e.key === "Escape" && open) { closeHudMenu(true); e.preventDefault(); e.stopPropagation(); return; }
      if (e.key === "Tab" && open) { closeHudMenu(true); return; }
      if (["ArrowDown", "ArrowUp", "Home", "End"].indexOf(e.key) === -1) return;
      e.preventDefault();
      var items = Array.prototype.slice.call(hudMenuPanel.querySelectorAll("button"));
      var current = items.indexOf(document.activeElement);
      if (!open) { hudMenuPanel.hidden = false; hudMenuButton.setAttribute("aria-expanded", "true"); }
      var index = e.key === "Home" ? 0 : (e.key === "End" ? items.length - 1 : (current + (e.key === "ArrowUp" ? -1 : 1) + items.length) % items.length);
      if (!open && e.key === "ArrowUp") index = items.length - 1;
      items[index].focus();
    };
    controls.appendChild(menuHost);
    header.appendChild(controls);
    hud.appendChild(header);
  }

  if (document.addEventListener) document.addEventListener("pointerdown", function (e) {
    if (hudMenuPanel && !hudMenuPanel.hidden && !hudMenuPanel.parentNode.contains(e.target)) closeHudMenu(false);
  });

  function conversation(caseData, kind, kicker) {
    // Keep the original tool as the focus-return target across dialogue turns.
    var origin = activeDialog && activeDialog.classList.contains("clinic-dialogue") ? returnFocus : null;
    clear();
    var p = panel("dialog clinic-dialogue " + kind);
    if (origin) returnFocus = origin;
    var layout = el("div", { cls: "dialogue-layout" });
    layout.appendChild(ownerPortrait(caseData, false));
    var copy = el("div", { cls: "dialogue-copy" });
    copy.appendChild(el("div", { cls: "dialogue-kicker", text: kicker }));
    copy.appendChild(el("h2", { cls: "dialogue-speaker", text: caseData.customer }));
    var content = el("div", { cls: "dialogue-content" });
    copy.appendChild(content);
    layout.appendChild(copy);
    p.appendChild(layout);
    var footer = el("div", { cls: "dialogue-footer" });
    p.appendChild(footer);
    return { panel: p, content: content, footer: footer };
  }

  function dialogue(caseData, lineIndex, isLast) {
    var view = conversation(caseData, "intake-dialogue", "PATIENT ARRIVAL");
    var lineId = "dialogue-line-" + (++dialogCount);
    view.content.appendChild(el("p", { cls: "dialogue-line", id: lineId, text: caseData.intro[lineIndex] }));
    view.panel.setAttribute("aria-describedby", lineId);
    view.footer.appendChild(el("span", { cls: "dialogue-progress", text: (lineIndex + 1) + " / " + caseData.intro.length }));
    if (isLast) view.footer.appendChild(btn("Start Investigation", "", function () { PPC.Game.beginInvestigate(); }));
    else view.footer.appendChild(btn("Continue", "", function () { PPC.Game.advanceDialogue(lineIndex); }));
  }

  function tutorial(page) {
    if (typeof page !== "number") page = -1;
    if (page < 0) {
      clear();
      var introPanel = panel("wide tutorial-panel");
      introPanel.appendChild(el("h2", { text: "How to Run the Clinic" }));
      introPanel.appendChild(el("p", { cls: "tutorial-intro", text: "Learn the investigation process without revealing a campaign diagnosis." }));
      var steps = [
        ["1. Observe", "Inspect glowing plant areas and turn leaves over when offered."],
        ["2. Ask", "Interview the owner and read the patient chart for environmental clues."],
        ["3. Compare", "Use the notebook, humidity meter, and evidence computer as supporting tools."],
        ["4. Decide", "Choose one diagnosis, select only findings you truly observed, and build a safe treatment plan."]
      ];
      steps.forEach(function (step) {
        var item = el("div", { cls: "tutorial-option" });
        item.appendChild(el("strong", { text: step[0] }));
        item.appendChild(el("span", { text: step[1] }));
        introPanel.appendChild(item);
      });
      var introFooter = el("div", { cls: "row", style: "justify-content:space-between;margin-top:12px" });
      introFooter.appendChild(btn("Back to Home", "ghost", function () { menu(); }));
      introFooter.appendChild(btn("Open Field Guide", "", function () { tutorial(0); }));
      introPanel.appendChild(introFooter);
      return;
    }
    page = Math.max(0, Math.min(CASE_ORDER.length - 1, page));
    var id = CASE_ORDER[page];
    var c = CASES[id];
    var completed = !!PPC.Game.getProgress().completed[id];
    clear();
    var p = panel("wide tutorial-panel");
    p.appendChild(el("h2", { text: "Plant Health Field Guide" }));
    p.appendChild(el("p", { cls: "tutorial-intro", text: "One case at a time: learn the key signs, then compare it with the look-alike diagnoses." }));
    var card = el("section", { cls: "tutorial-card tutorial-theme-" + c.plantSprite });
    card.appendChild(el("div", { cls: "tutorial-page", text: "GUIDE " + (page + 1) + " OF " + CASE_ORDER.length }));
    card.appendChild(el("div", { cls: "tutorial-case", text: completed ? c.diseaseName : c.plant + " Diagnostic Preview" }));
    card.appendChild(el("div", { cls: "tutorial-plant", text: c.plant }));
    var symptoms = c.evidenceOptions.filter(function (e) { return e.correct; }).slice(0, 3).map(function (e) { return e.text; });
    card.appendChild(el("div", { cls: "tutorial-section-title", text: completed ? "Key signs" : "Patient context" }));
    card.appendChild(el("p", { cls: "tutorial-copy", text: completed ? symptoms.join(". ") + "." : c.patientRecord.symptomsBegin + ". Weather: " + c.patientRecord.weather + "." }));
    card.appendChild(el("div", { cls: "tutorial-section-title", text: completed ? "Why act now" : "Your task" }));
    card.appendChild(el("p", { cls: "tutorial-copy", text: completed ? c.outcomes.worsened : "Inspect the plant and compare the possible diagnoses without assuming that one symptom proves the answer." }));
    card.appendChild(el("div", { cls: "tutorial-tip", text: completed ? c.lesson : "The full disease lesson and confirmed pattern unlock after you complete this case." }));
    card.appendChild(el("div", { cls: "tutorial-options-title", text: "Compare the diagnosis options" }));
    c.diseases.forEach(function (d) {
      var primary = completed && d.id === c.correctDisease;
      var option = el("div", { cls: "tutorial-option" + (primary ? " primary" : "") });
      option.appendChild(el("strong", { text: primary ? d.name + " - confirmed pattern" : d.name + (completed ? " - look-alike" : " - possible diagnosis") }));
      option.appendChild(el("span", { text: d.description }));
      card.appendChild(option);
    });
    p.appendChild(card);
    var footer = el("div", { cls: "row", style: "justify-content:space-between;margin-top:12px" });
    footer.appendChild(btn("Back to Home", "ghost", function () { menu(); }));
    var navigation = el("div", { cls: "row" });
    navigation.appendChild(btn(page > 0 ? "Previous" : "Mechanics", "ghost", function () { tutorial(page - 1); }));
    if (page < CASE_ORDER.length - 1) navigation.appendChild(btn("Next", "", function () { tutorial(page + 1); }));
    else if (PPC.Game.isCaseUnlocked(id)) navigation.appendChild(btn("Start This Case", "", function () { PPC.Game.startCase(id, false); }));
    footer.appendChild(navigation);
    p.appendChild(footer);
  }

  function featureIntro(caseData, onContinue, emergency) {
    clear();
    var copy = {
      rose: { tag: "ASK", title: "Owner Interview", text: "Speak with the plant's owner to gather clues about watering habits, symptom timing, and growing conditions. Answers add evidence to your notebook." },
      squash: { tag: "82%", title: "Humidity Meter", text: "Humidity changes disease risk. Check the meter, then compare air humidity with whether leaves are actually wet before deciding." },
      basil: { tag: "SCAN", title: "Close Inspection", text: "Move over the plant to reveal labelled areas. Use magnification to inspect detail and the leaf flip to uncover the hidden underside evidence." },
      tomato: { tag: "CLUES", title: "Evidence Selection", text: "Small details matter. Pair lesion shape with splash history, plant position, and clean fruit before submitting a diagnosis." }
    }[caseData.plantSprite] || { tag: "TOOLS", title: "Clinic Tools", text: "Inspect the plant, collect evidence, and choose a treatment plan based on what you find." };
    var p = panel("feature-intro");
    p.appendChild(el("div", { cls: "feature-kicker", text: "NEW FEATURE" }));
    var preview = el("div", { cls: "feature-preview feature-" + caseData.plantSprite });
    preview.appendChild(el("div", { cls: "feature-symbol", text: copy.tag }));
    p.appendChild(preview);
    p.appendChild(el("h2", { text: copy.title }));
    p.appendChild(el("p", { text: copy.text }));
    p.appendChild(el("p", { cls: "tiny", text: "This case adds: " + caseData.mechanic }));
    if (emergency) p.appendChild(el("p", { cls: "feature-emergency", text: "Accelerated simulation: 3:00 represents the intervention window before the next high-risk watering, humidity, or weather event. The timer starts when you continue." }));
    p.appendChild(el("div", { cls: "row", style: "justify-content:flex-end;margin-top:12px" }));
    p.appendChild(btn("Continue to Clinic", "", function () { onContinue(); }));
  }

  function closeup(caseData, hotspot, showUnderside) {
    // Keep the original tool/canvas as the return target across area and side changes.
    var origin = activeDialog ? returnFocus : document.activeElement;
    clear();
    var state = PPC.Game.getState();
    var revealed = !!(hotspot.flip && state.flipped[hotspot.id]);
    var underside = revealed && showUnderside !== false;
    var index = caseData.hotspots.indexOf(hotspot);
    var p = panel("specimen-inspection");
    if (origin) returnFocus = origin;
    p.setAttribute("data-hotspot-id", hotspot.id);
    p.setAttribute("data-side", underside ? "underside" : "initial");
    var heading = el("header", { cls: "specimen-heading" });
    heading.appendChild(el("div", { cls: "specimen-kicker", text: "BOTANICAL EXAMINATION · " + caseData.plant }));
    heading.appendChild(el("h2", { text: hotspot.name, tabindex: "-1", "data-dialogue-focus": "" }));
    p.appendChild(heading);

    var body = el("div", { cls: "specimen-body" });
    var figure = el("figure", { cls: "specimen-figure" });
    var description = underside ? hotspot.flip.text : hotspot.observation;
    var art = el("canvas", { cls: "specimen-art", width: "720", height: "480", role: "img", "aria-label": caseData.plant + " — " + description });
    figure.appendChild(art);
    figure.appendChild(el("figcaption", { cls: "specimen-caption", text: "DETAIL STUDY " + (index + 1) + " / " + caseData.hotspots.length + " · " + (hotspot.flip ? (underside ? "LEAF UNDERSIDE" : "BEFORE TURNING") : "SELECTED AREA") }));
    body.appendChild(figure);

    var notes = el("section", { cls: "specimen-notes", "aria-label": "Examination notes" });
    notes.appendChild(el("div", { cls: "specimen-kicker", text: underside ? "REVEALED OBSERVATION" : "OBSERVATION" }));
    var noteId = "specimen-note-" + (++dialogCount);
    notes.appendChild(el("p", { cls: "specimen-observation", id: noteId, text: description }));
    p.setAttribute("aria-describedby", noteId);
    if (hotspot.flip) {
      notes.appendChild(el("p", { cls: "specimen-hint", text: revealed ? "Both views are available. Turning again will not record duplicate evidence." : "Turn this leaf over to examine the hidden surface." }));
      var flip = btn(underside ? "Return to first view" : hotspot.flip.label, "specimen-flip", function () {
        if (!revealed) PPC.Game.flipLeaf(hotspot);
        else closeup(caseData, hotspot, !underside);
      });
      flip.setAttribute("data-action", "flip-specimen");
      notes.appendChild(flip);
    }
    notes.appendChild(el("div", { cls: "specimen-saved", text: "✓ Observation saved to notebook" }));
    notes.appendChild(el("div", { cls: "specimen-kicker specimen-areas-label", text: "EXAMINE ANOTHER AREA" }));
    var areas = el("div", { cls: "specimen-areas", role: "group", "aria-label": "Plant inspection areas" });
    caseData.hotspots.forEach(function (h, i) {
      var current = h.id === hotspot.id;
      var button = el("button", { cls: "specimen-area" + (current ? " selected" : ""), "data-area-id": h.id, "aria-pressed": String(current), on: function () { PPC.Game.inspectHotspot(h); } });
      button.appendChild(el("span", { cls: "specimen-area-number", text: String(i + 1).padStart(2, "0") }));
      button.appendChild(el("span", { text: h.name }));
      areas.appendChild(button);
    });
    notes.appendChild(areas);
    body.appendChild(notes);
    p.appendChild(body);
    var footer = el("footer", { cls: "specimen-footer" });
    footer.appendChild(el("span", { text: "Illustrated detail · not to scale" }));
    var back = btn("Back to plant", "", function () { clear(); });
    back.setAttribute("data-action", "close-specimen");
    footer.appendChild(back);
    p.appendChild(footer);
    PPC.Render.drawCloseup(art, caseData, hotspot, underside);
  }

  function interview(caseData, asked, selectedId) {
    var remaining = Math.max(0, caseData.maxQuestions - asked.length);
    var selected = caseData.questions.find(function (q) { return q.id === selectedId && asked.indexOf(q.id) !== -1; });
    var view = conversation(caseData, "owner-dialogue", "ASK OWNER · " + remaining + " QUESTION" + (remaining === 1 ? "" : "S") + " LEFT");
    view.panel.setAttribute("data-interview-step", selected ? "answer" : "questions");
    if (selected) {
      var replyId = "dialogue-reply-" + (++dialogCount);
      var reply = el("div", { cls: "dialogue-reply", id: replyId, tabindex: "-1", "data-dialogue-focus": "" });
      reply.appendChild(el("p", { cls: "dialogue-question", text: "You asked: " + selected.text }));
      reply.appendChild(el("p", { cls: "dialogue-line", text: selected.answer }));
      view.content.appendChild(reply);
      view.panel.setAttribute("aria-describedby", replyId);
      view.footer.appendChild(el("span", { cls: "dialogue-progress", text: "Saved to notebook" }));
    } else {
      view.content.appendChild(el("p", { cls: "dialogue-prompt", text: remaining ? "What would you like to ask?" : "No questions left. You can revisit recorded answers." }));
      var list = el("div", { cls: "dialogue-questions", role: "group", "aria-label": "Questions for " + caseData.customer });
      caseData.questions.forEach(function (q) {
        var used = asked.indexOf(q.id) !== -1;
        var b = el("button", { cls: "dialogue-choice" + (used ? " recorded" : ""), "data-question-id": q.id, on: function () { PPC.Game.askQuestion(q); } });
        b.appendChild(el("span", { cls: "question-state", text: used ? "REVISIT" : "ASK" }));
        b.appendChild(el("span", { text: q.text }));
        b.disabled = !used && remaining === 0;
        list.appendChild(b);
      });
      view.content.appendChild(list);
      view.footer.appendChild(el("span", { cls: "dialogue-progress", text: "Answers are saved automatically" }));
    }
    var actions = el("div", { cls: "dialogue-actions" });
    actions.appendChild(btn("Back to Clinic", "ghost", function () { clear(); }));
    if (selected) actions.appendChild(btn(remaining ? "More questions" : "Review questions", "", function () { interview(caseData, asked); }));
    view.footer.appendChild(actions);
  }

  function inspectList(caseData, state) {
    clear();
    var p = panel();
    p.appendChild(el("h2", { text: "Inspect the Plant" }));
    p.appendChild(el("p", { cls: "tiny", text: "Choose an area to examine. Recorded observations are marked complete." }));
    var list = el("div", { cls: "stack" });
    caseData.hotspots.forEach(function (h) {
      var seen = state.hotspotsInspected.indexOf(h.id) !== -1;
      list.appendChild(btn((seen ? "Recorded: " : "Inspect: ") + h.name, seen ? "ghost" : "", function () { PPC.Game.inspectHotspot(h); }));
    });
    p.appendChild(list);
    p.appendChild(btn("Back to Clinic", "ghost", function () { clear(); }));
  }

  function notebook(caseData, state) {
    clear();
    var p = panel("wide");
    p.appendChild(el("h2", { text: "Clinic Notebook" }));
    p.appendChild(el("p", { cls: "tiny", text: "Your discovered observations and the owner's answers." }));
    var list = el("div", { cls: "stack" });
    if (state.notebook.length === 0) list.appendChild(el("p", { cls: "tiny", text: "Nothing recorded yet." }));
    state.notebook.forEach(function (item) {
      list.appendChild(el("div", { cls: "notebook-item " + item.kind, text: (item.kind === "answer" ? "[Owner said] " : "") + item.text }));
    });
    p.appendChild(list);
    if (state.phase === "intake" || state.phase === "investigate") {
      p.appendChild(el("div", { cls: "row", style: "justify-content:flex-end;margin-top:10px" }));
      p.appendChild(btn("Back to Clinic", "ghost", function () { clear(); }));
    } else {
      p.appendChild(el("div", { cls: "row", style: "justify-content:flex-end;margin-top:10px" }));
      p.appendChild(btn("Back to Clinic", "ghost", function () {
        if (PPC.Game.getState().phase === "diagnose") PPC.Game.openDiagnose();
        else if (PPC.Game.getState().phase === "treat") PPC.Game.openTreat();
        else clear();
      }));
    }
  }

  function patientCard(caseData, state) {
    var old = document.getElementById("patient-card");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    if (!state || state.phase !== "investigate" || state.zoom) return;
    var number = String(CASE_ORDER.indexOf(caseData.id) + 1).padStart(2, "0");
    var card = el("aside", { id: "patient-card", cls: "patient-card", "aria-label": "Current patient", "data-case-id": caseData.id });
    card.appendChild(el("div", { cls: "patient-file-number", text: "PATIENT FILE / " + number }));
    var identity = el("div", { cls: "patient-identity" });
    identity.appendChild(ownerPortrait(caseData));
    var copy = el("div", { cls: "patient-identity-copy" });
    copy.appendChild(el("h2", { cls: "patient-owner", text: caseData.customer }));
    copy.appendChild(el("p", { cls: "patient-species", text: caseData.plant.charAt(0) + caseData.plant.slice(1).toLowerCase() }));
    identity.appendChild(copy);
    card.appendChild(identity);
    card.appendChild(el("blockquote", { cls: "patient-quote", text: "“" + (caseData.ownerQuote || caseData.intro[0]) + "”" }));
    card.appendChild(el("button", { type: "button", cls: "patient-chart-link", text: "View patient chart →", on: function () { PPC.Game.openPatientRecord(); } }));
    layer.appendChild(card);
    if (activeDialog) setBackgroundInert(true);
  }

  function patientRecord(caseData) {
    clear();
    var p = panel("wide");
    p.appendChild(el("h2", { text: "Patient Chart" }));
    p.appendChild(el("p", { cls: "tiny", text: "Intake facts provide context, not a diagnosis. Compare them with your observations." }));
    var labels = {
      species: "Plant",
      symptomsBegin: "Symptom onset",
      weather: "Recent conditions",
      watering: "Watering",
      spacing: "Spacing",
      history: "History"
    };
    Object.keys(labels).forEach(function (key) {
      if (!caseData.patientRecord[key]) return;
      var item = el("div", { cls: "patient-record-row" });
      item.appendChild(el("strong", { text: labels[key] }));
      item.appendChild(el("span", { text: caseData.patientRecord[key] }));
      p.appendChild(item);
    });
    p.appendChild(el("div", { cls: "row", style: "justify-content:flex-end;margin-top:10px" }));
    p.appendChild(btn("Back to Clinic", "ghost", function () { clear(); }));
  }

  function computer(caseData, state) {
    clear();
    var p = panel("wide evidence-review");
    p.appendChild(el("h2", { text: "Evidence AI — Reasoning Review" }));
    p.appendChild(el("p", { cls: "tiny", text: "A local rule-based teaching aid, not a trained model or a diagnostic service. No probabilities are shown. Only recorded clues are considered; unchecked areas remain unknown." }));
    var review = PPC.Game.evidenceReview(caseData, state.clues, state.asked);
    p.appendChild(el("p", { cls: "ai-assessment", text: review.message }));
    var next = el("section", { cls: "ai-next-check" });
    next.appendChild(el("h3", { text: "Suggested next check" }));
    if (review.nextCheck) {
      next.appendChild(el("p", { text: review.nextCheck.action }));
      next.appendChild(el("p", { cls: "tiny", text: review.nextCheck.priority > 0 ? "This check can help distinguish the candidates. Its result is not known yet." : "This check adds shared context, not a distinguishing sign. Its result is not known yet." }));
      var interview = review.nextCheck.kind === "question";
      next.appendChild(btn(interview ? "Open Owner Interview" : "Open Inspection List", "small", function () {
        if (interview) PPC.Game.openInterview();
        else PPC.Game.openInspectList();
      }));
    } else {
      next.appendChild(el("p", { cls: "tiny", text: review.unavailableChecks ? "No further checks are available with the remaining interview allowance. Missing evidence stays unknown; do not assume a result." : "All available modeled evidence has been recorded. Compare the reasons below; this limited case cannot establish a real-world diagnosis." }));
    }
    p.appendChild(next);
    var labels = {
      unknown: "Insufficient evidence",
      limited: "Limited support — more evidence needed",
      supported: "Supported pattern — not confirmed",
      mixed: "Mixed evidence — review contradictions",
      against: "Evidence against this pattern"
    };
    function evidenceList(card, title, entries, emptyText, cls) {
      card.appendChild(el("h4", { cls: cls, text: title }));
      if (!entries.length) { card.appendChild(el("p", { cls: "tiny", text: emptyText })); return; }
      var list = el("ul", { cls: "ai-evidence-list" });
      entries.forEach(function (entry) {
        var item = el("li");
        item.appendChild(el("strong", { text: entry.text + (entry.diagnostic ? " (key sign)" : "") }));
        item.appendChild(el("span", { text: entry.reason }));
        list.appendChild(item);
      });
      card.appendChild(list);
    }
    review.candidates.forEach(function (candidate) {
      var card = el("section", { cls: "ai-candidate" });
      card.appendChild(el("h3", { text: candidate.name }));
      card.appendChild(el("p", { cls: "ai-status", text: labels[candidate.status] + (candidate.tied ? " · Tied evidence rank" : "") }));
      evidenceList(card, "Supports", candidate.supporting, "No supporting clue recorded.", "ai-support-heading");
      evidenceList(card, "Argues against", candidate.contradicting, "No contradictory clue recorded. This does not confirm the disease.", "ai-against-heading");
      card.appendChild(el("h4", { text: "Not checked / unknown" }));
      card.appendChild(el("p", { cls: "tiny", text: candidate.unknown.length ? candidate.unknown.map(function (entry) { return entry.action; }).join("; ") : "No unrecorded clues remain in this candidate's limited rule set." }));
      p.appendChild(card);
    });
    p.appendChild(el("p", { cls: "tiny", text: "How it works: distinguishing signs carry more weight than shared conditions. Context support is capped, repeated reports count once, and contrary evidence lowers the ranking. Missing evidence is never treated as an absent symptom. These authored rules do not prove or rule out a disease." }));
    p.appendChild(btn("Back to Clinic", "ghost", function () { clear(); }));
  }

  function meter(caseData) {
    clear();
    var reading = caseData.meter;
    var p = panel();
    p.appendChild(el("h2", { text: "Humidity Meter" }));
    p.appendChild(el("div", { cls: "meter-display", html: "<span>RELATIVE HUMIDITY</span><strong>" + reading.humidity + "%</strong>" }));
    p.appendChild(el("div", { cls: "meter-display", html: "<span>LEAF WETNESS</span><strong>" + reading.leafWetness + "</strong>" }));
    p.appendChild(el("p", { text: reading.interpretation }));
    p.appendChild(el("p", { cls: "tiny", text: "A meter measures conditions; it does not identify a disease by itself." }));
    p.appendChild(btn("Back to Clinic", "ghost", function () { clear(); }));
  }

  function diagnose(caseData) {
    clear();
    var state = PPC.Game.getState();
    var p = panel("wide");
    p.appendChild(el("h2", { text: "Submit a Diagnosis" }));
    p.appendChild(el("h3", { text: "1. Primary diagnosis (choose one)" }));
    var dlist = el("div", { cls: "stack" });
    state.diagnosisOptions.forEach(function (d) {
      var b = el("button", { cls: "choice" + (state.diagnosis.disease === d.id ? " picked" : ""), text: d.label, "aria-pressed": state.diagnosis.disease === d.id ? "true" : "false", on: function () {
        dlist.querySelectorAll(".choice").forEach(function (n) { n.classList.remove("picked"); n.setAttribute("aria-pressed", "false"); });
        b.classList.add("picked");
        b.setAttribute("aria-pressed", "true");
        PPC.Game.selectDiagnosis(d.id);
      } });
      dlist.appendChild(b);
    });
    p.appendChild(dlist);
    p.appendChild(el("h3", { text: "2. Evidence check (select only findings supported by your investigation)" }));
    var ev = el("div", { cls: "grid-2" });
    var availableEvidence = PPC.Game.discoveredEvidenceOptions();
    if (availableEvidence.length === 0) {
      ev.appendChild(el("p", { cls: "tiny", text: "No supported evidence recorded yet. Return to the clinic and investigate the plant." }));
    }
    availableEvidence.forEach(function (e) {
      var selected = state.diagnosis.evidence.indexOf(e.id) !== -1;
      var label = el("label", { cls: "choice multi-choice evidence-choice" + (selected ? " picked" : "") });
      var box = el("input", { type: "checkbox", cls: "evbox", value: e.id });
      box.checked = selected;
      label.appendChild(box);
      label.appendChild(el("span", { text: e.text }));
      box.onchange = function () {
        PPC.Game.toggleEvidence(e.id);
        label.classList.toggle("picked", box.checked);
      };
      ev.appendChild(label);
    });
    p.appendChild(ev);
    p.appendChild(el("h3", { text: "3. How confident are you?" }));
    var conf = el("div", { cls: "row" });
    ["low", "medium", "high"].forEach(function (c) {
      var b = el("button", { cls: "choice" + (state.diagnosis.confidence === c ? " picked" : ""), text: c.toUpperCase(), "aria-pressed": state.diagnosis.confidence === c ? "true" : "false", on: function () {
        conf.querySelectorAll(".choice").forEach(function (n) { n.classList.remove("picked"); n.setAttribute("aria-pressed", "false"); });
        b.classList.add("picked");
        b.setAttribute("aria-pressed", "true");
        PPC.Game.selectConfidence(c);
      } });
      b.style.flex = "1";
      conf.appendChild(b);
    });
    p.appendChild(conf);
    p.appendChild(el("div", { cls: "row", style: "justify-content:space-between;margin-top:12px" }));
    p.appendChild(btn("Back to Clinic", "ghost", function () { PPC.Game.backToClinic(); }));
    p.appendChild(btn("Submit Diagnosis", "", function () { PPC.Game.submitDiagnosis(); }));
  }

  function treat(caseData) {
    clear();
    var state = PPC.Game.getState();
    var p = panel("wide");
    p.appendChild(el("h2", { text: "Create a Treatment Plan" }));
    p.appendChild(el("p", { cls: "tiny", text: "Select all compatible actions needed. Multiple sanitation and environment steps usually work together." }));
    var cat = [
      { key: "immediate", title: "A. Immediate action" },
      { key: "environment", title: "B. Environmental correction" },
      { key: "preventive", title: "C. Optional preventive control" }
    ];
    var toggles = {};
    function syncCategory(key) {
      toggles[key].forEach(function (control) {
        var selected = state.treatment[key].indexOf(control.option.id) !== -1;
        control.box.checked = selected;
        control.label.classList.toggle("picked", selected);
      });
    }
    cat.forEach(function (c) {
      p.appendChild(el("h3", { text: c.title }));
      var wrap = el("div", { cls: "stack" });
      toggles[c.key] = [];
      state.treatmentOptions[c.key].forEach(function (t) {
        var selected = state.treatment[c.key].indexOf(t.id) !== -1;
        var label = el("label", { cls: "choice multi-choice treatment-choice" + (selected ? " picked" : "") });
        var box = el("input", { type: "checkbox", value: t.id });
        box.checked = selected;
        box.onchange = function () {
          PPC.Game.toggleTreatment(c.key, t.id, box.checked);
          syncCategory(c.key);
        };
        label.appendChild(box);
        label.appendChild(el("span", { text: t.label }));
        toggles[c.key].push({ option: t, label: label, box: box });
        wrap.appendChild(label);
      });
      p.appendChild(wrap);
    });
    p.appendChild(el("div", { cls: "row", style: "justify-content:space-between;margin-top:12px" }));
    p.appendChild(btn("Back to Clinic", "ghost", function () { PPC.Game.backToClinic(); }));
    p.appendChild(btn("Confirm Treatment Plan", "", function () { PPC.Game.submitTreatment(); }));
  }

  function outcome(caseData, result) {
    clear();
    var p = panel();
    var msg = {
      recovered: ["The plant recovered!", "#7fd67f"],
      stable: ["Stable \u2014 improving slowly", "#c8902f"],
      worsened: ["Worsened \u2014 the disease spread", "#d05c40"],
      plant_lost: ["The plant was lost", "#b4442e"]
    }[result.outcome] || ["A few days pass...", "#fff"];
    p.appendChild(el("div", { cls: "menu-title", text: result.outcomeDelay, style: "font-size:26px" }));
    p.appendChild(el("div", { cls: "grade", text: msg[0], style: "font-size:24px;color:" + msg[1] }));
    p.appendChild(el("p", { text: result.outcomeText }));
    p.appendChild(el("div", { cls: "row", style: "justify-content:flex-end;margin-top:10px" }));
    p.appendChild(btn("See Full Results", "", function () { PPC.Game.showSummary(); }));
  }

  function timeExpired(caseData) {
    clear();
    var p = panel("time-expired");
    p.appendChild(el("div", { cls: "menu-title", text: "Emergency Failed", style: "font-size:30px" }));
    p.appendChild(el("div", { cls: "grade", text: "The intervention window was missed", style: "font-size:25px;color:#b4442e" }));
    p.appendChild(el("p", { text: "The diagnosis and treatment plan were not completed before the next high-risk event. The accelerated simulation shows the plant's likely decline during the following days." }));
    p.appendChild(el("p", { cls: "tiny", text: "Emergency compresses a real triage deadline into three minutes; the disease itself does not progress in three minutes." }));
    var row = el("div", { cls: "row", style: "justify-content:space-between;margin-top:12px" });
    row.appendChild(btn("Try Emergency Again", "danger", function () { PPC.Game.restart(); }));
    row.appendChild(btn("Home", "ghost", function () { PPC.Game.toMenu(); }));
    p.appendChild(row);
  }

  function updateTimer(text, urgent) {
    var timer = document.getElementById("time-crunch-timer");
    if (!timer) return;
    timer.textContent = text;
    if (timer.setAttribute) timer.setAttribute("aria-label", "Emergency time remaining " + text);
    timer.classList.toggle("urgent", !!urgent);
  }

  function summary(caseData, result) {
    clear();
    var p = panel("wide");
    p.appendChild(el("h2", { html: caseData.customer + "'s " + caseData.plant }));
    p.appendChild(el("div", { cls: "grade", text: result.grade }));
    p.appendChild(el("div", { cls: "summary-pass " + (result.passed ? "passed" : "retry"), text: result.passed ? "Case passed: the next patient is unlocked." : "Case not passed yet: use the correct diagnosis and a safe plan to unlock the next patient." }));
    p.appendChild(el("div", { cls: "score-line total", html: "<span>Total Score</span><span>" + result.score + " / 100</span>" }));
    [
      ["Diagnosis", result.parts.diagnosis, 40],
      ["Supporting evidence", result.parts.evidence, 20],
      ["Immediate action", result.parts.immediate, 15],
      ["Environmental correction", result.parts.environment, 15],
      ["Safe product decision", result.parts.preventive, 10],
      ["Penalties", result.parts.penalties, 0]
    ].forEach(function (l) {
      p.appendChild(el("div", { cls: "score-line", html: "<span>" + l[0] + "</span><span>" + l[1] + (l[2] ? " / " + l[2] : "") + "</span>" }));
    });
    p.appendChild(el("h3", { text: "Badges" }));
    var badges = el("div", { cls: "badges" });
    [
      ["Eco Gardener", result.badges.eco, "prevention + cultural controls"],
      ["Evidence Collector", result.badges.evidence, "found the key clues"],
      ["Safety First", result.badges.safety, "followed the label"],
      ["Early Intervention", result.badges.early, "diagnosed on first try"]
    ].forEach(function (b) {
      badges.appendChild(el("div", { cls: "badge " + (b[1] ? "on" : "off"), text: (b[1] ? "\u2713 " : "\u2717 ") + b[0] + " \u00b7 " + b[2] }));
    });
    p.appendChild(badges);
    p.appendChild(el("h3", { text: "What was the right answer?" }));
    p.appendChild(el("div", { cls: "notebook-item", text: "Diagnosis: " + caseData.diseaseName }));
    var keyEv = caseData.evidenceOptions.filter(function (e) { return e.correct; }).map(function (e) { return "\u2022 " + e.text; });
    p.appendChild(el("div", { cls: "notebook-item answer", html: "Key evidence:<br>" + keyEv.join("<br>") }));
    p.appendChild(el("div", { cls: "notebook-item", text: caseData.lesson }));
    p.appendChild(el("div", { cls: "notebook-item answer", text: "Confidence check: " + result.confidenceFeedback }));
    var row = el("div", { cls: "row", style: "justify-content:space-between;margin-top:12px" });
    row.appendChild(btn("Replay Case", "ghost", function () { PPC.Game.restart(); }));
    row.appendChild(btn("Main Menu", "ghost", function () { PPC.Game.toMenu(); }));
    if (result.passed && PPC.Game.hasNextCase(caseData.id)) {
      row.appendChild(btn("Next Patient \u25b6", "", function () { PPC.Game.nextCase(); }));
    } else if (result.canContinueAnyway && PPC.Game.hasNextCase(caseData.id)) {
      row.appendChild(btn("Continue Anyway", "warn", function () { PPC.Game.continueAnyway(); }));
    }
    p.appendChild(row);
  }

  function toast(text, dur) {
    if (status) status.textContent = text;
    var t = el("div", { cls: "chip", text: text, style: "position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:30;font-size:13px;background:#1b1512;color:#ffd97a;border-color:#000" });
    layer.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, dur || 1600);
  }

  function announce(text) {
    if (status) status.textContent = text;
  }

  return {
    refreshClinic: refreshClinic,
    toolIcon: (typeof toolIcon === "function") ? toolIcon : null,
    clear: clear,
    clearAll: clearAll,
    handleEscape: handleEscape,
    hudClear: hudClear,
    hudFor: hudFor,
    menu: menu,
    tutorial: tutorial,
    dialogue: dialogue,
    featureIntro: featureIntro,
    closeup: closeup,
    interview: interview,
    inspectList: inspectList,
    notebook: notebook,
    patientCard: patientCard,
    patientRecord: patientRecord,
    computer: computer,
    meter: meter,
    diagnose: diagnose,
    treat: treat,
    outcome: outcome,
    timeExpired: timeExpired,
    updateTimer: updateTimer,
    summary: summary,
    announce: announce,
    toast: toast,
    el: el,
    btn: btn
  };
})();
