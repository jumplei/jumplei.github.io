const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function nodeStub() {
  return {
    children: [], style: {}, parentNode: null, innerHTML: "",
    classList: { add() {}, remove() {}, toggle() { return true; }, contains() { return false; } },
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
    removeChild() {}, setAttribute() {}, querySelectorAll() { return []; }
  };
}

const stored = {};
global.window = global;
global.window.matchMedia = () => ({ matches: false });
global.window.localStorage = {
  getItem(key) { return stored[key] || null; },
  setItem(key, value) { stored[key] = value; }
};
global.document = {
  getElementById() { return nodeStub(); },
  createElement() { return nodeStub(); },
  createTextNode() { return nodeStub(); }
};
global.PPC = {
  Render: {
    setMode() {}, isZoomed() { return false; },
    setTimeCrunch() {},
    hotspotPos() { return { x: 0, y: 0, r: 7 }; },
    customerRect() { return null; }, computerRect() { return null; }
  },
  UI: {
    clear() {}, clearAll() {}, hudFor() {}, hudClear() {}, menu() {}, dialogue() {},
    closeup() {}, interview() {}, inspectList() {}, notebook() {}, patientRecord() {}, computer() {}, featureIntro(caseData, done) { done(); },
    diagnose() {}, treat() {}, outcome() {}, summary() {}, timeExpired() {}, updateTimer() {}, announce() {}, toast() {},
    el() { return nodeStub(); }, btn() { return nodeStub(); }
  }
};

function load(file) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}

load("data/cases.js");
load("js/game.js");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("ok - " + name);
  } catch (error) {
    console.error("FAIL - " + name + "\n" + error.stack);
    process.exitCode = 1;
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function investigateAll(caseData) {
  const state = PPC.Game.getState();
  state.phase = "investigate";
  caseData.hotspots.forEach((hotspot) => {
    PPC.Game.inspectHotspot(hotspot);
    if (hotspot.flip) PPC.Game.flipLeaf(hotspot);
  });
  caseData.questions.filter((q) => q.clue).slice(0, caseData.maxQuestions)
    .forEach((q) => PPC.Game.askQuestion(q));
}

test("undiscovered evidence cannot be selected", () => {
  PPC.Game.startCase("rose_rust");
  PPC.Game.getState().phase = "investigate";
  PPC.Game.toggleEvidence("e_under");
  assert(PPC.Game.getState().diagnosis.evidence.length === 0, "unsupported evidence entered state");
});

test("perfect evidence-based IPM plan earns full credit", () => {
  const cd = CASES.rose_rust;
  PPC.Game.startCase(cd.id);
  investigateAll(cd);
  PPC.Game.selectDiagnosis(cd.correctDisease);
  PPC.Game.discoveredEvidenceOptions().filter((e) => e.correct).forEach((e) => PPC.Game.toggleEvidence(e.id));
  PPC.Game.selectConfidence("high");
  ["immediate", "environment"].forEach((category) => {
    cd.treatments[category].filter((option) => option.points > 0)
      .forEach((option) => PPC.Game.toggleTreatment(category, option.id, true));
  });
  PPC.Game.toggleTreatment("preventive", "prev_none", true);
  const result = PPC.Game.scoreResult();
  assert(result.score === 100, "expected 100, got " + result.score);
  assert(Object.values(result.badges).every(Boolean), "expected every badge");
});

test("harmful choices are exclusive and cannot earn a winning score", () => {
  const cd = CASES.rose_rust;
  PPC.Game.startCase(cd.id);
  investigateAll(cd);
  PPC.Game.selectDiagnosis(cd.correctDisease);
  PPC.Game.discoveredEvidenceOptions().filter((e) => e.correct).forEach((e) => PPC.Game.toggleEvidence(e.id));
  PPC.Game.toggleTreatment("immediate", "im_remove", true);
  PPC.Game.toggleTreatment("immediate", "im_compost", true);
  PPC.Game.toggleTreatment("environment", "env_evening", true);
  PPC.Game.toggleTreatment("preventive", "prev_dose", true);
  const state = PPC.Game.getState();
  assert(state.treatment.immediate.length === 1 && state.treatment.immediate[0] === "im_compost", "contradictory immediate actions remained selected");
  const result = PPC.Game.scoreResult();
  assert(result.score < 75, "dangerous plan scored " + result.score);
  assert(!result.badges.safety, "dangerous plan received Safety First");
});

test("powdery mildew expert-system clues can reach 100 percent", () => {
  const cd = CASES.powdery_mildew;
  const estimate = PPC.Game.aiEstimates(cd, ["powder_upper", "not_wet", "crowding", "nitrogen"])
    .find((item) => item.name === "Powdery mildew");
  assert(estimate.pct === 100, "expected 100% compatibility, got " + estimate.pct);
});

test("outcome narration is case-specific", () => {
  const cd = CASES.powdery_mildew;
  PPC.Game.startCase(cd.id);
  investigateAll(cd);
  PPC.Game.selectDiagnosis(cd.correctDisease);
  ["immediate", "environment"].forEach((category) => {
    cd.treatments[category].filter((option) => option.points > 0)
      .forEach((option) => PPC.Game.toggleTreatment(category, option.id, true));
  });
  const result = PPC.Game.outcome();
  assert(!/rust/i.test(result.outcomeText), "powdery outcome mentioned rust");
  assert(result.outcomeDelay === "7 days later...", "unexpected outcome timing");
});

test("only a correct safe case result unlocks the next patient", () => {
  const cd = CASES.rose_rust;
  PPC.Game.startCase(cd.id);
  PPC.Game.showSummary();
  assert(!PPC.Game.isCaseUnlocked("powdery_mildew"), "failed case unlocked the second patient");
  PPC.Game.startCase(cd.id);
  investigateAll(cd);
  PPC.Game.selectDiagnosis(cd.correctDisease);
  PPC.Game.discoveredEvidenceOptions().filter((e) => e.correct).forEach((e) => PPC.Game.toggleEvidence(e.id));
  ["immediate", "environment"].forEach((category) => {
    cd.treatments[category].filter((option) => option.points > 0)
      .forEach((option) => PPC.Game.toggleTreatment(category, option.id, true));
  });
  PPC.Game.toggleTreatment("preventive", "prev_none", true);
  PPC.Game.showSummary();
  assert(PPC.Game.isCaseUnlocked("powdery_mildew"), "second case did not unlock");
  const progress = PPC.Game.getProgress();
  assert(progress.completed.rose_rust, "passed case was not marked complete");
  assert(progress.bestScores.rose_rust === 100, "best score was not persisted");
  assert(progress.bestBadges.rose_rust.evidence, "best badges were not persisted");
});

test("continue anyway becomes available after three failed attempts", () => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    PPC.Game.startCase("powdery_mildew");
    PPC.Game.showSummary();
  }
  const progress = PPC.Game.getProgress();
  assert(progress.failedAttempts.powdery_mildew === 3, "failed attempts were not persisted");
  PPC.Game.continueAnyway();
  assert(PPC.Game.isCaseUnlocked("basil_downy_mildew"), "continue anyway did not unlock the next patient");
});

