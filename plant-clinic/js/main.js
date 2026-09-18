var PPC = PPC || {};

(function () {
  var canvas = document.getElementById("game");
  var wrap = document.getElementById("game-wrap");
  var stage = document.getElementById("stage");
  var rotation = document.getElementById("rotate-device");
  var hoverId = null;
  var zoomLayout = false;
  var patientLayout = false;
  var lastWidth = 0, lastHeight = 0, rotationBlocked = false;
  var previousFocus = null, inertSnapshots = [];
  var documentLayout = false, menuLayout = false, dockLayout = false, layoutState = null;

  function wantsDocumentLayout() { return window.matchMedia("(any-pointer: coarse)").matches; }

  function viewportSize() {
    // Read the viewport, never the stage: a normal document may be much taller
    // than the visible screen. Pinch zoom must not resize/recompose the game.
    var visual = window.visualViewport;
    return { width: document.documentElement.clientWidth || window.innerWidth,
      height: visual && Math.abs(visual.scale - 1) < .01 ? visual.height : window.innerHeight };
  }

  function resize() {
    var viewport = viewportSize(), vw = viewport.width, vh = viewport.height;
    lastWidth = vw; lastHeight = vh;
    var state = PPC.Game.getState();
    var oldZoom = zoomLayout, oldMenu = menuLayout, oldDocument = documentLayout, oldState = layoutState;
    documentLayout = wantsDocumentLayout();
    menuLayout = !!document.querySelector(".menu-panel");
    var dock = document.getElementById("investigate-bar");
    dockLayout = !!dock;
    layoutState = state;
    zoomLayout = !!(state && state.zoom);
    patientLayout = !!document.getElementById("patient-card");
    document.documentElement.classList.toggle("document-layout", documentLayout);
    document.documentElement.style.setProperty("--visible-height", vh + "px");
    wrap.classList.toggle("menu-page", menuLayout);
    if (documentLayout) {
      // One desktop-style page, sized by width. Safari's short visible height
      // must never shrink the whole clinic; excess content scrolls natively.
      wrap.classList.remove("compact-landscape", "has-patient-strip");
      wrap.style.width = vw + "px";
      var header = document.querySelector(".clinic-header");
      var headerHeight = header && !zoomLayout && !menuLayout ? header.offsetHeight : 0;
      var safe = parseFloat(getComputedStyle(stage).getPropertyValue("--safe-bottom")) || 0;
      var footerHeight = dock ? dock.offsetHeight + 16 + safe : 0;
      var sceneHeight = zoomLayout ? vw * 9 / 16 : Math.max(vw * 9 / 16, vh - headerHeight - footerHeight);
      // Extra tablet height uses a uniform camera scale. Only peripheral room
      // scenery is cropped horizontally; plants and hotspots are never stretched.
      var sceneWidth = sceneHeight * 16 / 9;
      applyGeometry(sceneWidth, sceneHeight, vw, headerHeight + sceneHeight + footerHeight, headerHeight);
      if (oldState !== state || oldDocument !== documentLayout || (menuLayout && !oldMenu)) window.scrollTo(0, 0);
      else if (oldZoom !== zoomLayout) window.scrollTo(0, headerHeight);
      return;
    }
    var compact = vw > vh && vh <= 560;
    var safeBottom = parseFloat(getComputedStyle(stage).getPropertyValue("--safe-bottom")) || 0;
    var patientSpace = !compact && patientLayout && vw <= 640 && vh >= 560 ? 220 : 0;
    var dockSpace = compact ? (zoomLayout ? 64 + safeBottom : 0) :
      (zoomLayout && !patientSpace && vw <= 640 && vh >= 560 ? 82 : 0);
    // A short landscape is NOT a narrow portrait. Never subtract the 136px
    // portrait header merely because a height-fitted canvas happens to be narrow.
    var headerSpace = !compact && !zoomLayout && Math.min(vw, vh * 800 / 450) <= 640 ? 136 : 0;
    var scale = Math.min(vw / 800, Math.max(1, vh - headerSpace - patientSpace - dockSpace) / 450, 4);
    var width = 800 * scale, height = 450 * scale;
    var wrapWidth = compact ? vw : width;
    var wrapHeight = compact ? vh : height + headerSpace + patientSpace + dockSpace;
    applyGeometry(width, height, wrapWidth, wrapHeight, compact ? Math.max(0, (vh - dockSpace - height) / 2) : headerSpace);
    wrap.classList.toggle("compact-landscape", compact);
    wrap.classList.toggle("has-patient-strip", patientSpace > 0);
  }

  function applyGeometry(width, height, wrapWidth, wrapHeight, top) {
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.style.marginTop = top + "px";
    canvas.style.marginLeft = ((wrapWidth - width) / 2) + "px";
    var scenery = document.getElementById("room-scenery");
    scenery.style.width = canvas.style.width;
    scenery.style.height = canvas.style.height;
    scenery.style.top = canvas.style.marginTop;
    scenery.style.left = canvas.style.marginLeft;
    wrap.style.width = wrapWidth + "px";
    wrap.style.height = wrapHeight + "px";
  }

  function updateRotationGate() {
    var viewport = viewportSize();
    // Opening remains responsive in either orientation. A small touch device
    // must rotate before using the menu/game; narrow desktop windows stay usable.
    var blocked = !PPC.Opening.isActive() && window.matchMedia("(pointer: coarse)").matches &&
      viewport.width <= 640 && viewport.height > viewport.width;
    if (blocked === rotationBlocked) return;
    rotationBlocked = blocked;
    PPC.Game.setViewportPaused(blocked);
    rotation.hidden = !blocked;
    if (blocked) {
      previousFocus = document.activeElement;
      inertSnapshots = [wrap].concat(Array.prototype.slice.call(document.querySelectorAll(".specimen-inspection"))).map(function (node) {
        var snapshot = { node: node, inert: node.inert };
        node.inert = true;
        return snapshot;
      });
      rotation.querySelector("p").textContent = PPC.Game.getState() ?
        "Your case is paused. Turn your phone sideways to continue." :
        "Turn your phone sideways to enter the clinic.";
      rotation.focus({ preventScroll: true });
    } else {
      inertSnapshots.forEach(function (snapshot) { if (snapshot.node.isConnected) snapshot.node.inert = snapshot.inert; });
      inertSnapshots = [];
      if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
      previousFocus = null;
    }
  }

  document.addEventListener("keydown", function (event) {
    if (!rotationBlocked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    rotation.focus({ preventScroll: true });
  }, true);

  function toLogical(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * 400,
      y: (e.clientY - r.top) / r.height * 225
    };
  }

  canvas.addEventListener("click", function (e) {
    var p = toLogical(e);
    PPC.Game.clickAt(p.x, p.y);
  });

  canvas.addEventListener("mousemove", function (e) {
    var p = toLogical(e);
    PPC.Render.setMouse(p.x, p.y);
    var s = PPC.Game.getState();
    if (s && s.phase === "investigate") {
      hoverId = PPC.Game.hoverAt(p.x, p.y);
    } else {
      hoverId = null;
    }
  });

  canvas.addEventListener("mouseleave", function () { hoverId = null; PPC.Render.setMouse(null, null); });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (PPC.UI.handleEscape && PPC.UI.handleEscape()) e.preventDefault();
  });

  function loop() {
    var viewport = viewportSize(), s = PPC.Game.getState();
    if (viewport.width !== lastWidth || viewport.height !== lastHeight || documentLayout !== wantsDocumentLayout() ||
        layoutState !== s || menuLayout !== !!document.querySelector(".menu-panel") || dockLayout !== !!document.getElementById("investigate-bar") ||
        zoomLayout !== !!(s && s.zoom) || patientLayout !== !!document.getElementById("patient-card")) resize();
    updateRotationGate();
    document.documentElement.classList.toggle("presentation-locked", rotationBlocked || PPC.Opening.isActive());
    if (rotationBlocked || PPC.Opening.isActive()) { requestAnimationFrame(loop); return; }
    if (s) PPC.Game.tickEnter();
    if (s) PPC.Game.tickTimeCrunch();
    var phase = s ? s.phase : "menu";
    var cd = s ? s.caseData : null;
    var insp = s ? s.hotspotsInspected : [];
    var flip = s ? s.flipped : {};
    var anim = (s && s.phase === "intake" && s.intakeStep === "entering") ? { t: PPC.Game.enterProgress() } : null;
    PPC.Render.draw(phase, cd, insp, flip, hoverId, anim, !!(s && s.zoom));
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  // Safari/Chrome may settle rotation and browser-bar geometry on later frames.
  window.addEventListener("orientationchange", function () { requestAnimationFrame(resize); });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);
  if (window.screen.orientation && window.screen.orientation.addEventListener) window.screen.orientation.addEventListener("change", resize);
  resize();
  PPC.Opening.show();
  requestAnimationFrame(loop);
})();
