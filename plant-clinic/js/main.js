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

  function viewportSize() {
    // The CSS stage uses dynamic viewport units. In particular, mobile browser
    // chrome and rotation may change its height without changing screen.height.
    return { width: stage.clientWidth || window.innerWidth, height: stage.clientHeight || window.innerHeight };
  }

  function resize() {
    var viewport = viewportSize(), vw = viewport.width, vh = viewport.height;
    lastWidth = vw; lastHeight = vh;
    var state = PPC.Game.getState();
    zoomLayout = !!(state && state.zoom);
    patientLayout = !!document.getElementById("patient-card");
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
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.style.marginTop = (compact ? Math.max(0, (vh - dockSpace - height) / 2) : headerSpace) + "px";
    canvas.style.marginLeft = ((wrapWidth - width) / 2) + "px";
    // Native room and moving canvas must use exactly the same rectangle.
    var scenery = document.getElementById("room-scenery");
    scenery.style.width = canvas.style.width;
    scenery.style.height = canvas.style.height;
    scenery.style.top = canvas.style.marginTop;
    scenery.style.left = canvas.style.marginLeft;
    wrap.style.width = wrapWidth + "px";
    wrap.style.height = wrapHeight + "px";
    wrap.classList.toggle("compact-landscape", compact);
    wrap.classList.toggle("has-patient-strip", patientSpace > 0);
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
    var viewport = viewportSize();
    if (viewport.width !== lastWidth || viewport.height !== lastHeight) resize();
    updateRotationGate();
    if (rotationBlocked || PPC.Opening.isActive()) { requestAnimationFrame(loop); return; }
    var s = PPC.Game.getState();
    if (zoomLayout !== !!(s && s.zoom) || patientLayout !== !!document.getElementById("patient-card")) resize();
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
