var PPC = PPC || {};

(function () {
  var canvas = document.getElementById("game");
  var wrap = document.getElementById("game-wrap");
  var hoverId = null;

  function resize() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var scale = Math.min(vw / 800, vh / 450, 4);
    canvas.style.width = (800 * scale) + "px";
    canvas.style.height = (450 * scale) + "px";
    wrap.style.width = (800 * scale) + "px";
    wrap.style.height = (450 * scale) + "px";
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
    var s = PPC.Game.getState();
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
  PPC.UI.menu();
  requestAnimationFrame(loop);
})();
