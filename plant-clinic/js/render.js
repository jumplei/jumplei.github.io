var PPC = PPC || {};

PPC.Render = (function () {

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var W = 400, H = 225;
  var SCALE = 2;

  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;

  var mode = "normal";
  var ZOOM = { k: 2.3, cx: 200, cy: 112 };
  var mouse = null;
  var LENS = { r: 34, m: 1.8 };
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var timeCrunch = false;
  var emergencyRemaining = 180;

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function fill_ellipse(cx, cy, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function line(x0, y0, x1, y1, w, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  function polygon(points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  function plantBounds() {
    var base = { x: 130, y: 58, w: 130, h: 88 };
    if (mode === "zoom") {
      return {
        x: ZOOM.cx - base.w * ZOOM.k / 2,
        y: ZOOM.cy - base.h * ZOOM.k / 2,
        w: base.w * ZOOM.k,
        h: base.h * ZOOM.k
      };
    }
    return base;
  }

  function hotspotPos(h) {
    var b = plantBounds();
    var P = { x: b.x + h.nx * b.w, y: b.y + h.ny * b.h };
    if (mode === "zoom") {
      var c = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      return { x: ZOOM.cx + (P.x - c.x), y: ZOOM.cy + (P.y - c.y), r: 13 };
    }
    return { x: P.x, y: P.y, r: 7 };
  }

  function customerRect() {
    return mode === "zoom" ? null : { x: 96, y: 132, w: 36, h: 52 };
  }

  function computerRect() {
    return mode === "zoom" ? null : { x: 328, y: 118, w: 50, h: 42 };
  }

  function setMode(m) { mode = m; }
  function setTimeCrunch(enabled) { timeCrunch = !!enabled; }
  function setEmergencyRemaining(seconds) { emergencyRemaining = seconds; }
  function isZoomed() { return mode === "zoom"; }
  function setMouse(x, y) { mouse = (x === null || y === null) ? null : { x: x, y: y }; }

  function drawRoom() {
    rect(0, 0, W, H, "#3a2a32");
    rect(0, 0, W, 112, "#e5cf9c");
    rect(0, 6, W, 4, "#f3dfaa");
    rect(0, 108, W, 8, "#85513a");
    var i;
    for (i = 0; i < W; i += 32) {
      rect(i, 116, 31, 74, (Math.floor(i / 32) % 2 === 0) ? "#a76745" : "#9a5d3e");
      rect(i + 29, 116, 3, 74, "#75432f");
    }
    for (i = 0; i < W; i += 40) {
      rect(i, 190, 39, 35, (Math.floor(i / 40) % 2 === 0) ? "#c18a50" : "#b77945");
      rect(i, 190, 2, 35, "#8d5937");
    }
    rect(132, 202, 136, 18, "#6d3d48");
    rect(138, 205, 124, 12, "#bd765a");
    rect(145, 208, 110, 6, "#e0a568");
    rect(8, 86, 3, 18, "#8d5937");
    rect(389, 78, 3, 25, "#8d5937");
    rect(42, 94, 14, 2, "#d6b978");
    rect(278, 70, 22, 2, "#d6b978");
    rect(318, 101, 10, 2, "#c19e67");
    rect(45, 197, 22, 2, "#8d5937");
    rect(302, 211, 31, 2, "#8d5937");
    rect(350, 24, 2, 25, "#76503a");
    fill_ellipse(347, 51, 7, 4, "#47794b");
    fill_ellipse(354, 54, 8, 4, "#5b914f");
    fill_ellipse(349, 59, 6, 4, "#3d6b43");
    drawWindow();
    drawShelves();
    drawComputer();
    drawSign();
  }

  function drawWindow() {
    rect(22, 16, 86, 52, "#5b382d");
    rect(27, 21, 76, 42, "#8ed0d2");
    ctx.save();
    ctx.beginPath();
    ctx.rect(27, 21, 76, 36);
    ctx.clip();
    fill_ellipse(88, 31, 7, 7, "#ffe09a");
    fill_ellipse(48, 52, 25, 12, "#6aa85d");
    fill_ellipse(82, 54, 32, 14, "#4f8b55");
    ctx.restore();
    rect(27, 57, 76, 6, "#7fbe66");
    rect(63, 21, 4, 42, "#674130");
    rect(27, 40, 76, 4, "#674130");
    rect(17, 13, 12, 60, "#c46c58");
    rect(101, 13, 12, 60, "#c46c58");
    rect(19, 17, 4, 48, "#e29670");
    rect(105, 17, 4, 48, "#e29670");
  }

  function drawShelves() {
    rect(126, 22, 70, 6, "#71422e");
    rect(132, 28, 5, 22, "#71422e");
    rect(185, 28, 5, 22, "#71422e");
    rect(134, 13, 12, 9, "#b65f45");
    rect(151, 10, 10, 12, "#6d9e61");
    rect(166, 14, 8, 8, "#d5a04d");
    rect(179, 11, 11, 11, "#7499a2");
    fill_ellipse(155, 8, 8, 5, "#5f9e46");
  }

  function drawCounter() {
    rect(12, 145, W - 24, 43, "#895036");
    rect(12, 145, W - 24, 6, "#d08a50");
    rect(12, 151, W - 24, 3, "#6e3e2d");
    rect(12, 178, W - 24, 6, "#603629");
    rect(22, 158, W - 44, 14, "#9e6040");
    rect(28, 162, W - 56, 6, "#b97548");
    rect(20, 181, 40, 5, "#5c3a1f");
    rect(80, 181, 40, 5, "#5c3a1f");
    rect(90, 158, 36, 13, "#603629");
  }

  function drawComputer() {
    rect(330, 124, 46, 26, "#3a3a46");
    rect(334, 128, 38, 18, "#0c2b12");
    ctx.font = "bold 6px monospace";
    ctx.fillStyle = "#7fd67f";
    ctx.fillText("REC SCAN", 337, 134);
    rect(337, 136, 24, 2, "#7fd67f");
    rect(337, 139, 18, 2, "#7fd67f");
    rect(337, 142, 28, 2, "#7fd67f");
    ctx.font = "10px monospace";
    rect(344, 150, 18, 4, "#2c2c34");
    rect(340, 154, 26, 4, "#2c2c34");
    rect(348, 149, 2, 2, "#7fd67f");
  }

  function drawSign() {
    rect(210, 8, 170, 20, "#5b382d");
    rect(213, 11, 164, 14, "#37624c");
    ctx.fillStyle = "#fff0bc";
    ctx.font = "bold 6px monospace";
    ctx.fillText("PIXEL PLANT CLINIC BY ETHAN LEI", 220, 21);
  }

  function drawPot() {
    fill_ellipse(200, 155, 20, 4, "rgba(51,31,25,.35)");
    rect(183, 131, 34, 3, "#5a3328");
    rect(181, 134, 38, 6, "#7a412e");
    rect(184, 135, 32, 3, "#d9824d");
    rect(187, 140, 27, 12, "#a85737");
    rect(190, 142, 4, 8, "#cf7546");
    rect(210, 141, 4, 10, "#743b2d");
    rect(190, 152, 21, 3, "#603127");
    rect(186, 130, 28, 3, "#3b2a22");
    rect(190, 130, 20, 2, "#513b2b");
  }

  function rustSpecks(points, color, dark) {
    points.forEach(function (p, i) {
      rect(p[0], p[1], i % 3 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1, color);
      if (mode === "zoom" && i % 3 === 0) rect(p[0] + 1, p[1], 1, 1, dark);
    });
  }

  function roseBlade(x, y, angle, length, width, shade, spotStyle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    polygon([
      [0,0],[length*.12,-width*.55],[length*.32,-width],[length*.58,-width*.92],
      [length*.8,-width*.55],[length,0],[length*.78,width*.58],[length*.55,width*.94],
      [length*.3,width],[length*.1,width*.5]
    ], "#294d35");
    polygon([
      [1,0],[length*.14,-width*.42],[length*.34,-width*.78],[length*.56,-width*.72],
      [length*.76,-width*.43],[length*.9,0],[length*.75,width*.44],[length*.54,width*.73],
      [length*.32,width*.78],[length*.13,width*.4]
    ], shade);
    line(1,0,length*.88,0,1,"#a6c676");
    line(length*.3,0,length*.48,-width*.58,.55,"#7fac5c");
    line(length*.3,0,length*.48,width*.58,.55,"#7fac5c");
    line(length*.55,0,length*.7,-width*.42,.55,"#7fac5c");
    line(length*.55,0,length*.7,width*.42,.55,"#7fac5c");
    if (spotStyle) {
      rustSpecks([
        [length*.28,-width*.42],[length*.42,width*.28],[length*.55,-width*.3],
        [length*.66,width*.35],[length*.76,-width*.18]
      ], spotStyle.color, spotStyle.color2);
      if (mode === "zoom") rustSpecks([[length*.35,0],[length*.5,width*.45],[length*.7,-width*.45]],"#f2a43b",spotStyle.color2);
    }
    ctx.restore();
  }

  function roseCompoundLeaf(cx, cy, angle, scale, spotStyle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    line(0,0,25*scale,0,2.2,"#294d35");
    line(0,0,25*scale,0,.8,"#91b85d");
    line(7*scale,0,6*scale,-3*scale,1.2,"#315d3b");
    line(7*scale,0,6*scale,3*scale,1.2,"#315d3b");
    line(14*scale,0,14*scale,-3*scale,1.2,"#315d3b");
    line(14*scale,0,14*scale,3*scale,1.2,"#315d3b");
    roseBlade(6*scale,-3*scale,-1.08,14*scale,5.5*scale,"#57964b",spotStyle);
    roseBlade(6*scale,3*scale,1.08,14*scale,5.5*scale,"#65a752",spotStyle);
    roseBlade(14*scale,-3*scale,-.78,15*scale,6*scale,"#4f8d4c",spotStyle);
    roseBlade(14*scale,3*scale,.78,15*scale,6*scale,"#70ae55",spotStyle);
    roseBlade(22*scale,0,0,17*scale,6.5*scale,"#609c4b",spotStyle);
    ctx.restore();
  }

  function roseBloom(cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    polygon([[-9, 0], [-7, -7], [-2, -10], [2, -10], [8, -6], [10, 0], [7, 7], [0, 10], [-7, 7]], "#6e2838");
    rect(-7, -5, 6, 7, "#c94352");
    rect(1, -6, 6, 7, "#df5360");
    rect(-6, 2, 6, 5, "#e46467");
    rect(1, 1, 7, 6, "#b9364b");
    rect(-3, -3, 6, 7, "#f17c72");
    rect(-1, -1, 3, 3, "#ffd27a");
    rect(-8, 7, 5, 3, "#315d3b");
    rect(4, 6, 5, 3, "#315d3b");
    ctx.restore();
  }

  function roseBud(cx, cy, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    line(0, 7, 0, 15, 2, "#315d3b");
    polygon([[-5,5],[-4,-1],[0,-6],[4,-1],[5,5],[0,8]], "#6e2838");
    polygon([[-3,4],[-2,0],[0,-4],[2,0],[3,4],[0,6]], "#d94d5a");
    polygon([[-5,5],[-8,3],[-4,8]], "#315d3b");
    polygon([[5,5],[8,3],[4,8]], "#315d3b");
    ctx.restore();
  }

  function drawRosePlant(visual) {
    line(199,134,199,66,6,"#294d35");
    line(199,134,199,66,2.5,"#668b4e");
    line(198,118,182,98,4,"#294d35");
    line(182,98,176,79,3,"#294d35");
    line(200,97,220,84,4,"#294d35");
    line(220,84,231,76,3,"#294d35");
    line(199,88,211,82,2.5,"#315d3b");
    polygon([[198,111],[192,108],[198,116]],"#315d3b");
    polygon([[200,101],[206,98],[200,106]],"#315d3b");
    polygon([[185,96],[190,92],[186,101]],"#315d3b");
    var spot = visual && visual.spots ? { color: visual.spotColor, color2: visual.spotColor2 } : null;
    roseCompoundLeaf(198,119,2.92,.88,spot);
    roseCompoundLeaf(201,112,.08,.9,null);
    roseCompoundLeaf(198,103,2.95,.94,spot);
    roseCompoundLeaf(201,95,-.18,.94,spot);
    roseCompoundLeaf(182,98,2.72,.76,spot);
    roseCompoundLeaf(211,82,-.12,.72,null);
    roseCompoundLeaf(198,80,2.9,.7,null);
    rustSpecks([[175,90],[178,92],[181,89]], visual.spotColor, visual.spotColor2);
    rustSpecks([[223,87],[226,89],[229,86]], visual.spotColor, visual.spotColor2);
    roseBloom(199,63);
    roseBloom(176,78);
    roseBud(231,70,.35);
    ctx.save();
    ctx.translate(188, 128);
    ctx.rotate(-.25);
    polygon([[-8, 0], [-4, -5], [4, -4], [9, 0], [4, 5], [-4, 4]], "#5c3e28");
    polygon([[-7, 0], [-3, -4], [4, -3], [8, 0], [3, 4], [-4, 3]], "#c28a35");
    rustSpecks([[-3,-2],[1,1],[4,-1]], visual.spotColor, visual.spotColor2);
    ctx.restore();
    drawPot();
  }

  function squashLeaf(cx, cy, rx, ry, angle, powderStyle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    var outline = [
      [-rx, 0], [-rx * .72, -ry * .25], [-rx * .82, -ry * .7],
      [-rx * .38, -ry * .58], [0, -ry], [rx * .34, -ry * .58],
      [rx * .82, -ry * .72], [rx * .7, -ry * .23], [rx, 0],
      [rx * .66, ry * .2], [rx * .76, ry * .7], [rx * .3, ry * .55],
      [0, ry], [-rx * .3, ry * .55], [-rx * .76, ry * .7], [-rx * .66, ry * .2]
    ];
    polygon(outline, "#294d35");
    polygon(outline.map(function (p) { return [p[0] * .88, p[1] * .82]; }), "#57964b");
    polygon([[0, 0], [-rx * .7, -ry * .12], [-rx * .42, ry * .15]], "#69a653");
    polygon([[0, 0], [rx * .68, -ry * .14], [rx * .4, ry * .16]], "#72ad56");
    line(0, ry * .75, 0, -ry * .75, 1.2, "#b7d486");
    line(0, 0, rx * .66, -ry * .53, .8, "#a7c978");
    line(0, 0, -rx * .66, -ry * .52, .8, "#a7c978");
    line(0, ry * .18, rx * .58, ry * .5, .8, "#9fc173");
    line(0, ry * .18, -rx * .58, ry * .5, .8, "#9fc173");
    rect(-rx * .28, -ry * .35, 2, 2, "#83b965");
    rect(rx * .38, ry * .25, 2, 2, "#3f7b42");
    if (powderStyle) {
      ctx.globalAlpha = .9;
      rect(-rx * .38, -ry * .42, rx * .34, ry * .3, powderStyle.color2);
      rect(-rx * .2, -ry * .5, rx * .34, ry * .42, powderStyle.color);
      rect(rx * .16, -ry * .18, rx * .4, ry * .35, powderStyle.color2);
      rect(-rx * .06, ry * .12, rx * .34, ry * .3, powderStyle.color);
      var dust = [[-.42,-.2],[-.25,-.55],[-.08,-.3],[.12,-.42],[.3,-.15],[.48,.12],[-.3,.28],[.05,.42]];
      dust.forEach(function (p, i) {
        rect(p[0] * rx, p[1] * ry, i % 3 === 0 ? 3 : 2, i % 2 === 0 ? 2 : 3, i % 2 ? "#fffdf0" : "#e9e3cf");
      });
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function squashFlower(cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    for (var i = 0; i < 5; i++) {
      var a = i * Math.PI * 2 / 5 - Math.PI / 2;
      var px = Math.cos(a) * 5 * scale;
      var py = Math.sin(a) * 5 * scale;
      polygon([[0,0],[px-2*scale,py],[px,py-5*scale],[px+2*scale,py]], i % 2 ? "#e7a83e" : "#f4c34e");
    }
    rect(-2*scale,-2*scale,4*scale,4*scale,"#8d6a2f");
    ctx.restore();
  }

  function drawSquashPlant(visual) {
    var crown = [199,132];
    var stems = [[206,92],[236,112],[168,110],[186,76],[222,70],[151,88],[250,84],[159,126],[244,130],[174,91],[229,92]];
    stems.forEach(function (s, i) {
      line(crown[0],crown[1],s[0],s[1],i < 5 ? 5 : 3.5,"#315d3b");
      line(crown[0],crown[1],s[0],s[1],i < 5 ? 2 : 1.3,"#83ad5f");
    });
    var p = visual && visual.powder ? { color: visual.powderColor, color2: visual.powderColor2 } : null;
    squashLeaf(186,76,23,15,-.05,p);
    squashLeaf(222,70,21,13,.25,p);
    squashLeaf(151,88,22,14,-.2,p);
    squashLeaf(250,84,20,13,.35,p);
    squashLeaf(168,110,27,17,-.45,p);
    squashLeaf(236,112,28,18,.3,p);
    squashLeaf(206,92,31,20,-.15,p);
    squashLeaf(159,126,22,14,-.3,p);
    squashLeaf(244,130,23,15,.2,p);
    squashLeaf(174,91,19,12,.2,p);
    squashLeaf(229,92,19,12,-.35,p);
    ctx.strokeStyle = "#78a957";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(251, 122, 7, .3, Math.PI * 1.7);
    ctx.stroke();
    rect(197, 129, 5, 3, "#d8b54f");
    rect(201, 127, 4, 4, "#f0ca58");
    line(199,128,176,121,3,"#315d3b");
    polygon([[176,117],[168,116],[161,120],[168,124],[177,123]],"#315d3b");
    polygon([[175,118],[168,118],[163,120],[169,122],[176,122]],"#75a94f");
    squashFlower(246,102,.85);
    squashFlower(181,116,.65);
    drawPot();
  }

  function basilLeaf(cx, cy, angle, scale, diseased, underside) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    polygon([[0,0],[5*scale,-7*scale],[15*scale,-9*scale],[24*scale,-5*scale],[29*scale,0],[24*scale,5*scale],[15*scale,9*scale],[5*scale,7*scale]], "#274b32");
    polygon([[1*scale,0],[6*scale,-6*scale],[15*scale,-8*scale],[23*scale,-4*scale],[27*scale,0],[23*scale,4*scale],[15*scale,8*scale],[6*scale,6*scale]], underside ? "#71865b" : "#4d9648");
    line(1, 0, 25 * scale, 0, 1, underside ? "#aab48a" : "#a5ca75");
    for (var i = 6; i < 23; i += 5) {
      line(i * scale, 0, (i + 4) * scale, -4 * scale, .6, underside ? "#899674" : "#76ad5c");
      line(i * scale, 0, (i + 4) * scale, 4 * scale, .6, underside ? "#899674" : "#76ad5c");
    }
    if (diseased) {
      polygon([[8*scale,-5*scale],[14*scale,-6*scale],[17*scale,-1*scale],[13*scale,1*scale],[7*scale,0]], underside ? "#6c6270" : "#b4ad5d");
      polygon([[17*scale,1*scale],[23*scale,0],[24*scale,4*scale],[20*scale,6*scale],[16*scale,4*scale]], underside ? "#584e61" : "#9e914b");
      if (mode === "zoom") {
        var fuzz = [[10,-3],[12,-1],[15,-4],[18,2],[20,4],[22,1]];
        fuzz.forEach(function (p) { rect(p[0]*scale,p[1]*scale,1.5,1.5, underside ? "#8d8291" : "#65515d"); });
      }
      rect(24*scale,-2*scale,4*scale,4*scale,"#65413f");
    }
    ctx.restore();
  }

  function drawBasilPlant(visual) {
    line(198,134,198,66,6,"#315d3b");
    line(198,134,198,66,2.5,"#7eab61");
    line(198,116,181,98,4,"#315d3b");
    line(181,98,174,77,3,"#315d3b");
    line(198,115,216,96,4,"#315d3b");
    line(216,96,228,74,3,"#315d3b");
    line(198,126,177,118,3,"#315d3b");
    line(198,126,222,119,3,"#315d3b");
    line(198,91,184,79,3,"#315d3b");
    line(198,91,212,78,3,"#315d3b");
    basilLeaf(198,122,3.02,.95,true,false);
    basilLeaf(198,122,.08,.95,false,false);
    basilLeaf(196,108,3.0,.9,true,false);
    basilLeaf(200,108,-.1,.9,true,true);
    basilLeaf(181,98,2.8,.82,true,false);
    basilLeaf(181,98,-1.85,.72,false,false);
    basilLeaf(216,96,.02,.84,true,true);
    basilLeaf(216,96,-1.25,.72,false,false);
    basilLeaf(177,118,2.9,.75,true,false);
    basilLeaf(222,119,-.12,.75,false,false);
    basilLeaf(198,91,2.95,.78,true,false);
    basilLeaf(198,91,-.08,.78,true,false);
    basilLeaf(174,77,2.65,.68,false,false);
    basilLeaf(174,77,-1.4,.62,false,false);
    basilLeaf(228,74,.1,.68,true,false);
    basilLeaf(228,74,-1.45,.58,false,false);
    basilLeaf(184,79,2.7,.58,false,false);
    basilLeaf(212,78,-.2,.58,false,false);
    basilLeaf(198,68,2.7,.48,false,false);
    basilLeaf(198,68,-.45,.48,false,false);
    polygon([[174,85],[181,83],[185,88],[180,93],[174,91]], "#b4ad5d");
    rect(177,87,3,2,"#7f7045");
    rect(235,88,6,5,"#66596f");
    if (mode === "zoom") {
      rect(236,87,2,2,"#94889a"); rect(240,91,2,2,"#4c4453"); rect(238,94,1,2,"#94889a");
    }
    rect(229,78,5,4,"#65413f");
    rect(194, 116, 5, 4, "#405f36");
    rect(191, 119, 4, 3, "#6d8744");
    drawPot();
  }

  function septoriaLesions(points, color, center) {
    points.forEach(function (p, i) {
      rect(p[0]-2,p[1]-2,5,5,"#544031");
      rect(p[0]-1,p[1]-1,3,3,color);
      rect(p[0],p[1],1,1,center);
      if (mode === "zoom" && i % 2 === 0) rect(p[0]+1,p[1],1,1,"#211c19");
    });
  }

  function tomatoLeaflet(cx, cy, w, h, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    polygon([[0,0],[w*.4,-h*.5],[w*.8,-h*.3],[w,-h*.05],[w*.75,h*.25],[w*.4,h*.15],[0,h*.05]],"#356835");
    polygon([[w*.05,0],[w*.35,-h*.38],[w*.7,-h*.22],[w*.85,-h*.02],[w*.65,h*.15],[w*.38,h*.12],[w*.05,h*.02]],"#509a49");
    line(0,0,w*.85,0,.8,"#a5d27c");
    ctx.restore();
  }

  function patiotomatoLeaf(cx, cy, angle, scale, diseased, visual) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    line(0,0,14*scale,0,1.8,"#386840");
    var s = scale;
    tomatoLeaflet(4*s, 0, 13*s, 6*s, -.48);
    tomatoLeaflet(4*s, 0, 13*s, 6*s, .42);
    tomatoLeaflet(6.5*s, -.5*s, 12*s, 5.5*s, -.34);
    tomatoLeaflet(6.5*s, .5*s, 12*s, 5.5*s, .38);
    tomatoLeaflet(9*s, 0, 11*s, 5*s, -.22);
    tomatoLeaflet(9*s, 0, 11*s, 5*s, .18);
    tomatoLeaflet(11.5*s, -.2*s, 9*s, 4.5*s, -.08);
    tomatoLeaflet(11.5*s, .2*s, 9*s, 4.5*s, .1);
    tomatoLeaflet(13.5*s, 0, 8*s, 4*s, 0);
    if (diseased) {
      septoriaLesions([[9*s,-1.5*s],[13*s,1*s],[16*s,-1.2*s],[20*s,.6*s]], visual.lesionColor, visual.centerColor);
    }
    ctx.restore();
  }

  function patiotomatoFruit(cx, cy, r, ripe) {
    line(cx,cy-r+2,cx-2,cy-r-4,2,"#386840");
    fill_ellipse(cx, cy, r, r, ripe ? "#a73535" : "#38663c");
    fill_ellipse(cx, cy+1, r-1, r-1, ripe ? "#d94d45" : "#6daf54");
    rect(cx-r*.4, cy-r*.4, 2, 3, ripe ? "#f07b58" : "#a8cc78");
    polygon([[cx,cy-r+2],[cx-4,cy-r],[cx-1,cy-r+3],[cx+3,cy-r],[cx+1,cy-r+2]],"#386840");
    if (ripe) rect(cx+1,cy-r*.3,1.5,2,"#ffd97a");
  }

  function patiotomatoFlower(cx, cy) {
    for (var i = 0; i < 5; i++) {
      var a = i * Math.PI * 2 / 5 - Math.PI / 2;
      var fx = cx + Math.cos(a) * 3.5;
      var fy = cy + Math.sin(a) * 3.5;
      polygon([[fx,fy],[fx+Math.cos(a)*4-2,fy+Math.sin(a)*4-2],[fx+Math.cos(a)*4+2,fy+Math.sin(a)*4-2]],"#f0ca58");
    }
    rect(cx-2,cy-2,4,4,"#8d6a2f");
  }

  function drawTomatoPlant(visual) {
    line(199,134,200,66,6,"#386840");
    line(199,134,200,66,2.5,"#7aad59");
    line(200,118,170,108,3.5,"#386840");
    line(170,108,160,98,2.5,"#386840");
    line(200,114,228,104,3.5,"#386840");
    line(228,104,246,98,2.5,"#386840");
    line(200,101,180,86,3,"#386840");
    line(200,97,223,82,3,"#386840");
    line(200,113,165,114,2.8,"#386840");
    line(200,103,234,84,2.8,"#386840");
    line(200,86,168,82,2.5,"#386840");
    line(200,75,242,66,2.5,"#386840");
    line(200,82,192,72,2.5,"#386840");
    line(200,78,209,70,2.5,"#386840");
    line(200,74,199,64,2,"#386840");
    patiotomatoLeaf(170,108,3.0,.78,true,visual);
    patiotomatoLeaf(160,98,2.55,.58,true,visual);
    patiotomatoLeaf(200,121,2.78,.62,true,visual);
    patiotomatoLeaf(200,121,-2.9,.64,true,visual);
    patiotomatoLeaf(228,104,-.18,.68,true,visual);
    patiotomatoLeaf(246,98,-.42,.55,false,visual);
    patiotomatoLeaf(180,86,2.82,.65,false,visual);
    patiotomatoLeaf(223,82,-.22,.66,false,visual);
    patiotomatoLeaf(200,101,-.05,.6,false,visual);
    patiotomatoLeaf(192,72,2.65,.55,false,visual);
    patiotomatoLeaf(209,70,-.35,.55,false,visual);
    patiotomatoLeaf(199,64,2.48,.45,false,visual);
    patiotomatoLeaf(165,114,2.5,.68,false,visual);
    patiotomatoLeaf(168,82,2.6,.62,false,visual);
    patiotomatoLeaf(234,84,-.6,.68,false,visual);
    patiotomatoLeaf(242,66,-.8,.48,false,visual);
    patiotomatoLeaf(190,93,2.45,.52,false,visual);
    patiotomatoLeaf(215,78,-.5,.55,false,visual);
    patiotomatoLeaf(178,121,-2.82,.98,true,visual);
    patiotomatoLeaf(221,120,-.32,.96,true,visual);
    patiotomatoLeaf(151,111,2.96,.9,true,visual);
    patiotomatoLeaf(247,110,-.18,.92,true,visual);
    patiotomatoLeaf(168,99,-2.72,.88,true,visual);
    patiotomatoLeaf(233,96,-.48,.9,false,visual);
    patiotomatoLeaf(174,86,2.86,.84,false,visual);
    patiotomatoLeaf(226,84,-.65,.86,false,visual);
    patiotomatoLeaf(183,73,2.32,.8,false,visual);
    patiotomatoLeaf(217,71,.82,.82,false,visual);
    patiotomatoLeaf(193,91,1.92,.78,false,visual);
    patiotomatoLeaf(207,89,1.08,.8,false,visual);
    septoriaLesions([[156,106],[166,111],[218,113],[228,108],[163,116],[235,86],[169,120],[226,120],[153,111],[166,101]],visual.lesionColor,visual.centerColor);
    line(207,92,220,84,2,"#386840");
    line(190,89,184,83,2,"#386840");
    patiotomatoFruit(220,84,6,false);
    patiotomatoFruit(184,83,5,false);
    patiotomatoFruit(209,79,5,true);
    patiotomatoFlower(240,72);
    line(199,112,207,104,1.8,"#386840");
    patiotomatoFlower(207,104);
    rect(185,130,30,3,"#493526");
    rect(188,128,5,2,"#8e6237");
    rect(205,129,4,2,"#725134");
    drawPot();
  }

  function drawFineDetailCue(x, y) {
    if (mode === "zoom") return;
    var blink = reducedMotion ? 1 : (Math.sin(Date.now() / 320) > 0 ? 1 : 0.55);
    ctx.save();
    ctx.globalAlpha = blink;
    rect(x - 5, y - 5, 3, 1, "#fff4b3");
    rect(x - 5, y - 5, 1, 3, "#fff4b3");
    rect(x + 3, y + 4, 3, 1, "#fff4b3");
    rect(x + 5, y + 2, 1, 3, "#fff4b3");
    rect(x, y - 7, 1, 2, "#ffe07d");
    ctx.restore();
  }

  function drawSevereSymptoms(visual) {
    if (visual.sprite === "rose") {
      rustSpecks([[164,104],[171,109],[181,116],[214,107],[225,113],[234,101],[193,92]], visual.spotColor, visual.spotColor2);
      polygon([[216,132],[222,128],[230,131],[226,137],[218,137]], "#8a4d2e");
    } else if (visual.sprite === "squash") {
      [[172,82],[184,76],[207,79],[225,91],[195,103]].forEach(function (p) {
        fill_ellipse(p[0], p[1], 7, 3, "#eee8d8");
        rect(p[0]-4, p[1]-1, 8, 1, "#d7cfba");
      });
    } else if (visual.sprite === "basil") {
      [[174,84],[185,97],[211,83],[226,98],[202,108]].forEach(function (p) {
        polygon([[p[0]-5,p[1]],[p[0],p[1]-4],[p[0]+5,p[1]],[p[0],p[1]+4]], "#a89a55");
        rect(p[0]-2, p[1], 5, 2, "#66596f");
      });
    } else if (visual.sprite === "tomato") {
      septoriaLesions([[151,108],[160,119],[171,116],[205,119],[219,108],[228,115],[238,104]], visual.lesionColor, visual.centerColor);
      polygon([[165,121],[173,115],[180,121],[175,128],[168,127]], "#9b8b4f");
    }
    drawEmergencyCollapse(visual.sprite);
  }

  function drawEmergencyLeaf(sprite, x, y, scale, color) {
    if (sprite === "squash") {
      polygon([[x-12*scale,y],[x-9*scale,y-6*scale],[x-4*scale,y-5*scale],[x,y-10*scale],[x+4*scale,y-5*scale],[x+10*scale,y-6*scale],[x+12*scale,y],[x+8*scale,y+4*scale],[x+4*scale,y+8*scale],[x,y+5*scale],[x-5*scale,y+8*scale],[x-9*scale,y+4*scale]], color);
    } else if (sprite === "basil") {
      polygon([[x-9*scale,y],[x-5*scale,y-5*scale],[x+2*scale,y-6*scale],[x+9*scale,y],[x+3*scale,y+5*scale],[x-4*scale,y+5*scale]], color);
    } else if (sprite === "tomato") {
      polygon([[x-11*scale,y],[x-6*scale,y-4*scale],[x-1*scale,y-3*scale],[x+3*scale,y-6*scale],[x+10*scale,y-3*scale],[x+12*scale,y+1*scale],[x+5*scale,y+4*scale],[x,y+3*scale],[x-6*scale,y+5*scale]], color);
    } else {
      polygon([[x-8*scale,y],[x-5*scale,y-6*scale],[x+1*scale,y-7*scale],[x+8*scale,y-2*scale],[x+7*scale,y+3*scale],[x+2*scale,y+6*scale],[x-5*scale,y+5*scale]], color);
    }
  }

  function emergencyLeafProfile(sprite) {
    if (sprite === "squash") return [[166,87,1.15],[191,77,1.3],[215,84,1.1],[232,98,1.2],[182,106,1.05],[205,111,1.15]];
    if (sprite === "basil") return [[174,87,.9],[188,80,.8],[211,84,.95],[228,94,.85],[184,106,.8],[205,108,.9]];
    if (sprite === "tomato") return [[170,108,.75],[160,98,.65],[200,121,.72],[228,104,.78],[180,86,.7],[223,82,.7],[199,64,.5],[165,114,.6],[234,84,.65],[168,82,.6],[242,66,.52],[215,78,.58],[190,93,.55],[178,121,.98],[221,120,.96],[151,111,.9],[247,110,.92],[168,99,.88],[233,96,.9],[174,86,.84],[226,84,.86],[183,73,.8],[217,71,.82],[193,91,.78],[207,89,.8]];
    return [[174,98,.85],[194,103,.9],[210,95,.8],[224,88,.75],[182,82,.7],[201,116,.8]];
  }

  function drawEmergencyCollapse(sprite) {
    if (emergencyRemaining > 15) return;
    var progress = Math.max(0, Math.min(1, (15 - emergencyRemaining) / 15));
    var leaves = emergencyLeafProfile(sprite);
    var deadColor = progress > .55 ? "#694432" : "#a89255";
    var i;
    for (i = 0; i < leaves.length; i++) {
      var leaf = leaves[i];
      var start = i / leaves.length * .72;
      var leafProgress = Math.max(0, Math.min(1, (progress - start) / (1 - start)));
      if (leafProgress <= 0) continue;
      ctx.save();
      ctx.globalAlpha = .3 + leafProgress * .7;
      drawEmergencyLeaf(sprite, leaf[0], leaf[1], leaf[2], deadColor);
      ctx.restore();
      if (leafProgress > .18) {
        var fall = (leafProgress - .18) / .82;
        drawEmergencyLeaf(sprite, leaf[0] + (i % 2 ? 3 : -3) * fall, leaf[1] + 7 + fall * 33, leaf[2], "#654536");
      }
    }
    if (progress >= .95) {
      line(199,134,201,75,3,"#5b4435");
      rect(184,130,32,5,"#4f382d");
    }
  }

  function drawFoliage(visual) {
    if (!visual) return;
    if (visual.sprite === "rose") {
      drawRosePlant(visual);
      if (timeCrunch) drawSevereSymptoms(visual);
      drawFineDetailCue(177, 91);
      drawFineDetailCue(225, 88);
      return;
    }
    if (visual.sprite === "squash") {
      drawSquashPlant(visual);
      if (timeCrunch) drawSevereSymptoms(visual);
      drawFineDetailCue(204, 84);
      return;
    }
    if (visual.sprite === "basil") {
      drawBasilPlant(visual);
      if (timeCrunch) drawSevereSymptoms(visual);
      drawFineDetailCue(220, 94);
      return;
    }
    if (visual.sprite === "tomato") {
      drawTomatoPlant(visual);
      if (timeCrunch) drawSevereSymptoms(visual);
      drawFineDetailCue(174, 112);
      return;
    }
  }

  function highlight(hx, hy, r) {
    ctx.strokeStyle = "#ffffff";
    ctx.globalAlpha = reducedMotion ? 0.8 : 0.55 + Math.sin(Date.now() / 200) * 0.25;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#7fd67f";
    ctx.fillRect(hx - 1.5, hy - 2.5, 3, 3);
    ctx.globalAlpha = 1;
  }

  function drawCustomerAt(x, y, appearance) {
    var bob = reducedMotion ? 0 : Math.sin(Date.now() / 220) * 1;
    appearance = appearance || {};
    var skin = appearance.skin || "#e8b77c";
    var hair = appearance.hair || "#704638";
    var shirt = appearance.shirt || "#c95645";
    var accent = appearance.accent || "#78a85c";
    fill_ellipse(x, y + 5, 10, 3, "rgba(51,31,25,.3)");
    rect(x - 7, y - 45 + bob, 14, 13, hair);
    rect(x - 6, y - 42 + bob, 12, 11, skin);
    rect(x - 7, y - 44 + bob, 14, 4, hair);
    rect(x - 5, y - 38 + bob, 2, 2, "#3b2a25");
    rect(x + 3, y - 38 + bob, 2, 2, "#3b2a25");
    rect(x - 1, y - 34 + bob, 3, 1, "#b96c58");
    rect(x - 9, y - 32 + bob, 18, 18, "#49352f");
    rect(x - 7, y - 31 + bob, 14, 15, shirt);
    rect(x - 9, y - 28 + bob, 4, 15, skin);
    rect(x + 5, y - 28 + bob, 4, 12, skin);
    rect(x - 5, y - 24 + bob, 10, 12, "#ead59e");
    rect(x - 2, y - 23 + bob, 4, 3, accent);
    rect(x - 7, y - 14 + bob, 14, 5, "#315475");
    rect(x - 7, y - 9 + bob, 6, 10, "#3d6690");
    rect(x + 1, y - 9 + bob, 6, 10, "#315475");
    rect(x - 8, y, 7, 5, "#352b32");
    rect(x + 1, y, 7, 5, "#352b32");
    if (appearance.accessory === "hat") {
      rect(x - 10, y - 47 + bob, 20, 3, accent);
      rect(x - 6, y - 51 + bob, 13, 5, "#a66c38");
    } else if (appearance.accessory === "chef") {
      rect(x - 7, y - 50 + bob, 14, 6, "#f5ecd7");
      rect(x - 9, y - 48 + bob, 4, 5, "#fff8e6");
      rect(x + 5, y - 48 + bob, 4, 5, "#fff8e6");
    } else if (appearance.accessory === "cap") {
      rect(x - 7, y - 47 + bob, 15, 4, accent);
      rect(x + 6, y - 44 + bob, 6, 2, accent);
    } else if (appearance.accessory === "flower") {
      rect(x + 5, y - 47 + bob, 4, 4, "#e46467");
      rect(x + 6, y - 48 + bob, 2, 6, "#f09a78");
    }
  }

  function drawCarriedPlant(x, y) {
    rect(x - 6, y + 6, 12, 8, "#8a5230");
    rect(x - 8, y + 2, 16, 4, "#b06040");
    rect(x - 7, y - 9, 5, 6, "#5c9a46");
    rect(x + 2, y - 11, 6, 6, "#5c9a46");
    rect(x - 1, y - 15, 5, 6, "#63a84e");
  }

  function drawHotspotsScreen(caseData, inspected, flipped, hoverId) {
    caseData.hotspots.forEach(function (h) {
      var p = hotspotPos(h);
      var seen = inspected.indexOf(h.id) !== -1;
      if (!seen) highlight(p.x, p.y, p.r);
      else if (mode !== "zoom") {
        rect(p.x - 3.4, p.y - 3.4, 6.8, 6.8, "#ffffff");
        ctx.fillStyle = "#2e5c1d";
        ctx.font = "bold 5px monospace";
        ctx.fillText("ok", p.x - 2.4, p.y + 1.2);
      }
      if (hoverId === h.id) {
        var fontSize = mode === "zoom" ? 8 : 6;
        var label = h.name.toUpperCase();
        var labelHeight = mode === "zoom" ? 15 : 12;
        ctx.font = "bold " + fontSize + "px monospace";
        var labelWidth = Math.min(W - 12, Math.ceil(ctx.measureText(label).width) + 10);
        var labelX = Math.max(6, Math.min(W - labelWidth - 6, p.x - labelWidth / 2));
        var labelY = p.y - labelHeight - 8;
        if (labelY < 30) labelY = p.y + 9;
        ctx.fillStyle = "#1b1512";
        ctx.globalAlpha = 0.85;
        rect(labelX, labelY, labelWidth, labelHeight);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffd97a";
        ctx.fillText(label, labelX + 5, labelY + labelHeight - 4);
      }
    });
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function drawEntering(t, caseData) {
    drawRoom();
    drawCounter();
    var appear = Math.min(1, Math.max(0, (t - 0.6) / 0.3));
    var wx = easeOutCubic(Math.min(1, t / 0.85));
    var ownerX = -46 + 154 * wx;
    var carry = Math.sin(Math.min(1, t / 0.5) * Math.PI);
    drawCarriedPlant(ownerX + 12, 170 - carry * 6);
    drawCustomerAt(ownerX, 202, caseData.portrait);
    if (appear > 0) {
      ctx.globalAlpha = appear;
      drawFoliage(caseData.visual);
      ctx.globalAlpha = 1;
    }
  }

  function drawLens(caseData) {
    if (!mouse) return;
    var mx = mouse.x, my = mouse.y;
    if (mx < 0 || mx > W || my < 0 || my > H) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, LENS.r, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(mx, my);
    ctx.scale(LENS.m, LENS.m);
    ctx.translate(-mx, -my);
    drawZoomedFoliage(caseData.visual);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, LENS.r, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#7fd67f";
    ctx.fillRect(mx - 1, my - 3, 2, 6);
    ctx.fillRect(mx - 3, my - 1, 6, 2);
    ctx.restore();
  }

  function drawZoomedFoliage(visual) {
    var base = { x: 130, y: 58, w: 130, h: 88 };
    ctx.save();
    ctx.translate(ZOOM.cx, ZOOM.cy);
    ctx.scale(ZOOM.k, ZOOM.k);
    ctx.translate(-(base.x + base.w / 2), -(base.y + base.h / 2));
    drawFoliage(visual);
    ctx.restore();
  }

  function drawZoomedPlant(caseData, inspected, flipped, hoverId) {
    rect(0, 0, W, H, "#141b2a");
    ctx.strokeStyle = "#3a4a66";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, W - 16, H - 16);
    drawZoomedFoliage(caseData.visual);
    drawLens(caseData);
    drawHotspotsScreen(caseData, inspected, flipped, hoverId);
    ctx.fillStyle = "#ffd97a";
    ctx.font = "bold 11px monospace";
    ctx.fillText("MAGNIFIED \u2013 " + caseData.plant.toUpperCase(), 18, 24);
  }

  function draw(phase, caseData, inspected, flipped, hoverId, anim, zoomed) {
    mode = zoomed ? "zoom" : "normal";
    if (anim && anim.t < 1) { drawEntering(anim.t, caseData); return; }
    if (zoomed && caseData) { drawZoomedPlant(caseData, inspected, flipped, hoverId); return; }
    if (!caseData) { drawRoom(); drawCounter(); drawCustomerAt(24, 200); return; }
    drawRoom();
    if (phase === "intake" || phase === "outcome") drawCustomerAt(108, 180, caseData.portrait);
    drawCounter();
    drawFoliage(caseData.visual);
    drawHotspotsScreen(caseData, inspected, flipped, hoverId);
  }

  return {
    draw: draw,
    plantBounds: plantBounds,
    hotspotPos: hotspotPos,
    customerRect: customerRect,
    computerRect: computerRect,
    setMode: setMode,
    setTimeCrunch: setTimeCrunch,
    setEmergencyRemaining: setEmergencyRemaining,
    isZoomed: isZoomed,
    setMouse: setMouse,
    rect: rect
  };
})();