test("plausible unsupported evidence can be selected and penalized", () => {
  const cd = CASES.rose_rust;
  PPC.Game.startCase(cd.id);
  investigateAll(cd);
  PPC.Game.selectDiagnosis(cd.correctDisease);
  PPC.Game.toggleEvidence("e_white");
  assert(PPC.Game.getState().diagnosis.evidence.includes("e_white"), "evidence distractor was not selectable");
  assert(PPC.Game.scoreResult().parts.evidence === 0, "incorrect evidence was not penalized");
});

test("campaign contains four complete ordered cases", () => {
  assert(CASE_ORDER.length === 4, "expected four cases");
  assert(CASE_ORDER[2] === "basil_downy_mildew", "Case 3 is not Downy mildew");
  assert(CASE_ORDER[3] === "tomato_septoria", "Case 4 is not tomato Septoria");
  CASE_ORDER.forEach((id) => {
    const cd = CASES[id];
    assert(cd && cd.hotspots.length >= 4, id + " needs four hotspots");
    assert(cd.questions.length >= cd.maxQuestions, id + " needs enough interview choices");
    assert(cd.outcomes && cd.outcomes.recovered, id + " needs case-specific outcomes");
    assert(cd.mechanic, id + " needs a campaign mechanic label");
  });
});

test("Cases 3 and 4 support high-scoring evidence-based play", () => {
  ["basil_downy_mildew", "tomato_septoria"].forEach((id) => {
    const cd = CASES[id];
    PPC.Game.startCase(id);
    investigateAll(cd);
    PPC.Game.selectDiagnosis(cd.correctDisease);
    PPC.Game.discoveredEvidenceOptions().filter((e) => e.correct)
      .forEach((e) => PPC.Game.toggleEvidence(e.id));
    PPC.Game.selectConfidence("high");
    ["immediate", "environment"].forEach((category) => {
      cd.treatments[category].filter((option) => option.points > 0)
        .forEach((option) => PPC.Game.toggleTreatment(category, option.id, true));
    });
    PPC.Game.toggleTreatment("preventive", cd.treatments.preventive[0].id, true);
    const result = PPC.Game.scoreResult();
    assert(result.score >= 90, id + " perfect play scored " + result.score);
    assert(PPC.Game.outcome().outcome === "recovered", id + " did not recover");
  });
});

