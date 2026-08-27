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
    [canvas, bar].forEach(function (node) {
      if (!node) return;
      node.inert = value;
      if (value && node.setAttribute) node.setAttribute("aria-hidden", "true");
      else if (node.removeAttribute) node.removeAttribute("aria-hidden");
    });
  }

  function clear() {
    var focusTarget = returnFocus;
    var kids = layer.children;
    for (var i = kids.length - 1; i >= 0; i--) {
      if (kids[i].id !== "investigate-bar") kids[i].parentNode.removeChild(kids[i]);
    }
    activeDialog = null;
    returnFocus = null;
    setBackgroundInert(false);
    if (focusTarget && focusTarget.focus && document.contains && document.contains(focusTarget)) {
      setTimeout(function () { focusTarget.focus(); }, 0);
    }
  }

  function clearAll() {
    layer.innerHTML = "";
    activeDialog = null;
    returnFocus = null;
    setBackgroundInert(false);
  }

  function hudClear() {
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
    returnFocus = document.activeElement;
    var p = el("div", { cls: "panel overlay" + (extraCls ? " " + extraCls : ""), role: "dialog", "aria-modal": "true", tabindex: "-1" });
    layer.appendChild(p);
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
      var first = p.querySelector && p.querySelector("button, input, [tabindex='0']");
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
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); return true; }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); return true; }
    return false;
  }

  function handleEscape() {
    if (!activeDialog) return false;
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

  function ownerPortrait(caseData, small) {
    var portrait = caseData.portrait || {};
    var skin = portrait.skin || "#e7b57d";
    var hair = portrait.hair || "#5b3b2d";
    var shirt = portrait.shirt || "#47715a";
    var accent = portrait.accent || "#f0c868";
    var c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    c.className = "owner-portrait" + (small ? " small" : "");
    c.setAttribute("role", "img");
    c.setAttribute("aria-label", "Portrait of " + caseData.customer);
    var cx = c.getContext("2d");
    function px(x, y, w, h, color) { cx.fillStyle = color; cx.fillRect(x, y, w, h); }
    px(0, 0, 32, 32, "#4d6e62");
    px(2, 2, 28, 28, "#d8bd7d");
    px(4, 4, 24, 24, "#7ca36c");
    px(6, 21, 20, 9, "#352b2a");
    px(7, 20, 18, 10, shirt);
    px(13, 17, 6, 5, skin);
    px(9, 7, 14, 12, hair);
    px(10, 8, 12, 11, skin);
    px(9, 7, 14, 4, hair);
    px(8, 10, 3, 7, hair);
    px(21, 10, 3, 7, hair);
    px(12, 12, 2, 2, "#2f2928");
    px(18, 12, 2, 2, "#2f2928");
    px(15, 14, 2, 2, "#c17d62");
    px(14, 17, 5, 1, "#8d4f4f");
    px(8, 23, 4, 7, accent);
    px(20, 23, 4, 7, accent);
    if (portrait.accessory === "flower") {
      px(21, 6, 3, 3, "#d94d5a"); px(22, 5, 1, 5, "#f28a78"); px(20, 7, 5, 1, "#f28a78");
    } else if (portrait.accessory === "hat") {
      px(7, 5, 18, 3, accent); px(10, 2, 12, 5, "#b77a3f"); px(12, 3, 8, 2, accent);
    } else if (portrait.accessory === "chef") {
      px(9, 3, 14, 5, "#f4ead1"); px(7, 5, 5, 4, "#f4ead1"); px(20, 5, 5, 4, "#f4ead1"); px(11, 1, 10, 4, "#fff8e6");
    } else if (portrait.accessory === "cap") {
      px(8, 5, 16, 4, accent); px(11, 3, 11, 4, "#416b49"); px(22, 8, 5, 2, accent);
    }
    px(0, 0, 32, 2, "#3b2a22"); px(0, 30, 32, 2, "#3b2a22");
    px(0, 0, 2, 32, "#3b2a22"); px(30, 0, 2, 32, "#3b2a22");
    return c;
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

  function hudFor(state) {
    hudClear();
    var left = el("div", { cls: "chip", id: "hud-left" });
    left.appendChild(el("span", { text: state.caseData ? state.caseData.title + " \u2014 patient: " + state.caseData.customer : "Main Menu" }));
    var center = el("div", { id: "hud-center" });
    if (!state.zoom && state.phase !== "timeout") {
      var restart = el("button", { cls: "btn warn small", text: "Restart", on: function () { PPC.Game.restart(); } });
      restart.style.pointerEvents = "auto";
      center.appendChild(restart);
    }
    var right = el("div", { id: "hud-right" });
    if (state.timeCrunch && (state.phase === "investigate" || state.phase === "diagnose" || state.phase === "treat")) {
      var timer = el("div", { cls: "chip emergency-timer" + (state.timeRemaining <= 30 ? " urgent" : ""), id: "time-crunch-timer", role: "timer", "aria-live": "off", "aria-label": "Emergency time remaining " + PPC.Game.formatTime(state.timeRemaining), text: "EMERGENCY " + PPC.Game.formatTime(state.timeRemaining) });
      right.appendChild(timer);
    }
    var phases = ["Intake", "Investigate", "Diagnose", "Treat", "Outcome", "Summary", "Time Out"];
    var idx = ["intake", "investigate", "diagnose", "treat", "outcome", "summary", "timeout"].indexOf(state.phase);
    var chip = el("div", { cls: "chip", text: idx >= 0 ? phases[idx] : "" });
    chip.style.fontSize = "11px";
    right.appendChild(chip);
    hud.appendChild(left);
    hud.appendChild(center);
    hud.appendChild(right);
  }

  function dialogue(caseData, lineIndex, isLast) {
    clear();
    var p = panel("dialog");
    var layout = el("div", { cls: "dialogue-layout" });
    layout.appendChild(ownerPortrait(caseData, false));
    var copy = el("div", { cls: "dialogue-copy" });
    copy.appendChild(el("div", { cls: "nameplate", text: caseData.customer } ));
    copy.appendChild(el("p", { text: caseData.intro[lineIndex] }));
    var row = el("div", { cls: "row", style: "justify-content:flex-end" });
    if (isLast) row.appendChild(btn("Start Investigation", "", function () { PPC.Game.beginInvestigate(); }));
    else row.appendChild(btn("Continue", "", function () { PPC.Game.advanceDialogue(lineIndex); }));
    copy.appendChild(row);
    layout.appendChild(copy);
    p.appendChild(layout);
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

  function closeup(caseData, hotspot) {
    clear();
    var p = panel();
    p.appendChild(el("h2", { html: "Close-up: <span style='text-transform:none'>" + hotspot.name + "</span>" }));
    p.appendChild(el("p", { text: hotspot.observation }));
    if (hotspot.flip && !PPC.Game.getState().flipped[hotspot.id]) {
      p.appendChild(el("div", { cls: "row", style: "justify-content:center;margin:8px 0" }));
      p.appendChild(btn(hotspot.flip.label, "", function () {
        PPC.Game.flipLeaf(hotspot);
      }));
    } else if (hotspot.flip && PPC.Game.getState().flipped[hotspot.id]) {
      p.appendChild(el("div", { cls: "row", style: "justify-content:center;margin:8px 0" }));
      p.appendChild(el("div", { cls: "choice picked", text: hotspot.flip.text + "  [clue recorded]" }));
    } else {
      p.appendChild(el("p", { cls: "tiny", text: "This observation has been added to your clinic notebook." }));
    }
    p.appendChild(el("div", { cls: "row", style: "justify-content:flex-end;margin-top:10px" }));
    p.appendChild(closeBtn());
  }

  function interview(caseData, asked) {
    clear();
    var p = panel("wide");
    var remaining = caseData.maxQuestions - asked.length;
    var ownerHeader = el("div", { cls: "owner-interview-header" });
    ownerHeader.appendChild(ownerPortrait(caseData, true));
    var ownerTitle = el("div", { cls: "grow" });
    ownerTitle.appendChild(el("h2", { html: caseData.customer + " <span class='tiny' style='text-transform:none'>(" + remaining + " question" + (remaining === 1 ? "" : "s") + " left)</span>" }));
    ownerTitle.appendChild(el("p", { cls: "tiny", text: "Ask focused questions. Answers are saved to your notebook." }));
    ownerHeader.appendChild(ownerTitle);
    p.appendChild(ownerHeader);
    var list = el("div", { cls: "stack" });
    caseData.questions.forEach(function (q, i) {
      var used = asked.indexOf(q.id) !== -1;
      var b = el("button", {
        cls: "choice" + (used ? " picked" : ""),
        text: q.text,
        on: used ? null : function () { PPC.Game.askQuestion(q); }
      });
      if (used) {
        b.disabled = true;
        b.style.cursor = "default";
        var ans = el("div", { cls: "tiny", text: "\u2014 " + q.answer, style: "padding:0 10px 6px" });
        list.appendChild(b);
        list.appendChild(ans);
      } else {
        list.appendChild(b);
      }
    });
    p.appendChild(list);
    p.appendChild(el("div", { cls: "row", style: "justify-content:space-between;margin-top:12px" }));
    p.appendChild(btn("Back to Clinic", "ghost", function () { clear(); }));
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
    var p = panel();
    p.appendChild(el("h2", { text: "Evidence Compatibility" }));
    var est = PPC.Game.aiEstimates(caseData, state.clues);
    est.forEach(function (e) {
      var row = el("div", { cls: "ai-bar" });
      var r = el("div", { cls: "row" });
      r.appendChild(el("span", { text: e.name }));
      r.appendChild(el("span", { text: e.pct + "% match" }));
      row.appendChild(r);
      var track = el("div", { cls: "ai-track" });
      var fill = el("div", { cls: "ai-fill", style: "width:" + Math.max(2, e.pct) + "%" });
      track.appendChild(fill);
      row.appendChild(track);
      p.appendChild(row);
    });
    p.appendChild(el("p", { cls: "tiny", text: "Rule-based expert system — these are evidence compatibility scores, not probabilities. Missing or contradictory evidence can change the result, so verify every suggestion before diagnosing." }));
    p.appendChild(el("div", { cls: "row", style: "justify-content:flex-end;margin-top:10px" }));
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
    timer.textContent = "EMERGENCY " + text;
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
