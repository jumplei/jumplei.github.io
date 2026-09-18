var PPC = PPC || {};

(function () {
  var canvas = document.getElementById("game");
  var wrap = document.getElementById("game-wrap");
  var hoverId = null;
  var zoomLayout = false;
  var patientLayout = false;

  function resize() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var state = PPC.Game.getState();
    zoomLayout = !!(state && state.zoom);
    patientLayout = !!document.getElementById("patient-card");
    // Match the phone card's CSS breakpoint. Reserve a strip for its contents
    // and the dock so neither overlays the plant. Logical hotspot coordinates
    // are unchanged: toLogical always uses the actual canvas rectangle.
    var patientSpace = patientLayout && vw <= 640 && vh >= 560 ? 220 : 0;
    // In phone zoom the patient card disappears, but the dock still needs its
    // own space below the specimen so soil/lower-leaf hotspots remain clickable.
    var dockSpace = zoomLayout && !patientSpace && vw <= 640 && vh >= 560 ? 82 : 0;
    var headerSpace = !zoomLayout && Math.min(vw, vh * 800 / 450) <= 640 ? 136 : 0;
    var scale = Math.min(vw / 800, Math.max(1, vh - headerSpace - patientSpace - dockSpace) / 450, 4);
    canvas.style.width = (800 * scale) + "px";
    canvas.style.height = (450 * scale) + "px";
    canvas.style.marginTop = headerSpace + "px";
    // The native scenery must match the actual canvas rectangle, including the
    // phone header strip. Gameplay retains its original 400×225 coordinates.
    var scenery = document.getElementById("room-scenery");
    scenery.style.width = canvas.style.width;
    scenery.style.height = canvas.style.height;
    scenery.style.top = canvas.style.marginTop;
    wrap.style.width = (800 * scale) + "px";
    wrap.style.height = (450 * scale + headerSpace + patientSpace + dockSpace) + "px";
    wrap.classList.toggle("has-patient-strip", patientSpace > 0);
  }

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
    if (PPC.Opening.isActive()) { requestAnimationFrame(loop); return; }
    var s = PPC.Game.getState();
    // Zoom/case changes can alter the phone's reserved UI strips without a
    // browser resize event. Keep pointer geometry and visible foliage in sync.
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
  resize();
  PPC.Opening.show();
  requestAnimationFrame(loop);
})();