test("correct-disease clue IDs are reachable from each case", () => {
  CASE_ORDER.forEach((id) => {
    const cd = CASES[id];
    const reachable = new Set();
    cd.hotspots.forEach((h) => { if (h.clue) reachable.add(h.clue); if (h.flip) reachable.add(h.flip.clue); });
    cd.questions.forEach((q) => { if (q.clue) reachable.add(q.clue); });
    const correct = cd.diseases.find((d) => d.id === cd.correctDisease);
    Object.keys(correct.clues).forEach((clue) => assert(reachable.has(clue), id + " has unreachable clue " + clue));
  });
});

test("humidity meter remains available from Case 2 onward", () => {
  CASE_ORDER.slice(1).forEach((id) => {
    const meter = CASES[id].meter;
    assert(meter && typeof meter.humidity === "number", id + " has no humidity reading");
    assert(meter.leafWetness && meter.interpretation, id + " has incomplete meter guidance");
  });
});

test("every owner has a portrait design", () => {
  CASE_ORDER.forEach((id) => {
    const portrait = CASES[id].portrait;
    assert(portrait && portrait.skin && portrait.hair && portrait.shirt, id + " has no complete portrait palette");
  });
});

test("compatible treatments can be selected together", () => {
  PPC.Game.startCase("basil_downy_mildew");
  const state = PPC.Game.getState();
  state.phase = "investigate";
  PPC.Game.toggleTreatment("immediate", "im_remove_basil", true);
  PPC.Game.toggleTreatment("immediate", "im_separate_basil", true);
  PPC.Game.toggleTreatment("preventive", "prev_resistant_basil", true);
  PPC.Game.toggleTreatment("preventive", "prev_labeled_basil", true);
  assert(state.treatment.immediate.length === 2, "compatible immediate actions should coexist");
  assert(state.treatment.preventive.length === 2, "compatible preventive actions should coexist");
  PPC.Game.toggleTreatment("preventive", "prev_resistant_basil", false);
  PPC.Game.toggleTreatment("preventive", "prev_labeled_basil", false);
  PPC.Game.toggleTreatment("preventive", "prev_none", true);
  PPC.Game.toggleTreatment("preventive", "prev_labeled_basil", true);
  assert(state.treatment.preventive.length === 1 && state.treatment.preventive[0] === "prev_labeled_basil", "monitor-only and product actions should not coexist");
});

test("inspection list opens during investigation", () => {
  PPC.Game.startCase("rose_rust");
  const state = PPC.Game.getState();
  state.phase = "investigate";
  let opened = false;
  const previous = PPC.UI.inspectList;
  PPC.UI.inspectList = (caseData, currentState) => {
    opened = caseData === CASES.rose_rust && currentState === state;
  };
  PPC.Game.openInspectList();
  PPC.UI.inspectList = previous;
  assert(opened, "inspection list did not receive the active case and state");
});

test("patient chart opens with the active case record", () => {
  PPC.Game.startCase("rose_rust");
  let opened = false;
  const previous = PPC.UI.patientRecord;
  PPC.UI.patientRecord = (caseData) => { opened = caseData.patientRecord === CASES.rose_rust.patientRecord; };
  PPC.Game.openPatientRecord();
  PPC.UI.patientRecord = previous;
  assert(opened, "patient chart did not receive the active patient record");
});

test("a click inspects only the nearest circular hotspot", () => {
  PPC.Game.startCase("rose_rust");
  const state = PPC.Game.getState();
  state.phase = "investigate";
  const previous = PPC.Render.hotspotPos;
  PPC.Render.hotspotPos = (hotspot) => hotspot.id === "leaf_top" ? { x: 10, y: 10, r: 7 } : { x: 15, y: 10, r: 7 };
  PPC.Game.clickAt(14, 10);
  PPC.Render.hotspotPos = previous;
  assert(state.hotspotsInspected.length === 1 && state.hotspotsInspected[0] === "leaf_under", "click did not choose only the nearest hotspot");
});

test("diagnosis choices use credible labels and include the correct disease", () => {
  CASE_ORDER.forEach((id) => {
    PPC.Game.startCase(id);
    const state = PPC.Game.getState();
    const labels = state.diagnosisOptions.map((option) => option.label);
    assert(!labels.includes("Leaf spot"), "generic leaf spot option remained");
    assert(!labels.includes("Nitrogen deficiency"), "implausible basil option remained");
    assert(state.diagnosisOptions.some((option) => option.id === state.caseData.correctDisease), "correct diagnosis is missing");
    state.caseData.diseases.forEach((disease) => {
      assert(disease.description && disease.description.length > 30, id + " is missing a tutorial diagnosis description for " + disease.name);
    });
  });
});

