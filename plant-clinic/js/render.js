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
  // Approved art is split into scenery and workbench; patient plants stay live.
  var roomArt = typeof Image !== "undefined" ? new Image() : null;
  var benchArt = typeof Image !== "undefined" ? new Image() : null;
  if (roomArt) roomArt.src = "assets/clinic-room.png";
  if (benchArt) benchArt.src = "assets/clinic-workbench.png";
  function artReady() { return roomArt && benchArt && roomArt.complete && benchArt.complete && roomArt.naturalWidth && benchArt.naturalWidth; }

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
    if (artReady()) {
      ctx.drawImage(roomArt, 0, 0, W, H);
      drawSign();
      return;
    }
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
    ctx.save();
    ctx.translate(36, -20); // The fallback room has a shelf at the artwork's sign position.
    drawSign();
    ctx.restore();
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
    if (artReady()) {
      ctx.drawImage(benchArt, 0, 0, W, H);
      return;
    }
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
    // Match design/clinic-concept-v01/render_concept.py in its 880x495 art
    // coordinates. Keep the original frame, quiet margins and four brass pins;
    // the sign is drawn live over clean plaster, not baked into the room PNG.
    ctx.save();
    ctx.scale(W / 880, H / 495);
    ctx.translate(12, 0); // A little more breathing room beside the left shelf.
    rect(386, 65, 106, 40, "#6d7455");
    rect(383, 62, 106, 40, "#d3bc81");
    rect(387, 66, 98, 32, "#31594a");
    rect(390, 69, 92, 26, "#3f6753");
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#efe3b7";
    ctx.font = 'normal 10px Georgia, "Times New Roman", serif';
    ctx.fillText("PLANT CLINIC", 436, 83);
    ctx.fillStyle = "#c5d0a6";
    ctx.font = 'normal 6px "Courier New", monospace';
    ctx.fillText("OBSERVE · CARE", 436, 92);
    // The concept's 2x2-pixel pins sit in the dark inset, not on the gold rim.
    [[388, 67], [481, 67], [388, 96], [481, 96]].forEach(function (pin) {
      rect(pin[0], pin[1], 2, 2, "#f3e0a4");
    });
    ctx.restore();
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
    var edge = [
      [0,0],[.1,-.4],[.17,-.35],[.2,-.7],[.28,-.57],[.32,-.9],
      [.4,-.74],[.46,-1],[.53,-.8],[.61,-.95],[.66,-.7],[.75,-.74],
      [.78,-.5],[.86,-.5],[.88,-.25],[1,0],[.88,.22],[.86,.44],
      [.78,.42],[.74,.7],[.67,.6],[.6,.91],[.53,.77],[.45,.96],
      [.39,.74],[.31,.87],[.27,.6],[.19,.67],[.16,.36],[.09,.4]
    ];
    polygon(edge.map(function (p) { return [p[0]*length,p[1]*width]; }), "#294d35");
    polygon(edge.map(function (p) { return [p[0]*length*.96,p[1]*width*.84]; }), shade);
    polygon([[1,0],[length*.32,-width*.64],[length*.53,-width*.72],[length*.85,0]],"#80af5e");
    var vein = Math.max(.45,length*.024);
    line(1,0,length*.93,0,vein,"#adca7c");
    for (var v = .2; v < .75; v += .16) {
      var reach = Math.sin(v * Math.PI) * width * .72;
      line(length*v,0,length*(v+.14),-reach,vein*.55,"#9abb70");
      line(length*v,0,length*(v+.14),reach,vein*.55,"#3f7842");
    }
    if (spotStyle) {
      rustSpecks([
        [length*.28,-width*.42],[length*.42,width*.28],[length*.55,-width*.3],
        [length*.66,width*.35],[length*.76,-width*.18]
      ], spotStyle.color, spotStyle.color2);
      if (mode === "zoom") rustSpecks([[length*.35,0],[length*.5,width*.45],[length*.7,-width*.45]],"#f2a43b",spotStyle.color2);
    }
    ctx.restore();
  }

  function roseCompoundLeaf(cx, cy, angle, scale, spotStyle, bend) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    // The rachis is a fine, bowed leaf axis, NOT another woody cane. Its width
    // must scale with the leaf; the old constant 2.2px axes formed a rigid lattice.
    bend = bend === undefined ? 4 : bend;
    function node(x) { return [x*scale, bend*Math.pow(x/22,2)*scale]; }
    curvedStem([node(0),node(6),node(14),node(22)],1.05*scale,.32*scale,"#4a7146","#85a863");
    [[6,-1,14,5.5,"#57964b"],[6,1,14,5.5,"#65a752"],
      [14,-1,15,6,"#4f8d4c"],[14,1,15,6,"#70ae55"]].forEach(function (leaf) {
      var x = leaf[0], side = leaf[1], p = node(x);
      var tangent = Math.atan(2*bend*x/(22*22));
      var reach = 2.5*scale;
      var tip = [p[0]-Math.sin(tangent)*reach*side,p[1]+Math.cos(tangent)*reach*side];
      curvedStem([p,[(p[0]+tip[0])/2-scale*.45,(p[1]+tip[1])/2],tip],.65*scale,.28*scale,"#4a7146","#85a863");
      roseBlade(tip[0],tip[1],tangent+side*(x===6 ? 1.08 : .78),leaf[2]*scale,leaf[3]*scale,leaf[4],spotStyle);
    });
    var tip = node(22);
    roseBlade(tip[0],tip[1],Math.atan(2*bend/22),17*scale,6.5*scale,"#609c4b",spotStyle);
    ctx.restore();
  }

  // Tapered canes pass THROUGH their leaf nodes instead of connecting them with
  // rigid straight rods. The same ribbon is used at room and inspection scales.
  function curvedStem(nodes, baseWidth, tipWidth, dark, light) {
    var points = [];
    for (var i = 0; i < nodes.length - 1; i++) {
      var a = nodes[Math.max(0, i - 1)], b = nodes[i];
      var c = nodes[i + 1], d = nodes[Math.min(nodes.length - 1, i + 2)];
      for (var j = 0; j < 8; j++) {
        var t = j / 8, t2 = t * t, t3 = t2 * t;
        points.push([0, 1].map(function (axis) {
          return .5 * ((2 * b[axis]) + (-a[axis] + c[axis]) * t +
            (2*a[axis] - 5*b[axis] + 4*c[axis] - d[axis]) * t2 +
            (-a[axis] + 3*b[axis] - 3*c[axis] + d[axis]) * t3);
        }));
      }
    }
    points.push(nodes[nodes.length - 1]);
    var left = [], right = [], litLeft = [], litRight = [];
    points.forEach(function (p, i) {
      var before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)];
      var dx = after[0] - before[0], dy = after[1] - before[1];
      var length = Math.sqrt(dx*dx + dy*dy) || 1;
      var nx = -dy / length, ny = dx / length;
      var width = baseWidth + (tipWidth - baseWidth) * i / (points.length - 1);
      left.push([p[0] + nx*width*.5, p[1] + ny*width*.5]);
      right.push([p[0] - nx*width*.5, p[1] - ny*width*.5]);
      litLeft.push([p[0] + nx*width*.27, p[1] + ny*width*.27]);
      litRight.push([p[0] - nx*width*.06, p[1] - ny*width*.06]);
    });
    polygon(left.concat(right.reverse()), dark || "#355a3b");
    polygon(litLeft.concat(litRight.reverse()), light || "#86a65b");
  }

  function roseBloom(cx, cy, scale, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle || 0);
    ctx.scale(scale || 1, scale || 1);
    // A cupped rose seen at three-quarter angle: irregular outer reflexed
    // petals surround overlapping inward curls, not a circular spiral icon.
    polygon([[-4,7],[-7,4],[-6,9],[-1,11],[4,9],[7,4],[2,7]],"#426440");
    polygon([[-10,-2],[-9,-6],[-5,-8],[-1,-10],[4,-9],[6,-7],[10,-6],[12,-2],[10,3],[7,7],[2,9],[-4,8],[-8,5],[-11,1]],"#853748");
    polygon([[-9,-3],[-8,-6],[-4,-8],[0,-9],[4,-8],[5,-5],[1,-3],[-4,-3],[-6,1]],"#d96970");
    polygon([[-10,-1],[-6,-3],[-4,0],[-3,5],[1,7],[-4,7],[-8,4]],"#c95865");
    polygon([[5,-6],[9,-5],[11,-2],[9,2],[6,4],[2,3],[5,0]],"#d9616a");
    polygon([[-7,-5],[-4,-7],[0,-8],[3,-7],[0,-6],[-4,-5],[-5,-3]],"#f4a194");
    polygon([[-5,-2],[-3,-5],[1,-6],[5,-4],[6,-1],[3,3],[-1,4],[-4,2]],"#a94356");
    polygon([[-4,-2],[-2,-5],[1,-5],[4,-3],[4,0],[1,-1],[0,-3],[-2,-2]],"#ed8c85");
    polygon([[-2,0],[0,-3],[3,-2],[3,1],[1,3],[-1,2]],"#c65c68");
    polygon([[0,-2],[2,-1],[1,1],[-1,1]],"#91384e");
    polygon([[-5,2],[-2,4],[2,4],[6,2],[8,0],[8,4],[5,7],[1,8],[-3,6]],"#e7837e");
    polygon([[-4,2],[-1,3],[3,3],[6,1],[5,3],[2,5],[-1,5]],"#f2a395");
    polygon([[-9,0],[-7,2],[-5,3],[-4,5],[-7,4]],"#ee9289");
    line(7,-4,9,-2,.8,"#f0a08f");
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
    var spot = visual && visual.spots ? { color: visual.spotColor, color2: visual.spotColor2 } : null;
    // Keep all 18 compound leaves (90 leaflets), but separate their depth.
    // Inner leaves sit BEHIND the canes; adding density must not bury the
    // approved branch silhouette or introduce straight, equally thick rails.
    roseCompoundLeaf(187,118,-2.3,.70,null,5);
    roseCompoundLeaf(190,107,-.45,.73,spot,-4);
    roseCompoundLeaf(200,102,2.05,.67,null,4);
    roseCompoundLeaf(208,119,-1.28,.74,null,-5);
    roseCompoundLeaf(216,108,.18,.70,null,6);
    roseCompoundLeaf(196,89,-.82,.57,null,-4);
    roseCompoundLeaf(197,129,-1.94,.67,spot,5);
    roseCompoundLeaf(198,134,-.6,.61,null,4);

    // Unchanged woody architecture, now readable in front of the rear foliage.
    curvedStem([[198,134],[195,119],[200,102],[196,89],[194,79]],3.4,1.1);
    curvedStem([[197,129],[187,118],[179,108],[175,94],[168,85]],2.9,.9);
    curvedStem([[199,132],[208,119],[216,108],[220,94],[230,85]],3.1,.9);
    curvedStem([[195,119],[190,107],[187,94],[188,86]],2.1,.6);
    curvedStem([[208,119],[219,120],[230,111],[236,103]],2,.6);
    curvedStem([[168,85],[167,80],[163,76]],1.3,.65);
    polygon([[195,119],[191,115],[194,115]],"#597143");
    polygon([[215,109],[220,107],[217,112]],"#597143");
    polygon([[178,105],[174,102],[176,107]],"#597143");

    // Outer leaves face away from the cane paths rather than forming crossbars.
    roseCompoundLeaf(179,108,3.18,.67,null,-5);
    roseCompoundLeaf(175,94,3.88,.63,null,4);
    roseCompoundLeaf(196,89,3.37,.63,null,-3);
    roseCompoundLeaf(200,102,-.79,.65,null,4);
    roseCompoundLeaf(219,120,.30,.84,null,-5);
    roseCompoundLeaf(230,111,-.49,.61,null,5);
    roseCompoundLeaf(187,94,3.38,.78,spot,-4);
    roseCompoundLeaf(220,94,-.48,.76,spot,-4);
    roseCompoundLeaf(195,119,2.7,.85,spot,5);
    roseCompoundLeaf(198,130,2.48,.57,spot,-4);
    roseBloom(193,71,1.08,-.18);
    roseBloom(232,80,.76,.24);
    roseBud(161,70,-.35);
    ctx.save();
    ctx.translate(188, 128);
    ctx.rotate(-.25);
    polygon([[-8, 0], [-4, -5], [4, -4], [9, 0], [4, 5], [-4, 4]], "#5c3e28");
    polygon([[-7, 0], [-3, -4], [4, -3], [8, 0], [3, 4], [-4, 3]], "#c28a35");
    rustSpecks([[-3,-2],[1,1],[4,-1]], visual.spotColor, visual.spotColor2);
    ctx.restore();
    drawPot();
  }

  // One-logical-pixel grains stay fine when leaf geometry gets larger.
  function powderPatch(x, y, rx, ry, seed) {
    for (var py = -Math.ceil(ry); py <= ry; py++) {
      for (var px = -Math.ceil(rx); px <= rx; px++) {
        var d = px*px/(rx*rx) + py*py/(ry*ry);
        var grain = ((px+41)*17 + (py+53)*29 + seed*13) % 19;
        if (d < .65 || (d < 1.15 && grain < 7)) {
          rect(x+px,y+py,1,1,grain < 6 ? "#fff9e8" : grain < 13 ? "#e8e3cd" : "#bbc3a1");
        }
      }
    }
  }

  function squashLeaf(cx, cy, rx, ry, angle, powderStyle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    var outline = [
      [-rx,0],[-rx*.86,-ry*.2],[-rx*.57,-ry*.24],[-rx*.77,-ry*.68],
      [-rx*.55,-ry*.8],[-rx*.29,-ry*.49],[-rx*.2,-ry*.84],[0,-ry],
      [rx*.18,-ry*.82],[rx*.3,-ry*.46],[rx*.57,-ry*.82],[rx*.8,-ry*.64],
      [rx*.58,-ry*.23],[rx*.88,-ry*.18],[rx,0],[rx*.82,ry*.3],
      [rx*.52,ry*.3],[rx*.62,ry*.64],[rx*.36,ry*.82],[rx*.11,ry*.69],
      [0,ry*.94],[-rx*.13,ry*.66],[-rx*.37,ry*.82],[-rx*.64,ry*.61],
      [-rx*.51,ry*.3],[-rx*.82,ry*.28]
    ];
    polygon(outline, "#294d35");
    polygon(outline.map(function (p) { return [p[0]*.92,p[1]*.89]; }), "#57964b");
    polygon([[0,ry*.6],[-rx*.57,-ry*.56],[-rx*.26,-ry*.38],[0,-ry*.88]],"#6fa552");
    polygon([[0,ry*.6],[rx*.68,-ry*.51],[rx*.42,-ry*.09],[rx*.62,ry*.49]],"#447e42");
    var vein = Math.max(.7,rx*.036);
    line(0,ry*.78,0,-ry*.85,vein,"#b7d486");
    [-1,1].forEach(function (side) {
      line(0,ry*.45,side*rx*.61,-ry*.61,vein*.65,"#a7c978");
      line(0,ry*.45,side*rx*.86,0,vein*.6,"#9fc173");
      line(0,ry*.45,side*rx*.4,ry*.65,vein*.6,"#9fc173");
      for (var v = 1; v < 4; v++) {
        line(side*rx*v*.12,ry*(.45-v*.18),side*rx*(v*.12+.18),ry*(.37-v*.18),vein*.35,"#79a85d");
      }
    });
    if (powderStyle) {
      [[-.32,-.29,.2,.19],[.06,-.44,.23,.18],[.37,-.01,.19,.21],[-.1,.29,.2,.17]].forEach(function (p, i) {
        powderPatch(p[0]*rx,p[1]*ry,p[2]*rx,p[3]*ry,i);
      });
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
    // Petioles emerge from different crown nodes, rise, then bow under broad
    // leaves. Keep blade positions/shapes, but remove the rigid umbrella ribs.
    var petioles = [
      [[199,133],[203,120],[210,105],[206,92]],
      [[203,132],[213,120],[226,114],[236,112]],
      [[197,134],[185,125],[179,114],[168,110]],
      [[198,131],[190,118],[187,96],[186,76]],
      [[201,131],[208,113],[215,88],[222,70]],
      [[195,133],[183,117],[166,98],[151,88]],
      [[204,132],[219,110],[237,93],[250,84]],
      [[195,133],[184,122],[169,122],[159,126]],
      [[204,133],[216,125],[232,125],[244,130]],
      [[197,131],[187,113],[181,98],[174,91]],
      [[201,132],[213,117],[223,100],[229,92]]
    ];
    petioles.forEach(function (nodes, i) {
      curvedStem(nodes, i < 5 ? 3.1 : 2.3, 1.1, "#315d3b", "#83ad5f");
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
    ctx.scale(scale,scale);
    polygon([[0,0],[3,-4],[7,-7],[13,-9],[19,-8],[24,-5],[29,0],[25,3],[21,6],[14,8],[8,7],[3,4]],"#274b32");
    polygon([[1,0],[5,-4],[9,-6],[14,-7],[20,-6],[25,-3],[27,0],[22,4],[15,6],[8,5],[4,2]],underside ? "#82926a" : "#53984c");
    polygon([[2,0],[7,-5],[14,-7],[20,-6],[25,-3],[18,-3],[12,-4],[7,-2]],underside ? "#9ca57a" : "#8bb969");
    polygon([[3,1],[9,5],[15,6],[22,4],[27,0],[24,4],[20,6],[14,7],[7,5]],underside ? "#637b54" : "#326d3d");
    if (diseased) {
      polygon([[7,-.7],[11,-4.7],[15,-5.5],[12,-.8]],underside ? "#728060" : "#c5bf69");
      polygon([[12.8,-.7],[16.2,-5.4],[20,-4],[17.5,-.7]],underside ? "#758461" : "#bab360");
      polygon([[13.2,.8],[17,4.8],[21,3.5],[18,.8]],underside ? "#6c7b59" : "#a9a252");
    }
    line(1,0,26,0,.55,underside ? "#c1c59a" : "#b9d28a");
    for (var i = 6; i < 23; i += 5) {
      var reach = i > 18 ? 2.7 : 5;
      line(i,0,i+4,-reach,.3,underside ? "#b0b98d" : "#87b568");
      line(i,0,i+4,reach*.85,.3,underside ? "#b0b98d" : "#87b568");
    }
    // Only the flipped, separately composed specimen may show this sign.
    if (diseased && underside && mode === "specimen") {
      for (var f = 0; f < 62; f++) {
        var vx = 7+(f%16)*.9;
        var vy = (f%2 ? -1 : 1)*(1+((f*7)%23)/7);
        line(vx,vy,vx+.25,vy-.55,.18,f%3 ? "#817585" : "#b0a1af");
        line(vx,vy,vx-.3,vy-.2,.2,"#66596f");
      }
    }
    ctx.restore();
  }

  function drawBasilPlant(visual) {
    // Basil stays upright, with short, subtly offset internodes and opposite
    // leaf pairs. It should not inherit the rose's spreading woody-cane habit.
    curvedStem([[198,134],[198,122],[196,108],[198,91],[196,79],[198,68]],3.2,.85,"#315d3b","#7eab61");
    curvedStem([[197,116],[187,109],[181,98],[178,86],[174,77]],2.35,.7);
    curvedStem([[196,108],[208,105],[216,96],[221,82],[228,74]],2.15,.7);
    curvedStem([[198,122],[187,118],[177,118]],1.7,.6);
    curvedStem([[198,122],[210,116],[222,119]],1.8,.6);
    curvedStem([[198,91],[190,86],[184,79]],1.5,.5);
    curvedStem([[198,91],[206,88],[212,78]],1.45,.5);
    curvedStem([[196,108],[198,107],[200,108]],1,.6);
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
    // The shaded leaf is not a revealed underside: inspection owns that sign.
    polygon([[233,88],[237,85],[243,88],[239,92],[235,92]],"#9f9c58");
    // Follow the older leaf's lower edge rather than floating a square beside it.
    ctx.save();
    ctx.translate(228,74);
    ctx.rotate(.1);
    ctx.scale(.68,.68);
    polygon([[8,5],[14,6],[21,4],[27,0],[25,3],[21,6],[14,8],[8,7]],"#70533b");
    line(14,7,21,5,.7,"#b09159");
    ctx.restore();
    rect(194, 116, 5, 4, "#405f36");
    rect(191, 119, 4, 3, "#6d8744");
    drawPot();
  }

  function septoriaLesions(points, color, center) {
    points.forEach(function (p, i) {
      var x=p[0], y=p[1];
      // Small lesions belong inside a leaflet; the dedicated plate carries the fine detail.
      polygon([[x-.6,y-1.2],[x+.6,y-1.2],[x+1.2,y-.6],[x+1.2,y+.6],[x+.6,y+1.2],[x-.6,y+1.2],[x-1.2,y+.6],[x-1.2,y-.6]],"#544031");
      rect(x-.6,y-.6,1.2,1.2,center || "#c6ad75");
      if ((mode === "zoom" || mode === "specimen") && i%2 === 0) rect(x,y,.5,.5,"#29271f");
    });
  }

  function tomatoLeaflet(cx, cy, w, h, angle, yellow) {
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(angle);
    var edge = [[0,0],[.12,-.23],[.21,-.16],[.25,-.52],[.36,-.37],[.41,-.68],
      [.5,-.43],[.59,-.59],[.65,-.33],[.77,-.38],[.8,-.18],[1,0],
      [.83,.14],[.77,.33],[.66,.26],[.6,.52],[.51,.38],[.42,.62],
      [.34,.34],[.24,.43],[.2,.17],[.11,.23]];
    polygon(edge.map(function (p) { return [p[0]*w,p[1]*h]; }),"#32553a");
    polygon(edge.map(function (p) { return [p[0]*w*.97,p[1]*h*.83]; }),yellow ? "#aaa55b" : "#569548");
    polygon([[w*.07,0],[w*.28,-h*.32],[w*.45,-h*.44],[w*.78,0]],yellow ? "#c9bc69" : "#7bac58");
    var vein = Math.max(.4,w*.018);
    line(0,0,w*.91,0,vein,yellow ? "#d5c781" : "#b2c97a");
    for (var v=.2;v<.8;v+=.17) {
      line(w*v,0,w*(v+.1),-h*Math.sin(v*Math.PI)*.37,vein*.5,"#94b56b");
      line(w*v,0,w*(v+.1),h*Math.sin(v*Math.PI)*.34,vein*.5,"#426e40");
    }
    ctx.restore();
  }

  function patiotomatoLeaf(cx, cy, angle, scale, diseased, visual) {
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(angle);
    var s=scale;
    line(0,0,18*s,0,1.2,"#386840");
    tomatoLeaflet(4*s,0,11*s,7*s,-.95,diseased);
    tomatoLeaflet(5*s,0,11*s,7*s,.95,diseased);
    tomatoLeaflet(11*s,0,11*s,7*s,-.72,diseased);
    tomatoLeaflet(11*s,0,11*s,7*s,.72,diseased);
    tomatoLeaflet(17*s,0,10*s,6*s,0,diseased);
    if (diseased) {
      septoriaLesions([[9*s,-4*s],[10*s,4*s],[17*s,-4*s],[22*s,0]],visual.lesionColor,visual.centerColor);
    }
    ctx.restore();
  }

  function patiotomatoFruit(cx, cy, r, ripe) {
    ctx.save();
    ctx.translate(cx,cy);
    var rim=[[-.85,-.42],[-.5,-.83],[-.15,-.94],[.14,-.86],[.48,-.87],[.83,-.51],[1,-.08],[.9,.48],[.54,.83],[.08,.96],[-.45,.82],[-.84,.46],[-1,0]];
    polygon(rim.map(function (p) { return [p[0]*r,p[1]*r]; }),ripe ? "#963a32" : "#3f6540");
    polygon(rim.map(function (p) { return [p[0]*r*.9-.04*r,p[1]*r*.87]; }),ripe ? "#d65a43" : "#7aa855");
    polygon([[-r*.74,-r*.25],[-r*.46,-r*.66],[-r*.12,-r*.72],[r*.27,-r*.56],[r*.49,-r*.1],[r*.23,r*.37],[-r*.4,r*.33]],ripe ? "#e97451" : "#97bc6a");
    line(-r*.38,-r*.44,-r*.13,-r*.53,Math.max(.6,r*.09),ripe ? "#f5ad74" : "#c0d391");
    line(0,-r*.77,-r*.12,-r*1.4,Math.max(1,r*.15),"#496b40");
    polygon([[0,-r*.82],[-r*.57,-r*.98],[-r*.3,-r*.67],[-r*.54,-r*.42],[-r*.08,-r*.6],[r*.22,-r*.38],[r*.2,-r*.72],[r*.61,-r*.73],[r*.24,-r*.94]],"#3b603a");
    line(-r*.29,-r*.84,0,-r*.75,Math.max(.5,r*.06),"#8fba65");
    ctx.restore();
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
    // Soft tomato stems change direction at nodes. Lower branches sag slightly;
    // young tips turn upward, and fruit trusses join above the hanging fruit.
    curvedStem([[199,134],[200,121],[197,109],[200,101],[196,90],[200,82],[204,73],[199,64]],4,.9,"#386840","#7aad59");
    var branches = [
      [[197,109],[184,113],[170,108],[168,99],[160,98]],
      [[200,121],[189,124],[178,121],[165,114],[151,111]],
      [[197,109],[211,113],[228,104],[233,96],[246,98]],
      [[211,113],[221,120],[235,118],[247,110]],
      [[200,101],[190,93],[180,86],[174,86],[168,82]],
      [[200,101],[213,93],[223,82],[226,84],[234,84]],
      [[200,82],[192,78],[192,72],[183,73]],
      [[204,73],[217,71],[231,71],[242,66]],
      [[204,73],[209,70],[212,73],[215,78]],
      [[196,90],[194,89],[193,91]],
      [[200,82],[206,85],[207,89]]
    ];
    branches.forEach(function (nodes, i) { curvedStem(nodes, i < 6 ? 2.25 : 1.6, .6, "#386840", "#83ad62"); });
    curvedStem([[200,82],[208,72],[219.3,75.6]],1.45,.6);
    curvedStem([[192,72],[187,73],[183.4,76]],1.25,.6);
    curvedStem([[242,66],[243,70],[240,72]],1.1,.5);
    curvedStem([[200,101],[204,100],[207,104]],1.2,.5);
    // Fill the crown between branch tips instead of implying widespread leaf
    // loss. Old lower foliage stays spotted; the upper crown is mostly green.
    patiotomatoLeaf(184,113,-1.2,.82,true,visual);
    patiotomatoLeaf(189,124,-1.18,.78,true,visual);
    patiotomatoLeaf(200,121,-.7,.82,true,visual);
    patiotomatoLeaf(197,109,-2.15,.82,false,visual);
    patiotomatoLeaf(213,93,.65,.75,false,visual);
    patiotomatoLeaf(196,90,3.05,.80,false,visual);
    patiotomatoLeaf(200,82,2.3,.72,false,visual);
    patiotomatoLeaf(204,73,-1.3,.50,false,visual);
    patiotomatoLeaf(211,113,-.7,.78,false,visual);
    patiotomatoLeaf(231,71,1.65,.65,false,visual);
    patiotomatoLeaf(221,120,2.3,.70,true,visual);
    patiotomatoLeaf(190,93,3.6,.70,false,visual);
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
    patiotomatoFruit(220,84,6,false);
    patiotomatoFruit(184,83,5,false);
    patiotomatoFruit(209,79,5,true);
    patiotomatoFlower(240,72);
    patiotomatoFlower(207,104);
    rect(185,130,30,3,"#493526");
    rect(188,128,5,2,"#8e6237");
    rect(205,129,4,2,"#725134");
    drawPot();
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
      return;
    }
    if (visual.sprite === "squash") {
      drawSquashPlant(visual);
      if (timeCrunch) drawSevereSymptoms(visual);
      return;
    }
    if (visual.sprite === "basil") {
      drawBasilPlant(visual);
      if (timeCrunch) drawSevereSymptoms(visual);
      return;
    }
    if (visual.sprite === "tomato") {
      drawTomatoPlant(visual);
      if (timeCrunch) drawSevereSymptoms(visual);
      return;
    }
  }

  function highlight(hx, hy, r) {
    // One neutral attention cue per uninspected area: just the white ring.
    ctx.strokeStyle = "#ffffff";
    ctx.globalAlpha = reducedMotion ? 0.8 : 0.55 + Math.sin(Date.now() / 200) * 0.25;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.stroke();
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
      else {
        // A quiet amber record symbol means examined, never healthy/resolved.
        // Keep the symptom visible underneath; no white badge or green "OK".
        var r = mode === "zoom" ? 5 : 3.7;
        ctx.save();
        ctx.strokeStyle = "#ddbd7e";
        ctx.lineWidth = .8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
        line(p.x-r*.4,p.y-r*.28,p.x+r*.4,p.y-r*.28,.8,"#ddbd7e");
        line(p.x-r*.4,p.y+r*.28,p.x+r*.2,p.y+r*.28,.8,"#ddbd7e");
        ctx.restore();
      }
      if (hoverId === h.id) {
        var fontSize = mode === "zoom" ? 8 : 6;
        var label = (seen ? "INSPECTED: " : "") + h.name.toUpperCase();
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

  // Inspection plates are composed at 240x160, never crops of the game scene.
  // Tiny grains use plate pixels; botanical geometry and veins scale together.
  function pixelOval(x, y, rx, ry, color) {
    for (var row=-Math.floor(ry);row<=ry;row++) {
      var half=Math.round(rx*Math.sqrt(Math.max(0,1-row*row/(ry*ry))));
      if (half) rect(x-half,y+row,half*2,1,color);
    }
  }

  function specimenFrame() {
    rect(0,0,240,160,"#424b36");
    rect(4,4,232,152,"#89906a");
    rect(6,6,228,148,"#293e31");
    rect(10,10,220,140,"#c7b98a");
    rect(13,13,214,134,"#e4d7ae");
    rect(16,16,208,128,"#ecdfb9");
    // Quiet paper grain and corner brackets, not a diagnostic diagram or label.
    for (var i=0;i<95;i++) {
      rect(20+(i*47)%199,20+(i*31)%120,i%5 ? 1 : 2,1,i%3 ? "#e3d5ad" : "#f3e8c9");
    }
    [[18,18,1,1],[222,18,-1,1],[18,141,1,-1],[222,141,-1,-1]].forEach(function (p) {
      line(p[0],p[1],p[0]+8*p[2],p[1],1,"#9e9b70");
      line(p[0],p[1],p[0],p[1]+8*p[3],1,"#9e9b70");
    });
    for (var tick=0;tick<15;tick++) rect(85+tick*5,151,1,tick%5 ? 2 : 4,"#c4c29a");
    [[5,5],[232,5],[5,152],[232,152]].forEach(function (p) { rect(p[0],p[1],2,2,"#ddd2a3"); });
  }

  function specimenStem(x0,y0,x1,y1,width) {
    line(x0,y0,x1,y1,width,"#35583c");
    line(x0-width*.13,y0,x1-width*.13,y1,width*.56,"#6e9251");
    line(x0-width*.23,y0,x1-width*.23,y1,Math.max(1,width*.12),"#a3b776");
  }

  function rosePlateLeaf(x,y,angle,length,width,surface) {
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    line(-15,0,3,0,3,"#617a45");
    roseBlade(0,0,0,length,width,surface === "under" ? "#78925c" : surface === "litter" ? "#b99a4b" : surface === "hidden" ? "#748552" : "#639b50",null);
    var spots=[[.22,-.21],[.29,.39],[.37,-.49],[.46,.25],[.52,-.33],[.59,.5],[.67,-.37],[.75,.25],[.82,-.13]];
    if (surface === "top") {
      spots.forEach(function (p,i) {
        var sx=p[0]*length, sy=p[1]*width;
        pixelOval(sx,sy,3+i%2,2+i%2,"#c9bd54");
        rect(sx-1,sy,2,1,"#daa348");
      });
    } else if (surface === "under" || surface === "litter") {
      spots.forEach(function (p,i) {
        var sx=p[0]*length, sy=p[1]*width;
        pixelOval(sx+1,sy+2,3,2,"#667043");
        pixelOval(sx,sy,3,2,"#914c25");
        rect(sx-2,sy-1,4,2,"#c7752b");
        rect(sx-1,sy-2,2,1,"#e5a24b");
        rect(sx+3,sy+1,1,1,"#b47134");
        if (i%2) rect(sx-4,sy-1,1,1,"#c88a3a");
      });
      line(2,1,length*.9,1,1,"#c1ca92");
    } else if (surface === "hidden") {
      for (var d=0;d<33;d++) {
        var dx=length*(.2+(d%11)*.052), dy=((d*13)%17-8)*width*.06;
        rect(dx,dy,1,1,d%2 ? "#a0a27b" : "#62724c");
      }
    }
    ctx.restore();
  }

  function tomatoPlateLeaf(x,y,angle,length,height,diseased,yellow) {
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    line(-10,0,2,0,2,"#69864d");
    tomatoLeaflet(0,0,length,height,0,yellow);
    if (diseased) {
      [[.24,-.12],[.3,.22],[.38,-.33],[.46,.25],[.51,-.17],[.59,.32],[.65,-.21],[.72,.13],[.81,-.04]].forEach(function (p,i) {
        var sx=p[0]*length, sy=p[1]*height;
        var radius=Math.max(2,Math.min(4,length*.022))+i%2;
        pixelOval(sx,sy,radius,radius,"#504333");
        pixelOval(sx,sy,radius-1,radius-1,"#c8c0a0");
        if (i%3 !== 1) rect(sx,sy,1,1,"#272821");
        if (i%3 === 0 && length>100) rect(sx-2,sy+1,1,1,"#3c3b2d");
      });
    }
    ctx.restore();
  }

  function soilPlate(splashed) {
    // A surface view: no invented root symptoms, pooled water, or fertilizer.
    polygon([[22,108],[45,98],[86,101],[120,95],[166,100],[206,95],[220,109],[216,133],[22,133]],"#665239");
    polygon([[24,109],[46,102],[87,106],[123,100],[170,105],[203,101],[218,111],[213,130],[26,130]],splashed ? "#987c50" : "#6e5a3c");
    for (var i=0;i<105;i++) {
      var x=28+(i*37)%184, y=108+(i*19)%21;
      rect(x,y,i%4 === 0 ? 3 : 2,1,i%3 === 0 ? "#b19b6d" : i%3 === 1 ? "#493e2c" : "#887146");
    }
    if (splashed) {
      [[35,110,52,113],[52,113,59,122],[74,105,82,113],[82,113,103,116],[133,108,143,115],[143,115,137,126],[172,109,188,113]].forEach(function (p) {
        line(p[0],p[1],p[2],p[3],1,"#6d583b");
      });
    } else {
      // A short terracotta rim frames crumbly, dark moist soil, without a puddle.
      polygon([[21,129],[220,129],[216,138],[26,138]],"#81523b");
      rect(25,130,191,3,"#b77c4c");
      rect(30,133,182,2,"#9e693f");
    }
  }

  function drawRoseInspection(id, flipped) {
    if (id === "leaf_top") {
      pixelOval(125,109,77,15,"#cbbf96");
      rosePlateLeaf(46,100,-.2,151,43,"top");
    } else if (id === "leaf_under") {
      pixelOval(126,111,77,14,"#cbbf96");
      rosePlateLeaf(43,101,-.19,155,43,flipped ? "under" : "hidden");
    } else if (id === "fallen") {
      // A pot-base fragment, not the whole plant; three separate fallen leaflets.
      polygon([[30,27],[84,27],[79,72],[38,72]],"#a66d43");
      rect(35,29,7,37,"#c99158");
      rect(33,72,55,5,"#79503a");
      pixelOval(121,121,86,12,"#cbb98d");
      rosePlateLeaf(69,91,.16,99,26,"litter");
      rosePlateLeaf(108,120,-.53,88,23,"litter");
      rosePlateLeaf(36,116,-.54,76,21,"litter");
      line(151,128,183,131,2,"#87724a");
      rect(189,117,3,2,"#a58b5d");
    } else if (id === "canopy") {
      specimenStem(91,137,115,26,10);
      specimenStem(116,137,104,30,9);
      specimenStem(139,136,126,23,9);
      specimenStem(116,111,61,49,6);
      specimenStem(126,100,185,44,6);
      specimenStem(96,96,167,64,5);
      [[111,58,-1],[129,85,1],[103,117,-1]].forEach(function (p) {
        polygon([[p[0],p[1]],[p[0]+p[2]*9,p[1]-3],[p[0]+p[2]*2,p[1]+5]],"#506640");
      });
      roseCompoundLeaf(101,92,3.35,1.75,null);
      roseCompoundLeaf(125,88,-.24,1.85,null);
      roseCompoundLeaf(117,53,3.48,1.55,null);
      roseCompoundLeaf(123,122,-.35,1.7,null);
    }
  }

  function drawSquashInspection(id) {
    if (id === "powder_upper") {
      pixelOval(121,116,84,14,"#cbbf96");
      specimenStem(119,132,120,101,6);
      squashLeaf(120,77,88,55,-.07,{color:"#efe9d9"});
    } else if (id === "base_check") {
      pixelOval(110,127,74,9,"#cbbf96");
      specimenStem(98,132,80,38,13);
      specimenStem(104,131,143,71,11);
      specimenStem(101,112,52,83,8);
      [[84,62,5,13],[92,99,4,12],[115,109,5,9],[127,91,4,8]].forEach(function (p,i) {
        powderPatch(p[0],p[1],p[2],p[3],i+4);
      });
      // Clean reverse surface with prominent radiating veins, no gray fuzz.
      ctx.save();
      ctx.translate(160,65);
      ctx.rotate(.19);
      squashLeaf(0,0,52,35,0,null);
      polygon([[0,28],[-28,-16],[-14,-9],[0,-30],[13,-9],[31,-17]],"#91a76f");
      line(0,28,0,-28,2,"#c9d09a");
      line(0,18,-33,-17,1.4,"#c9d09a");
      line(0,18,33,-17,1.4,"#c9d09a");
      line(0,18,-42,0,1,"#b7c48b");
      line(0,18,42,0,1,"#b7c48b");
      ctx.restore();
    } else if (id === "spacing") {
      // Tight rims and crossing petioles emphasize space, not added symptoms.
      [[32,113],[92,114],[152,112]].forEach(function (p) {
        polygon([[p[0],p[1]],[p[0]+54,p[1]],[p[0]+48,137],[p[0]+7,137]],"#a5754a");
        rect(p[0]-2,p[1],58,5,"#c09259");
        specimenStem(p[0]+28,p[1],p[0]+24,p[1]-45,6);
      });
      squashLeaf(72,56,51,33,-.25,null);
      squashLeaf(156,52,55,34,.17,null);
      squashLeaf(109,92,65,37,-.12,null);
      squashLeaf(178,95,40,27,.2,null);
    } else if (id === "soil") {
      specimenStem(119,113,116,35,13);
      specimenStem(117,76,78,52,7);
      squashLeaf(70,48,37,25,-.22,null);
      soilPlate(false);
      // Soil sits above the stem foot; only healthy dry aerial tissue is shown.
      rect(114,107,11,5,"#5f7044");
    }
  }

  function drawBasilInspection(id, flipped) {
    if (id === "angular_yellow") {
      pixelOval(124,110,79,14,"#cbbf96");
      specimenStem(30,108,55,101,4);
      basilLeaf(47,99,-.16,5.25,true,false);
    } else if (id === "downy_under") {
      pixelOval(124,111,79,14,"#cbbf96");
      specimenStem(30,108,55,101,4);
      basilLeaf(47,99,-.16,5.25,true,flipped);
      // Before turning, the folded far edge is merely dull and shadowed.
      if (!flipped) {
        polygon([[90,120],[122,123],[149,119],[167,109],[149,115],[121,119]],"#5d7546");
      }
    } else if (id === "curled_margin") {
      pixelOval(124,115,76,13,"#cbbf96");
      specimenStem(30,102,55,96,4);
      basilLeaf(46,95,-.08,5.1,true,false);
      // Rolled lower edge exposes a narrow fold; dead tissue advances inward.
      polygon([[72,113],[91,124],[122,130],[150,124],[177,110],[187,94],[175,100],[162,111],[141,117],[118,121],[93,118]],"#5b4936");
      polygon([[75,113],[93,119],[118,122],[144,118],[167,106],[177,101],[171,113],[148,125],[122,131],[96,126]],"#94734b");
      polygon([[121,122],[141,117],[157,110],[153,119],[139,125],[125,127]],"#b49b65");
      line(94,123,120,127,1,"#c4ab71");
    } else if (id === "dense_canopy") {
      specimenStem(99,139,104,28,9);
      specimenStem(130,138,141,30,8);
      specimenStem(116,137,113,45,7);
      basilLeaf(106,53,3.43,2.7,false,false);
      basilLeaf(115,54,-.3,3.1,false,false);
      basilLeaf(104,82,3.16,2.75,false,false);
      basilLeaf(127,79,-.18,3.05,false,false);
      basilLeaf(114,113,3.39,3.15,false,false);
      basilLeaf(118,112,-.15,3.25,false,false);
      basilLeaf(141,49,-1.17,1.3,false,false);
    }
  }

  function drawTomatoInspection(id) {
    if (id === "septoria_spots") {
      pixelOval(124,112,79,14,"#cbbf96");
      tomatoPlateLeaf(44,98,-.16,158,67,true,false);
    } else if (id === "lower_progression") {
      // A short vertical branch sample compares old and new leaf tiers.
      specimenStem(116,136,124,30,7);
      specimenStem(121,59,99,50,3);
      specimenStem(120,64,142,52,3);
      tomatoPlateLeaf(103,51,3.35,65,34,false,false);
      tomatoPlateLeaf(139,52,-.25,67,32,false,false);
      specimenStem(118,101,95,106,4);
      specimenStem(118,108,142,112,4);
      tomatoPlateLeaf(96,106,3.35,67,37,true,true);
      tomatoPlateLeaf(140,111,-.14,71,39,true,true);
    } else if (id === "soil_splash") {
      specimenStem(119,115,116,27,12);
      specimenStem(117,81,79,68,5);
      tomatoPlateLeaf(82,69,3.38,55,30,false,false);
      soilPlate(true);
      [[116,99],[123,88],[112,80],[118,71],[89,77],[77,69],[62,64],[109,107]].forEach(function (p,i) {
        rect(p[0],p[1],i%2 ? 3 : 4,2,"#92754c");
        rect(p[0]+1,p[1]+2,2,1,"#b49767");
      });
    } else if (id === "clean_fruit") {
      pixelOval(131,120,59,12,"#cbbf96");
      specimenStem(111,27,137,47,6);
      specimenStem(132,43,153,53,4);
      tomatoPlateLeaf(104,43,3.45,68,35,true,false);
      patiotomatoFruit(139,87,39,false);
      patiotomatoFruit(186,65,19,false);
    }
  }

  var inspectionIds = {
    rose: ["leaf_top","leaf_under","fallen","canopy"],
    squash: ["powder_upper","base_check","spacing","soil"],
    basil: ["angular_yellow","downy_under","curled_margin","dense_canopy"],
    tomato: ["septoria_spots","lower_progression","soil_splash","clean_fruit"]
  };

  // Public API: the caller owns sizing, accessible text, and the flip button.
  // Returns false for missing/unsupported inputs; flipped is a per-leaf boolean.
  function drawCloseup(canvas, caseData, hotspot, flipped) {
    if (!canvas || !canvas.getContext || !caseData || !hotspot || !canvas.width || !canvas.height) return false;
    var sprite=caseData.visual && caseData.visual.sprite;
    if (!inspectionIds[sprite] || inspectionIds[sprite].indexOf(hotspot.id) === -1) return false;
    var detailCtx=canvas.getContext("2d");
    if (!detailCtx) return false;
    var previousCtx=ctx, previousMode=mode;
    detailCtx.save();
    try {
      ctx=detailCtx;
      mode="specimen";
      ctx.setTransform(canvas.width/240,0,0,canvas.height/160,0,0);
      ctx.imageSmoothingEnabled=false;
      ctx.globalAlpha=1;
      ctx.globalCompositeOperation="source-over";
      ctx.shadowBlur=0;
      ctx.shadowOffsetX=0;
      ctx.shadowOffsetY=0;
      ctx.lineCap="butt";
      ctx.lineJoin="miter";
      specimenFrame();
      ctx.beginPath();
      ctx.rect(17,17,206,126);
      ctx.clip();
      var turned=flipped === true && !!hotspot.flip;
      if (sprite === "rose") drawRoseInspection(hotspot.id,turned);
      else if (sprite === "squash") drawSquashInspection(hotspot.id);
      else if (sprite === "basil") drawBasilInspection(hotspot.id,turned);
      else if (sprite === "tomato") drawTomatoInspection(hotspot.id);
      return true;
    } finally {
      detailCtx.restore();
      ctx=previousCtx;
      mode=previousMode;
    }
  }

  function drawSpecimen(canvas, caseData, variant) {
    var cxObj = canvas.getContext ? canvas.getContext("2d") : null;
    if (!cxObj || !caseData) return false;
    cxObj.save();
    cxObj.fillStyle = "#f0e8c8";
    cxObj.fillRect(0, 0, 160, 90);
    cxObj.fillStyle = "#3b2a22";
    cxObj.fillRect(2, 2, 156, 86);
    cxObj.fillStyle = "#6e5d3c";
    cxObj.font = "10px monospace";
    cxObj.fillText((variant ? variant + "/" : "") + (caseData.plant ? caseData.plant.toUpperCase() : "PLANT"), 10, 16);
    cxObj.fillStyle = "#47715a";
    cxObj.fillRect(10, 22, 140, 12);
    cxObj.fillStyle = "#416b4b";
    cxObj.fillRect(12, 24, 8, 8);
    cxObj.fillRect(24, 24, 8, 8);
    cxObj.fillRect(36, 25, 6, 7);
    cxObj.fillStyle = "#3b2a22";
    cxObj.font = "9px monospace";
    cxObj.fillText(variant ? variant : "original", 80, 38);
    cxObj.restore();
    return true;
  }

  return {
    draw: draw,
    drawCloseup: drawCloseup,
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
