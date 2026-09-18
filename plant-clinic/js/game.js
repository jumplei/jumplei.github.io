var PPC = PPC || {};

PPC.Game = (function () {

  var state = null;
  var caseIndex = -1;
  var ENTER_MS = 2600;
  var TIME_CRUNCH_MS = 3 * 60 * 1000;
  var PROGRESS_KEY = "pixelPlantClinicProgress";
  var viewportPause = null;

  function setViewportPaused(paused) {
    if (paused) {
      if (!viewportPause) viewportPause = { state: state, at: Date.now(), deadline: state && state.deadline, enterStart: state && state.enterStart };
      return;
    }
    if (!viewportPause) return;
    if (state && state === viewportPause.state) {
      var elapsed = Math.max(0, Date.now() - viewportPause.at);
      if (state.deadline && state.deadline === viewportPause.deadline) state.deadline += elapsed;
      if (state.enterStart === viewportPause.enterStart) state.enterStart += elapsed;
    }
    viewportPause = null;
  }

  function readProgress() {
    var fallback = { unlocked: 1, bestScores: {}, bestBadges: {}, failedAttempts: {}, completed: {} };
    try {
      var saved = window.localStorage && window.localStorage.getItem(PROGRESS_KEY);
      if (!saved) return fallback;
      var parsed = JSON.parse(saved);
      return {
        unlocked: Math.max(1, Math.min(CASE_ORDER.length, Number(parsed.unlocked) || 1)),
        bestScores: parsed.bestScores || {},
        bestBadges: parsed.bestBadges || {},
        failedAttempts: parsed.failedAttempts || {},
        completed: parsed.completed || {}
      };
    } catch (e) { return fallback; }
  }

  function writeProgress(progress) {
    try {
      if (window.localStorage) window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) { /* Progress remains session-only when storage is unavailable. */ }
  }

  function isCaseUnlocked(id) {
    return CASE_ORDER.indexOf(id) < readProgress().unlocked;
  }

  function shuffledDiagnosisOptions(caseData) {
    var options = caseData.diagnosisOptions.slice();
    for (var i = options.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = options[i];
      options[i] = options[j];
      options[j] = temp;
    }
    return options;
  }

  function shuffledTreatmentOptions(caseData) {
    var treatments = activeTreatments(caseData);
    return {
      immediate: shuffledOptions(treatments.immediate),
      environment: shuffledOptions(treatments.environment),
      preventive: shuffledOptions(treatments.preventive)
    };
  }

  function activeTreatments(caseData) {
    return state && state.timeCrunch && caseData.emergencyTreatments ? caseData.emergencyTreatments : caseData.treatments;
  }

  function shuffledOptions(options) {
    var copy = options.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function freshState(caseId, timeCrunch) {
    var cd = CASES[caseId];
    return {
      caseId: caseId,
      caseData: cd,
      timeCrunch: !!timeCrunch,
      deadline: null,
      timeRemaining: Math.ceil(TIME_CRUNCH_MS / 1000),
      diagnosisOptions: shuffledDiagnosisOptions(cd),
      phase: "intake",
      intakeStep: "entering",
      enterStart: Date.now(),
      dialogueIndex: 0,
      zoom: false,
      hotspotsInspected: [],
      flipped: {},
      clues: [],
      notebook: [],
      asked: [],
      diagnosis: { disease: null, evidence: [], confidence: "low" },
      treatment: { immediate: [], environment: [], preventive: [] },
      treatmentOptions: null,
      retries: 0
    };
  }

  function getState() { return state; }

  function toMenu() {
    state = null;
    if (PPC.Render.setTimeCrunch) PPC.Render.setTimeCrunch(false);
    PPC.UI.hudClear();
    PPC.UI.menu();
  }

  function startCase(id, timeCrunch) {
    state = freshState(id, timeCrunch);
    state.treatmentOptions = shuffledTreatmentOptions(state.caseData);
    caseIndex = CASE_ORDER.indexOf(id);
    PPC.Render.setMode("normal");
    if (PPC.Render.setTimeCrunch) PPC.Render.setTimeCrunch(state.timeCrunch);
    if (PPC.Render.setEmergencyRemaining) PPC.Render.setEmergencyRemaining(state.timeRemaining);
    PPC.UI.clearAll();
    PPC.UI.hudFor(state);
  }

  function enterProgress() {
    if (!state || state.phase !== "intake" || state.intakeStep !== "entering") return 1;
    var now = viewportPause && viewportPause.state === state ? viewportPause.at : Date.now();
    return Math.min(1, (now - state.enterStart) / ENTER_MS);
  }

  function tickEnter() {
    if (viewportPause || !state || state.phase !== "intake" || state.intakeStep !== "entering") return;
    if (Date.now() - state.enterStart >= ENTER_MS) {
      state.intakeStep = "dialogue";
      showDialogue();
    }
  }

  function isTimedPhase() {
    return state && (state.phase === "investigate" || state.phase === "diagnose" || state.phase === "treat");
  }

  function formatTime(seconds) {
    return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  }

  function expireTimeCrunch() {
    if (!state || state.phase === "timeout") return;
    state.phase = "timeout";
    state.zoom = false;
    state.timeRemaining = 0;
    if (PPC.Render.setEmergencyRemaining) PPC.Render.setEmergencyRemaining(0);
    PPC.Render.setMode("normal");
    PPC.UI.clearAll();
    PPC.UI.hudFor(state);
    PPC.UI.timeExpired(state.caseData);
  }

  function tickTimeCrunch(now) {
    if (viewportPause || !state || !state.timeCrunch || !state.deadline || !isTimedPhase()) return;
    var msLeft = state.deadline - (now || Date.now());
    if (msLeft <= 0) { expireTimeCrunch(); return; }
    var seconds = Math.ceil(msLeft / 1000);
    if (seconds !== state.timeRemaining) {
      state.timeRemaining = seconds;
      if (PPC.Render.setEmergencyRemaining) PPC.Render.setEmergencyRemaining(seconds);
      PPC.UI.updateTimer(formatTime(seconds), seconds <= 30);
      if ([60, 30, 15, 10].indexOf(seconds) !== -1 && PPC.UI.announce) PPC.UI.announce(seconds + " seconds remaining");
    }
  }

  function toggleZoom() {
    if (!state || state.phase !== "investigate") return;
    state.zoom = !state.zoom;
    PPC.UI.investigateBar.setExpanded(true);
    PPC.Render.setMode(state.zoom ? "zoom" : "normal");
    PPC.UI.investigateBar.show(state.caseData, state);
    PPC.UI.toast(state.zoom ? "Magnified view \u2014 click a spot for detail" : "Zoomed out", 1200);
  }

  function restart() {
    if (!state) return toMenu();
    startCase(state.caseId, state.timeCrunch);
  }

  function nextCase() {
    var next = CASE_ORDER[caseIndex + 1];
    if (next) startCase(next, state && state.timeCrunch);
  }

  function hasNextCase(id) {
    return CASE_ORDER.indexOf(id) < CASE_ORDER.length - 1;
  }

  function showDialogue() {
    var i = state.dialogueIndex;
    PPC.UI.dialogue(state.caseData, i, i === state.caseData.intro.length - 1);
  }

  function advanceDialogue(i) {
    if (i >= state.caseData.intro.length - 1) return;
    state.dialogueIndex = i + 1;
    showDialogue();
  }

  function beginInvestigate() {
    state.phase = "investigate";
    PPC.Render.setMode("normal");
    PPC.UI.clear();
    PPC.UI.hudFor(state);
    PPC.UI.featureIntro(state.caseData, function () {
      if (!state || state.phase !== "investigate") return;
      if (state.timeCrunch && !state.deadline) {
        state.deadline = Date.now() + TIME_CRUNCH_MS;
        if (PPC.Render.setEmergencyRemaining) PPC.Render.setEmergencyRemaining(state.timeRemaining);
      }
      PPC.UI.clear();
      PPC.UI.hudFor(state);
      PPC.UI.investigateBar.setExpanded(true);
      PPC.UI.investigateBar.show(state.caseData, state);
    }, state.timeCrunch);
  }

  function recordNotebook(kind, text) {
    state.notebook.push({ kind: kind, text: text });
  }

  function addClue(clue) {
    if (clue && state.clues.indexOf(clue) === -1) state.clues.push(clue);
  }

  function inspectHotspot(h) {
    if (state.phase !== "investigate") return;
    if (state.hotspotsInspected.indexOf(h.id) === -1) {
      state.hotspotsInspected.push(h.id);
      recordNotebook("observation", h.name + ": " + h.observation);
      if (h.clue) { addClue(h.clue); }
    }
    PPC.UI.closeup(state.caseData, h);
    PPC.UI.toast(h.name + " noted in notebook");
  }

  function flipLeaf(h) {
    if (!h.flip || state.flipped[h.id]) return;
    state.flipped[h.id] = true;
    recordNotebook("observation", h.name + " (flipped): " + h.flip.text);
    addClue(h.flip.clue);
    PPC.UI.closeup(state.caseData, h);
    PPC.UI.toast("Key clue discovered!");
  }

  function askQuestion(q) {
    if (!state || state.phase !== "investigate" || !q) return;
    // Resolve authored data instead of accepting answers from another case.
    q = state.caseData.questions.find(function (question) { return question.id === q.id; });
    if (!q) return;
    var recorded = state.asked.indexOf(q.id) !== -1;
    if (!recorded) {
      if (state.asked.length >= state.caseData.maxQuestions) return;
      state.asked.push(q.id);
      recordNotebook("answer", q.text + " \u2192 " + q.answer);
      addClue(q.clue);
    }
    // Revisit the same spoken answer without spending another question.
    PPC.UI.interview(state.caseData, state.asked, q.id);
  }

  function openInterview() {
    if (!state || state.phase !== "investigate") return;
    PPC.UI.interview(state.caseData, state.asked);
  }

  function openInspectList() {
    if (!state || state.phase !== "investigate") return;
    PPC.UI.inspectList(state.caseData, state);
  }

  function openNotebook() {
    PPC.UI.notebook(state.caseData, state);
  }

  function openPatientRecord() {
    if (state && state.caseData.patientRecord) PPC.UI.patientRecord(state.caseData);
  }

  function openComputer() {
    PPC.UI.computer(state.caseData, state);
  }

  function openMeter() {
    if (state && state.caseData.meter) PPC.UI.meter(state.caseData);
  }

  function openDiagnose() {
    state.phase = "diagnose";
    state.diagnosisOptions = shuffledDiagnosisOptions(state.caseData);
    PPC.UI.clearAll();
    PPC.UI.hudFor(state);
    PPC.UI.diagnose(state.caseData);
  }

  function backToClinic() {
    if (!state) return;
    if (state.phase === "diagnose" || state.phase === "treat") {
      if (state.phase === "treat") state.retries += 1;
      state.phase = "investigate";
      PPC.Render.setMode("normal");
      PPC.UI.clearAll();
      PPC.UI.hudFor(state);
      PPC.UI.investigateBar.show(state.caseData, state);
      return;
    }
    PPC.UI.clear();
  }

  function selectDiagnosis(id) {
    state.diagnosis.disease = id;
  }

  function discoveredEvidenceOptions() {
    if (!state) return [];
    return state.caseData.evidenceOptions.filter(function (e) {
      return !e.clue || state.clues.indexOf(e.clue) !== -1;
    });
  }

  function toggleEvidence(id) {
    var supported = discoveredEvidenceOptions().some(function (e) { return e.id === id; });
    if (!supported) { PPC.UI.toast("Inspect the plant before selecting that finding"); return; }
    var arr = state.diagnosis.evidence;
    var idx = arr.indexOf(id);
    if (idx === -1) arr.push(id);
    else arr.splice(idx, 1);
  }

  function selectConfidence(c) {
    state.diagnosis.confidence = c;
  }

  function submitDiagnosis() {
    var d = state.diagnosis;
    if (!d.disease) { PPC.UI.toast("Pick a diagnosis first"); return; }
    if (d.evidence.length === 0) { PPC.UI.toast("Select at least one piece of evidence"); return; }
    var available = discoveredEvidenceOptions().map(function (e) { return e.id; });
    d.evidence = d.evidence.filter(function (id) { return available.indexOf(id) !== -1; });
    if (d.evidence.length === 0) { PPC.UI.toast("Investigate and record supporting evidence first"); return; }
    openTreat();
  }

  function openTreat() {
    state.phase = "treat";
    state.treatmentOptions = shuffledTreatmentOptions(state.caseData);
    PPC.UI.clearAll();
    PPC.UI.hudFor(state);
    PPC.UI.treat(state.caseData);
  }

  function toggleTreatment(cat, id, on) {
    var arr = state.treatment[cat];
    var idx = arr.indexOf(id);
    var options = activeTreatments(state.caseData)[cat];
    var chosen = options.filter(function (o) { return o.id === id; })[0];
    if (on && chosen) {
      if (chosen.harm > 0) arr.length = 0;
      else {
        for (var i = arr.length - 1; i >= 0; i--) {
          var existing = options.filter(function (o) { return o.id === arr[i]; })[0];
          if (existing && existing.harm > 0) arr.splice(i, 1);
        }
        if (cat === "preventive") {
          var monitorOnly = chosen.monitorOnly || id === "prev_none" || id === "prev_skip";
          for (i = arr.length - 1; i >= 0; i--) {
            var existingOption = options.filter(function (o) { return o.id === arr[i]; })[0];
            var existingMonitor = existingOption && (existingOption.monitorOnly || existingOption.id === "prev_none" || existingOption.id === "prev_skip");
            if (monitorOnly !== existingMonitor) arr.splice(i, 1);
          }
        }
      }
      if (arr.indexOf(id) === -1) arr.push(id);
    }
    if (!on && idx !== -1) arr.splice(idx, 1);
  }

  function submitTreatment() {
    tickTimeCrunch();
    if (state.phase === "timeout") return;
    var result = outcome();
    state.phase = "outcome";
    PPC.UI.clearAll();
    PPC.UI.hudFor(state);
    PPC.UI.outcome(state.caseData, result);
  }

  function showSummary() {
    var result = scoreResult();
    var progress = readProgress();
    result.passed = result.parts.diagnosis === 40 && result.score >= 60 && harmTotal() === 0;
    if (result.passed) {
      progress.unlocked = Math.max(progress.unlocked, Math.min(CASE_ORDER.length, caseIndex + 2));
      progress.failedAttempts[state.caseId] = 0;
      progress.completed[state.caseId] = true;
    } else {
      progress.failedAttempts[state.caseId] = (progress.failedAttempts[state.caseId] || 0) + 1;
    }
    if (result.score >= (progress.bestScores[state.caseId] || -1)) {
      progress.bestScores[state.caseId] = result.score;
      progress.bestBadges[state.caseId] = result.badges;
    }
    result.canContinueAnyway = !result.passed && progress.failedAttempts[state.caseId] >= 3;
    writeProgress(progress);
    state.phase = "summary";
    PPC.UI.clearAll();
    PPC.UI.hudFor(state);
    PPC.UI.summary(state.caseData, result);
  }

  function continueAnyway() {
    if (!state) return;
    var progress = readProgress();
    if ((progress.failedAttempts[state.caseId] || 0) < 3) return;
    progress.unlocked = Math.max(progress.unlocked, Math.min(CASE_ORDER.length, caseIndex + 2));
    writeProgress(progress);
    if (hasNextCase(state.caseId)) nextCase();
    else toMenu();
  }

  function selectedOptions(cat) {
    var cd = state.caseData;
    var treatments = activeTreatments(cd);
    return state.treatment[cat].map(function (id) {
      for (var i = 0; i < treatments[cat].length; i++) {
        if (treatments[cat][i].id === id) return treatments[cat][i];
      }
      return null;
    }).filter(Boolean);
  }

  function harmTotal() {
    return ["immediate", "environment", "preventive"].reduce(function (sum, cat) {
      return sum + selectedOptions(cat).reduce(function (s, o) { return s + o.harm; }, 0);
    }, 0);
  }

  function outcome() {
    var cd = state.caseData;
    var outcomes = state.timeCrunch && cd.emergencyOutcomes ? cd.emergencyOutcomes : cd.outcomes;
    var correct = state.diagnosis.disease === cd.correctDisease;
    var harm = harmTotal();
    var care = 0;
    ["immediate", "environment"].forEach(function (cat) {
      care += selectedOptions(cat).reduce(function (s, o) { return s + o.points; }, 0);
    });
    var outcomeKey;
    if (correct) {
      if (harm >= 20) outcomeKey = "worsened";
      else if (care >= 25 && harm === 0) outcomeKey = "recovered";
      else if (harm === 0) outcomeKey = "stable";
      else outcomeKey = "stable";
    } else {
      outcomeKey = (harm >= 20) ? "plant_lost" : "worsened";
    }
    return {
      outcome: outcomeKey,
      outcomeText: outcomes[outcomeKey],
      outcomeDelay: state.timeCrunch && cd.emergencyOutcomeDelay ? cd.emergencyOutcomeDelay : cd.outcomeDelay
    };
  }

  function scoreResult() {
    var cd = state.caseData;
    var parts = { diagnosis: 0, evidence: 0, immediate: 0, environment: 0, preventive: 0, penalties: 0 };
    parts.diagnosis = (state.diagnosis.disease === cd.correctDisease) ? 40 : 0;

    var correctIds = cd.evidenceOptions.filter(function (e) { return e.correct; }).map(function (e) { return e.id; });
    var sel = state.diagnosis.evidence;
    var hits = 0, wrong = 0;
    sel.forEach(function (id) { if (correctIds.indexOf(id) !== -1) hits++; else wrong++; });
    parts.evidence = Math.max(0, Math.round(20 * hits / correctIds.length) - wrong * 2);

    ["immediate", "environment", "preventive"].forEach(function (cat) {
      var max = { immediate: 15, environment: 15, preventive: 10 }[cat];
      var pts = selectedOptions(cat).reduce(function (s, o) { return s + o.points; }, 0);
      parts[cat] = Math.max(0, Math.min(max, pts));
    });

    parts.penalties = 0;
    parts.penalties -= harmTotal();
    state.asked.forEach(function (qid) {
      var q = cd.questions.filter(function (x) { return x.id === qid; })[0];
      if (q && !q.clue) parts.penalties -= 1;
    });
    parts.penalties = Math.max(parts.penalties, -40);

    var total = Math.max(0, Math.min(100, Math.round(
      parts.diagnosis + parts.evidence + parts.immediate + parts.environment + parts.preventive + parts.penalties)));

    var allCorrect = hits === correctIds.length && wrong === 0;
    var harm = harmTotal();
    var badges = {
      eco: parts.immediate === 15 && parts.environment === 15 && harm === 0,
      evidence: allCorrect,
      safety: parts.preventive === 10 && harm === 0 && selectedOptions("preventive").every(function (o) { return o.safe; }),
      early: state.retries === 0 && parts.diagnosis === 40
    };

    var confidenceFeedback;
    if (parts.diagnosis === 40 && state.diagnosis.confidence === "high") confidenceFeedback = "Well calibrated: strong evidence supported your high confidence.";
    else if (parts.diagnosis === 40 && state.diagnosis.confidence === "low") confidenceFeedback = "Your diagnosis was correct, but your confidence was lower than the evidence justified.";
    else if (parts.diagnosis === 0 && state.diagnosis.confidence === "high") confidenceFeedback = "Calibration check: high confidence needs stronger confirming and contradicting evidence.";
    else confidenceFeedback = "Your confidence appropriately reflected some remaining uncertainty.";

    var grade;
    if (total >= 90) grade = "Master Plant Detective";
    else if (total >= 75) grade = "Skilled Diagnostician";
    else if (total >= 60) grade = "Clinic Apprentice";
    else grade = "Review the evidence and retry";

    return { score: total, parts: parts, badges: badges, grade: grade, confidenceFeedback: confidenceFeedback };
  }

  // AI reads recorded clues only; never the answer key, selected diagnosis or treatment.
  // A clue is counted once. Repeated reports of one fact share an aiEvidence group.
  function aiChecks(cd) {
    var checks = {};
    function add(clue, check) {
      if (!clue) return;
      if (!checks[clue]) checks[clue] = [];
      checks[clue].push(check);
    }
    cd.hotspots.forEach(function (h, index) {
      var evidence = (cd.aiEvidence || {})[h.clue];
      // Gameplay hotspot names may already describe symptoms. Use a neutral
      // AI-only check label so an unknown action cannot disclose its result.
      var label = evidence && evidence.check || "plant area " + (index + 1);
      add(h.clue, { kind: "inspect", targetId: h.id, action: "Inspect: " + label });
      if (h.flip) add(h.flip.clue, { kind: "flip", targetId: h.id, action: h.flip.label + " (Inspection List)" });
    });
    cd.questions.forEach(function (q) {
      add(q.clue, { kind: "question", targetId: q.id, action: "Ask owner: " + q.text });
    });
    return checks;
  }

  function aiGroup(cd, clue) {
    var evidence = (cd.aiEvidence || {})[clue];
    return evidence && evidence.group || clue;
  }

  function aiEstimates(cd, clues) {
    clues = clues || [];
    var checks = aiChecks(cd);
    var knownGroups = clues.map(function (clue) { return aiGroup(cd, clue); });
    var res = cd.diseases.map(function (d) {
      var supporting = {}, contradicting = {}, unknown = [];
      Object.keys(d.clues).forEach(function (clue) {
        var weight = d.clues[clue];
        if (!weight) return;
        var group = aiGroup(cd, clue);
        if (clues.indexOf(clue) === -1) {
          // Unknown entries contain an action, NEVER an unseen observation or its explanation.
          if (knownGroups.indexOf(group) === -1) unknown.push({ clue: clue, action: checks[clue] ? checks[clue][0].action : "No check available in this case" });
          return;
        }
        var evidence = (cd.aiEvidence || {})[clue];
        var entry = {
          clue: clue, group: group, weight: Math.abs(weight),
          text: evidence ? evidence.text : clue,
          diagnostic: weight > 0 && (d.keyClues || []).indexOf(clue) !== -1,
          reason: (d.reasons || {})[clue] || "Compatible with this candidate, but not a distinguishing sign on its own."
        };
        var bucket = weight > 0 ? supporting : contradicting;
        if (!bucket[group] || entry.weight > bucket[group].weight) bucket[group] = entry;
      });
      var support = Object.keys(supporting).map(function (group) { return supporting[group]; });
      var against = Object.keys(contradicting).map(function (group) { return contradicting[group]; });
      var diagnostic = 0, context = 0;
      support.forEach(function (entry) {
        if (entry.diagnostic) diagnostic += entry.weight;
        else context += entry.weight;
      });
      // Shared growing conditions cannot outweigh a distinguishing sign. These are
      // authored ranking points, not percentages; negative totals are preserved.
      var opposition = against.reduce(function (sum, entry) { return sum + entry.weight; }, 0);
      var score = diagnostic + Math.min(3, context) - opposition;
      var status = "unknown";
      if (against.length) status = support.length ? "mixed" : "against";
      else if (support.length) status = diagnostic >= 4 && support.length >= 2 ? "supported" : "limited";
      return { id: d.id, name: d.name, score: score, status: status, supporting: support, contradicting: against, unknown: unknown };
    });
    res.sort(function (a, b) { return b.score - a.score || a.name.localeCompare(b.name); });
    res.forEach(function (candidate) {
      candidate.tied = res.filter(function (other) { return other.score === candidate.score; }).length > 1;
    });
    return res;
  }

  function evidenceReview(cd, clues, asked) {
    clues = clues || [];
    asked = asked || [];
    var candidates = aiEstimates(cd, clues);
    var checks = aiChecks(cd);
    var knownGroups = clues.map(function (clue) { return aiGroup(cd, clue); });
    var pending = [];
    var unavailable = 0;
    Object.keys(checks).forEach(function (clue) {
      if (knownGroups.indexOf(aiGroup(cd, clue)) !== -1) return;
      var weights = cd.diseases.map(function (d) { return d.clues[clue] || 0; });
      if (!weights.some(function (weight) { return weight !== 0; })) return;
      var check = checks[clue].filter(function (option) {
        return option.kind !== "question" || (asked.length < cd.maxQuestions && asked.indexOf(option.targetId) === -1);
      })[0];
      if (!check) { unavailable++; return; }
      // Prefer checks with the largest difference in effects across candidates.
      // This is a rule-based priority, not a claim of measured information gain.
      pending.push({ clue: clue, kind: check.kind, targetId: check.targetId, action: check.action,
        priority: Math.max.apply(null, weights) - Math.min.apply(null, weights) });
    });
    pending.sort(function (a, b) { return b.priority - a.priority || a.clue.localeCompare(b.clue); });
    var hasEvidence = candidates.some(function (c) { return c.supporting.length || c.contradicting.length; });
    var top = candidates[0];
    var message;
    if (!hasEvidence) message = "Not enough evidence yet. Inspect the plant or ask the owner before comparing diagnoses.";
    else if (top && top.tied) message = "No clear leader: candidates are tied by the recorded evidence. Do not use list order as a diagnosis.";
    else if (top && top.status === "supported") message = "The recorded evidence currently favors " + top.name + ". Compare the explanations and any unchecked areas; this is not a confirmed diagnosis.";
    else message = "No well-supported conclusion yet. Shared conditions, a single sign, or conflicting evidence are not enough; investigate further.";
    return { candidates: candidates, message: message, nextCheck: pending[0] || null, unavailableChecks: unavailable };
  }

  function clickAt(x, y) {
    if (!state) return;
    if (state.phase === "intake") return;
    if (state.phase !== "investigate") return;
    var cd = state.caseData;
    var nearest = null;
    var nearestDistance = Infinity;
    cd.hotspots.forEach(function (h) {
      var p = PPC.Render.hotspotPos(h);
      var distance = Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2);
      if (distance <= p.r * p.r && distance < nearestDistance) {
        nearest = h;
        nearestDistance = distance;
      }
    });
    if (nearest) { inspectHotspot(nearest); return; }
    if (PPC.Render.isZoomed()) return;
    var c = PPC.Render.customerRect();
    if (c && x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) openInterview();
    var co = PPC.Render.computerRect();
    if (co && x >= co.x && x <= co.x + co.w && y >= co.y && y <= co.y + co.h) openComputer();
  }

  function hoverAt(x, y) {
    if (!state || state.phase !== "investigate") return null;
    var hit = null, nearestDistance = Infinity;
    state.caseData.hotspots.forEach(function (h) {
      var p = PPC.Render.hotspotPos(h);
      var distance = Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2);
      if (distance <= p.r * p.r && distance < nearestDistance) {
        hit = h.id;
        nearestDistance = distance;
      }
    });
    return hit;
  }

  PPC.UI.investigateBar = (function () {
    var cur = null;
    var expanded = true;
    function show(cd, st) {
      PPC.UI.hudFor(st);
      var focusedTool = document.activeElement && document.activeElement.getAttribute ? document.activeElement.getAttribute("data-tool") : null;
      if (cur && cur.parentNode) cur.parentNode.removeChild(cur);
      var layer = document.getElementById("ui-layer");
      // Keep the id for modal inert/clear logic; do not inherit .panel or .btn.
      var bar = PPC.UI.el("nav", { id: "investigate-bar", cls: "clinic-dock", "aria-label": "Clinic tools" });
      var row = PPC.UI.el("div", { id: "clinic-tool-actions", cls: "clinic-row" });
      var actions = [
        [st.zoom ? "Zoom out" : "Inspect", "inspect", function () { PPC.Game.toggleZoom(); }],
        ["Inspection list", "list", function () { PPC.Game.openInspectList(); }],
        ["Ask owner", "owner", function () { PPC.Game.openInterview(); }],
        ["Patient chart", "chart", function () { PPC.Game.openPatientRecord(); }],
        ["Case notes", "notes", function () { PPC.Game.openNotebook(); }],
        ["Evidence AI", "ai", function () { PPC.Game.openComputer(); }],
        ["Diagnose", "diagnose", function () { PPC.Game.openDiagnose(); }]
      ];
      if (cd.meter) actions.splice(5, 0, ["Humidity", "meter", function () { PPC.Game.openMeter(); }]);
      actions.forEach(function (item) {
        var labelText = item[0], toolKey = item[1];
        var btnEl = PPC.UI.el("button", {
          type: "button", cls: "dock-action" + (toolKey === "diagnose" ? " dock-action--primary" : (toolKey === "inspect" ? " dock-action--inspect" : "")),
          "data-tool": toolKey, "aria-label": labelText, on: item[2]
        });
        if (toolKey === "inspect") btnEl.setAttribute("aria-pressed", st.zoom ? "true" : "false");
        if (PPC.UI.toolIcon) btnEl.appendChild(PPC.UI.toolIcon(toolKey));
        btnEl.appendChild(PPC.UI.el("span", { cls: "tool-label", text: labelText }));
        // On narrow screens, keep the entire focused tool visible, not just its center.
        btnEl.onfocus = function () {
          var b = btnEl.getBoundingClientRect(), r = row.getBoundingClientRect();
          if (b.right > r.right) row.scrollLeft += b.right - r.right;
          else if (b.left < r.left) row.scrollLeft -= r.left - b.left;
        };
        row.appendChild(btnEl);
      });
      bar.appendChild(row);
      layer.appendChild(bar);
      cur = bar;
      if (PPC.UI.patientCard) PPC.UI.patientCard(cd, st);
      // Rebuilding after zoom/collapse must not strand keyboard focus.
      if (focusedTool && bar.querySelector) {
        var target = bar.querySelector('[data-tool="' + focusedTool + '"]');
        if (target && target.focus) target.focus();
      }
    }
    function clear() { if (cur && cur.parentNode) cur.parentNode.removeChild(cur); cur = null; }
    function collapse() { expanded = false; if (state && state.phase === "investigate") show(state.caseData, state); }
    function setExpanded(value) { expanded = !!value; }
    return { show: show, clear: clear, collapse: collapse, setExpanded: setExpanded };
  })();

  return {
    startCase: startCase,
    toMenu: toMenu,
    restart: restart,
    nextCase: nextCase,
    hasNextCase: hasNextCase,
    isCaseUnlocked: isCaseUnlocked,
    getProgress: readProgress,
    getState: getState,
    enterProgress: enterProgress,
    tickEnter: tickEnter,
    tickTimeCrunch: tickTimeCrunch,
    setViewportPaused: setViewportPaused,
    formatTime: formatTime,
    toggleZoom: toggleZoom,
    advanceDialogue: advanceDialogue,
    beginInvestigate: beginInvestigate,
    inspectHotspot: inspectHotspot,
    flipLeaf: flipLeaf,
    askQuestion: askQuestion,
    openInterview: openInterview,
    openInspectList: openInspectList,
    openNotebook: openNotebook,
    openPatientRecord: openPatientRecord,
    openComputer: openComputer,
    openMeter: openMeter,
    outcome: outcome,
    scoreResult: scoreResult,
    openDiagnose: openDiagnose,
    openTreat: openTreat,
    backToClinic: backToClinic,
    selectDiagnosis: selectDiagnosis,
    discoveredEvidenceOptions: discoveredEvidenceOptions,
    toggleEvidence: toggleEvidence,
    selectConfidence: selectConfidence,
    submitDiagnosis: submitDiagnosis,
    toggleTreatment: toggleTreatment,
    submitTreatment: submitTreatment,
    showSummary: showSummary,
    continueAnyway: continueAnyway,
    aiEstimates: aiEstimates,
    evidenceReview: evidenceReview,
    clickAt: clickAt,
    hoverAt: hoverAt
  };
})();