test("treatment choices are complete, shuffled per category, and progressively difficult", () => {
  assert(CASES.rose_rust.difficulty === "Easy", "Case 1 difficulty changed");
  assert(CASES.powdery_mildew.difficulty === "Medium", "Case 2 should be medium");
  assert(CASES.basil_downy_mildew.difficulty === "Hard", "Case 3 should be hard");
  assert(CASES.tomato_septoria.difficulty === "Expert", "Case 4 should be expert");
  CASE_ORDER.forEach((id) => {
    PPC.Game.startCase(id);
    const state = PPC.Game.getState();
    ["immediate", "environment", "preventive"].forEach((category) => {
      const sourceIds = CASES[id].treatments[category].map((option) => option.id).sort();
      const shownIds = state.treatmentOptions[category].map((option) => option.id).sort();
      assert(JSON.stringify(shownIds) === JSON.stringify(sourceIds), id + " lost a treatment option in " + category);
    });
  });
  assert(!/bleach|every leaf|strong overhead spray/i.test(CASES.tomato_septoria.treatments.immediate.concat(CASES.tomato_septoria.treatments.environment, CASES.tomato_septoria.treatments.preventive).map((option) => option.label).join(" ")), "tomato distractors are still conspicuously unsafe");
});

test("emergency starts at investigation and expires into a dedicated loss state", () => {
  PPC.Game.startCase("rose_rust", true);
  const state = PPC.Game.getState();
  assert(state.timeCrunch, "emergency mode was not saved in state");
  assert(state.timeRemaining === 180, "emergency should begin with three minutes");
  PPC.Game.beginInvestigate();
  assert(state.deadline, "emergency deadline did not start with investigation");
  PPC.Game.tickTimeCrunch(state.deadline - 30000);
  assert(state.timeRemaining === 30, "emergency timer did not update");
  PPC.Game.tickTimeCrunch(state.deadline + 1);
  assert(state.phase === "timeout", "expired emergency did not reach timeout phase");
});

test("emergency uses its own treatment options", () => {
  PPC.Game.startCase("tomato_septoria", true);
  const state = PPC.Game.getState();
  const shownIds = state.treatmentOptions.immediate.map((option) => option.id).sort();
  const emergencyIds = CASES.tomato_septoria.emergencyTreatments.immediate.map((option) => option.id).sort();
  assert(JSON.stringify(shownIds) === JSON.stringify(emergencyIds), "emergency did not load its treatment set");
  assert(!shownIds.includes("im_strip_tomato"), "standard treatment option leaked into emergency");
});

test("emergency monitoring and product prevention remain exclusive", () => {
  PPC.Game.startCase("rose_rust", true);
  const state = PPC.Game.getState();
  state.phase = "investigate";
  PPC.Game.toggleTreatment("preventive", "em_prev_monitor_rust", true);
  PPC.Game.toggleTreatment("preventive", "em_prev_label_rust", true);
  assert(state.treatment.preventive.length === 1 && state.treatment.preventive[0] === "em_prev_label_rust", "emergency monitoring and product choices coexisted");
});

test("emergency outcomes use urgent hour-based narration", () => {
  CASE_ORDER.forEach((id) => {
    PPC.Game.startCase(id, true);
    const state = PPC.Game.getState();
    state.phase = "investigate";
    PPC.Game.selectDiagnosis(state.caseData.correctDisease);
    ["immediate", "environment"].forEach((category) => {
      state.treatment[category] = state.caseData.emergencyTreatments[category]
        .filter((option) => option.points > 0).map((option) => option.id);
    });
    const result = PPC.Game.outcome();
    assert(/hours later/.test(result.outcomeDelay), id + " emergency delay is not measured in hours");
    assert(result.outcomeText === state.caseData.emergencyOutcomes.recovered, id + " did not use emergency recovery narration");
    assert(!/within hours|three minutes/i.test(Object.values(state.caseData.emergencyOutcomes).join(" ")), id + " presents the simulation as literal disease progression");
  });
});

test("investigation waits for the feature introduction before starting emergency time", () => {
  PPC.Game.startCase("rose_rust", true);
  const state = PPC.Game.getState();
  let continueFeature;
  const previous = PPC.UI.featureIntro;
  PPC.UI.featureIntro = (caseData, done) => { continueFeature = done; };
  PPC.Game.beginInvestigate();
  assert(state.phase === "investigate", "feature introduction did not enter investigation state");
  assert(state.deadline === null, "emergency timer started before the feature introduction closed");
  continueFeature();
  PPC.UI.featureIntro = previous;
  assert(state.deadline, "emergency timer did not start after the feature introduction");
});

if (!process.exitCode) console.log("\n" + passed + " tests passed");
