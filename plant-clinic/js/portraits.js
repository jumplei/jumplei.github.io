// Dialogue portraits share the approved concept's 38 x 42 pixel grid.
// Mrs. Petal is the approved asset, not a repaint of the older case palette.
var PPC = window.PPC || {};
window.PPC = PPC;
PPC.Portraits = (function () {
  "use strict";

  function mix(hex, target, amount) {
    var color = parseInt(hex.slice(1), 16);
    var other = parseInt(target.slice(1), 16);
    var channels = [16, 8, 0].map(function (shift) {
      var value = Math.round(((color >> shift) & 255) * (1 - amount) +
        ((other >> shift) & 255) * amount);
      return ("0" + value.toString(16)).slice(-2);
    });
    return "#" + channels.join("");
  }

  function draw(canvas, portrait) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    // Warm linen softens the authored palettes without erasing each owner.
    var skin = mix(portrait.skin, "#d7b58c", 0.12);
    var shade = mix(skin, "#a87555", 0.18);
    var light = mix(skin, "#edcda3", 0.22);
    var cheek = mix(skin, "#cc947d", 0.28);
    var mouth = mix(skin, "#98665a", 0.38);
    var hair = mix(portrait.hair, "#9a8768", 0.18);
    var hairLight = mix(hair, "#c6a477", 0.24);
    var shirt = mix(portrait.shirt, "#b5ad8a", 0.22);
    var accent = mix(portrait.accent, "#d8ca9b", 0.25);
    var accentShade = mix(accent, "#887b59", 0.27);

    // Inclusive coordinates mirror the approved Pillow portrait block.
    function rect(x1, y1, x2, y2, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
    }

    rect(0, 0, 37, 41, "#a9b78c");
    rect(2, 2, 35, 39, "#c6ce9d");
    rect(7, 27, 32, 41, shirt);
    rect(29, 30, 32, 41, mix(shirt, "#71674f", 0.18));
    // Hair remains behind the crown and temples, never around the jaw.
    rect(10, 6, 29, 20, hair);
    rect(10, 11, 12, 22, hair);
    rect(27, 11, 29, 21, hairLight);
    rect(17, 25, 23, 30, shade);
    rect(17, 28, 21, 30, skin);
    rect(11, 16, 13, 20, shade);
    rect(26, 16, 28, 20, shade);
    // Stepped face silhouette: integer rectangles avoid antialiased pixels.
    rect(14, 10, 24, 11, skin);
    rect(13, 12, 25, 13, skin);
    rect(12, 14, 27, 20, skin);
    rect(13, 21, 26, 22, skin);
    rect(14, 23, 25, 24, skin);
    rect(15, 25, 24, 25, skin);
    rect(16, 26, 23, 26, skin);
    rect(17, 27, 22, 27, skin);
    rect(26, 16, 27, 20, shade);
    rect(17, 25, 23, 26, light);
    rect(10, 10, 13, 15, hair);
    rect(24, 11, 27, 13, hairLight);
    rect(15, 16, 16, 18, "#4d5140");
    rect(22, 16, 23, 18, "#4d5140");
    rect(19, 19, 20, 20, shade);
    rect(14, 20, 16, 21, cheek);
    rect(23, 20, 25, 21, cheek);
    // A tiny warm smile leaves an uninterrupted skin-colored chin.
    rect(18, 23, 21, 23, mouth);
    rect(22, 22, 22, 22, mouth);

    if (portrait.accessory === "hat") {
      rect(11, 5, 27, 10, accent);
      rect(13, 4, 25, 5, accent);
      rect(12, 6, 14, 8, mix(accent, "#ead9ac", 0.35));
      rect(11, 9, 27, 10, accentShade);
      rect(6, 11, 32, 12, accent);
      rect(7, 13, 31, 13, accentShade);
      rect(13, 31, 15, 41, "#d8ca9b");
      rect(25, 31, 27, 41, "#d8ca9b");
      rect(13, 36, 27, 41, "#b9ad85");
    } else if (portrait.accessory === "chef") {
      rect(10, 5, 29, 10, accent);
      rect(12, 3, 17, 9, accent);
      rect(17, 2, 23, 9, accent);
      rect(23, 3, 27, 9, accent);
      rect(11, 6, 13, 8, mix(accent, "#fff5db", 0.30));
      rect(25, 5, 28, 10, mix(accent, "#b7b799", 0.25));
      rect(12, 10, 27, 13, accent);
      rect(12, 13, 27, 13, mix(accent, "#b7b799", 0.28));
      rect(13, 32, 28, 41, accent);
      rect(13, 30, 15, 32, accent);
      rect(26, 30, 28, 32, accent);
      rect(20, 35, 20, 35, shirt);
      rect(20, 39, 20, 39, shirt);
    } else if (portrait.accessory === "cap") {
      rect(12, 6, 26, 7, accent);
      rect(10, 8, 28, 12, accent);
      rect(11, 8, 14, 10, mix(accent, "#d8ca9b", 0.27));
      rect(25, 8, 28, 12, accentShade);
      rect(17, 12, 32, 13, accentShade);
      rect(17, 9, 20, 10, "#d8ca9b");
      rect(14, 30, 17, 32, mix(shirt, "#ead9ac", 0.30));
      rect(23, 30, 26, 32, mix(shirt, "#ead9ac", 0.30));
      rect(20, 33, 20, 41, mix(shirt, "#71674f", 0.18));
      rect(23, 36, 27, 36, accent);
    }
  }

  // Returns a fresh, labelled <img> (Petal) or <canvas> for direct DOM insertion.
  function create(caseData) {
    var data = caseData || {};
    var isPetal = data.customer === "Mrs. Petal" || data.id === "rose_rust";
    var element = document.createElement(isPetal ? "img" : "canvas");
    var label = "Portrait of " + (data.customer || "plant owner");
    element.className = "owner-portrait";
    element.width = 38;
    element.height = 42;
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", label);
    // CSS may size the card; contain never distorts the original artwork.
    element.style.objectFit = "contain";
    element.style.imageRendering = "pixelated";
    element.style.aspectRatio = "38 / 42";
    if (isPetal) {
      element.alt = label;
      element.src = "assets/owner-petal.png";
    } else {
      element.textContent = label;
      draw(element, Object.assign({
        skin: "#c98f5e", hair: "#5b3b2d", shirt: "#47715a",
        accent: "#d9a94e", accessory: "hat"
      }, data.portrait));
    }
    return element;
  }

  return { create: create };
})();
