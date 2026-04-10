const shell = document.getElementById("siteShell");
let shapes = [];
const panels = document.querySelectorAll(".parallax-panel");

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

const decorPalette = ["#ff2452", "#29ff3f", "#fff200", "#00e5ff", "#ff00a8", "#ff8a00"];
const homeGridPalette = ["#f4d9e2", "#d9ece0", "#f4e1b4", "#d8edf2"];
const aboutGridPalette = ["#12efd4", "#31ff00", "#dcff00"];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pickRandomColors(count, palette = decorPalette) {
  const shuffled = [...palette].sort(() => Math.random() - 0.5);
  const colors = [];

  for (let index = 0; index < count; index += 1) {
    colors.push(shuffled[index % shuffled.length]);
  }

  return colors;
}

function resolveGridBlock(config) {
  const colSpan = clamp(randomInt(config.colSpanRange[0], config.colSpanRange[1]), 1, config.cols);
  const rowSpan = clamp(randomInt(config.rowSpanRange[0], config.rowSpanRange[1]), 1, config.rows);
  const maxColStart = Math.max(0, config.cols - colSpan);
  const maxRowStart = Math.max(0, config.rows - rowSpan);
  const colStart = clamp(randomInt(config.colRange[0], config.colRange[1]), 0, maxColStart);
  const rowStart = clamp(randomInt(config.rowRange[0], config.rowRange[1]), 0, maxRowStart);

  return {
    x: colStart * config.cellSize,
    y: rowStart * config.cellSize,
    width: colSpan * config.cellSize,
    height: rowSpan * config.cellSize,
    color: config.color,
    depth: config.depth || randomInt(9, 18),
  };
}

function ensureMosaicLayer() {
  if (!shell) {
    return null;
  }

  let mosaicLayer = shell.querySelector(".bg-mosaic");

  if (!mosaicLayer) {
    mosaicLayer = document.createElement("div");
    mosaicLayer.className = "bg-mosaic";
    mosaicLayer.setAttribute("aria-hidden", "true");
    shell.insertBefore(mosaicLayer, shell.firstChild);
  }

  return mosaicLayer;
}

function renderMosaicTiles(tiles) {
  const mosaicLayer = ensureMosaicLayer();

  if (!mosaicLayer) {
    return;
  }

  mosaicLayer.replaceChildren();

  const fragment = document.createDocumentFragment();

  tiles.forEach((tile, index) => {
    const tileElement = document.createElement("div");
    tileElement.className = "bg-tile";
    tileElement.style.left = `${tile.x}px`;
    tileElement.style.top = `${tile.y}px`;
    tileElement.style.width = `${tile.width}px`;
    tileElement.style.height = `${tile.height}px`;
    tileElement.style.background = tile.color;
    tileElement.dataset.depth = String(tile.depth || 12);
    tileElement.dataset.baseTransform = "";
    tileElement.dataset.baseLeft = `${tile.x}`;
    tileElement.dataset.baseTop = `${tile.y}`;
    tileElement.dataset.shapeWidth = `${tile.width}`;
    tileElement.dataset.shapeHeight = `${tile.height}`;
    tileElement.dataset.loopAxis = tile.loopAxis || "y";
    tileElement.dataset.loopRange = `${tile.loopRange || shell.clientHeight + tile.height + 120}`;
    tileElement.dataset.loopPhase = `${typeof tile.loopPhase === "number" ? tile.loopPhase.toFixed(1) : tile.height}`;
    tileElement.dataset.loopSpeed = `${typeof tile.loopSpeed === "number" ? tile.loopSpeed.toFixed(3) : randomBetween(1.2, 3.1).toFixed(3)}`;
    tileElement.style.opacity = typeof tile.opacity === "number" ? String(tile.opacity) : "0.96";
    tileElement.style.zIndex = String(tile.zIndex || 0);
    tileElement.style.setProperty("--tile-order", String(index));
    fragment.appendChild(tileElement);
  });

  mosaicLayer.appendChild(fragment);
}

function refreshParallaxShapes() {
  shapes = Array.from(document.querySelectorAll(".bg-block, .bg-line-right, .about-floating, .bg-tile"));
}

function buildBalancedPixelField(shellRect, palette, options = {}) {
  const cellSize = Math.round(
    clamp(
      Math.min(shellRect.width, shellRect.height) / (options.divisor || 10.5),
      options.minCell || 62,
      options.maxCell || 96,
    ),
  );
  const cols = Math.max(8, Math.ceil(shellRect.width / cellSize) + 1);
  const rows = Math.max(8, Math.ceil(shellRect.height / cellSize) + 2);
  const rowShiftSeed = randomInt(0, palette.length - 1);
  const rowFlipSeed = randomInt(0, 1);
  const tiles = [];

  for (let row = 0; row < rows; row += 1) {
    const rowOffset = (rowShiftSeed + row * 2) % palette.length;
    const reverseRow = (row + rowFlipSeed) % 2 === 1;

    for (let col = 0; col < cols; col += 1) {
      const colorIndex = reverseRow
        ? (palette.length - 1 - ((col + rowOffset) % palette.length) + palette.length) % palette.length
        : (col + rowOffset) % palette.length;

      tiles.push({
        x: col * cellSize,
        y: (row - 1) * cellSize,
        width: cellSize,
        height: cellSize,
        color: palette[colorIndex],
        depth: 12 + ((row + col) % 3) * 2,
        loopAxis: "y",
        loopRange: rows * cellSize,
        loopPhase: cellSize,
        loopSpeed: options.scrollSpeed || 10,
        opacity: options.opacity || 0.96,
      });
    }
  }

  return {
    baseColor: palette[rowShiftSeed % palette.length],
    cellSize,
    accent: palette[(rowShiftSeed + 1) % palette.length],
    tiles,
  };
}

function buildHomePixelBackground(shellRect) {
  return buildBalancedPixelField(shellRect, homeGridPalette, {
    divisor: 10.8,
    minCell: 64,
    maxCell: 92,
    scrollSpeed: 12,
    opacity: 0.97,
  });
}

function buildAboutPixelBackground(shellRect) {
  return buildBalancedPixelField(shellRect, aboutGridPalette, {
    divisor: 11.5,
    minCell: 60,
    maxCell: 88,
    scrollSpeed: 10,
    opacity: 0.95,
  });
}

function randomizeShellBackground() {
  if (!shell) {
    return;
  }

  const body = document.body;
  const topLine = document.querySelector(".bg-line-top");
  const shellRect = shell.getBoundingClientRect();
  const mosaicLayer = ensureMosaicLayer();

  if (body.classList.contains("page-home") || body.classList.contains("page-about")) {
    const sharedTopLine =
      "linear-gradient(90deg, #b8ddbf 0%, #f3cedc 34%, #f2e1a9 68%, #c8e5ee 100%)";

    shell.style.background = "var(--paper)";
    shell.style.setProperty("--pixel-grid-size", "120px");
    shell.style.borderTopColor = "#c9dcbf";

    if (mosaicLayer) {
      mosaicLayer.replaceChildren();
    }

    if (topLine) {
      topLine.style.background = sharedTopLine;
    }

    return;
  }

  if (mosaicLayer) {
    mosaicLayer.replaceChildren();
  }
}

function initHeroNameJitter() {
  const heroNameLines = document.querySelectorAll(".page-home .hero-name-line");

  heroNameLines.forEach((line) => {
    if (line.dataset.jitterReady === "true") {
      return;
    }

    const text = (line.textContent || "").trim();

    if (!text) {
      return;
    }

    applyJitterText(line, text);

    line.dataset.jitterReady = "true";
  });
}

function applyJitterText(target, text, letterClassName = "hero-letter") {
  if (!target) {
    return;
  }

  target.replaceChildren();
  const fragment = document.createDocumentFragment();
  let letterIndex = 0;

  text.split(/(\s+)/).forEach((token) => {
    if (!token) {
      return;
    }

    if (/^\s+$/.test(token)) {
      fragment.append(document.createTextNode(token));
      return;
    }

    const word = document.createElement("span");
    word.className = "jitter-word";

    [...token].forEach((character) => {
      const letter = document.createElement("span");
      letter.className = letterClassName;
      letter.textContent = character;
      letter.style.setProperty("--jitter-x", `${randomBetween(-1.8, 1.8).toFixed(2)}px`);
      letter.style.setProperty("--jitter-y", `${randomBetween(-1.6, 1.6).toFixed(2)}px`);
      letter.style.setProperty("--jitter-rotate", `${randomBetween(-1.4, 1.4).toFixed(2)}deg`);
      letter.style.setProperty("--jitter-duration", `${randomBetween(2.4, 4.8).toFixed(2)}s`);
      letter.style.setProperty("--jitter-delay", `${(letterIndex * 0.05 + randomBetween(0, 0.4)).toFixed(2)}s`);
      word.append(letter);
      letterIndex += 1;
    });

    fragment.append(word);
  });

  target.append(fragment);
}

function initSymbolRain(targets, options) {
  const items = Array.from(targets);

  items.forEach((target) => {
    let rainInterval = null;

    function spawnSymbolDrop(burstMultiplier = 1) {
      const rect = target.getBoundingClientRect();
      const availableWidth = Math.max(80, rect.width);
      const drops = Math.max(1, Math.round(randomBetween(options.dropRange[0], options.dropRange[1]) * burstMultiplier));

      for (let index = 0; index < drops; index += 1) {
        const symbol = document.createElement("span");
        symbol.className = options.className;
        symbol.setAttribute("aria-hidden", "true");
        symbol.textContent = options.symbol;
        symbol.style.setProperty("--money-x", `${randomBetween(8, availableWidth - 12).toFixed(1)}px`);
        symbol.style.setProperty("--money-drift", `${randomBetween(options.driftRange[0], options.driftRange[1]).toFixed(1)}px`);
        symbol.style.setProperty("--money-fall", `${randomBetween(options.fallRange[0], options.fallRange[1]).toFixed(1)}px`);
        symbol.style.setProperty("--money-scale", `${randomBetween(options.scaleRange[0], options.scaleRange[1]).toFixed(2)}`);
        symbol.style.setProperty("--money-rotate", `${randomBetween(options.rotateRange[0], options.rotateRange[1]).toFixed(1)}deg`);
        symbol.style.setProperty("--money-duration", `${randomBetween(options.durationRange[0], options.durationRange[1]).toFixed(2)}s`);

        target.append(symbol);

        window.setTimeout(() => {
          symbol.remove();
        }, options.removeDelay);
      }
    }

    function startRain() {
      if (rainInterval !== null) {
        return;
      }

      spawnSymbolDrop(options.hoverBurst);
      rainInterval = window.setInterval(() => {
        spawnSymbolDrop(1);
      }, options.intervalMs);
    }

    function stopRain() {
      if (rainInterval === null) {
        return;
      }

      window.clearInterval(rainInterval);
      rainInterval = null;
    }

    target.addEventListener("pointerenter", startRain);
    target.addEventListener("pointerleave", stopRain);
    target.addEventListener("pointerdown", () => {
      spawnSymbolDrop(options.pressBurst);
    });
    target.addEventListener("focus", startRain);
    target.addEventListener("blur", stopRain);
  });
}

function initHireMeMoneyRain() {
  const hireMeLink = document.querySelector(".page-home .hire-me-link");

  if (!hireMeLink) {
    return;
  }

  initSymbolRain([hireMeLink], {
    className: "money-drop",
    symbol: "$",
    dropRange: [1, 2.4],
    driftRange: [-24, 24],
    fallRange: [110, 180],
    scaleRange: [0.85, 1.25],
    rotateRange: [-160, 160],
    durationRange: [0.8, 1.25],
    removeDelay: 1400,
    hoverBurst: 2,
    pressBurst: 3,
    intervalMs: 120,
  });
}

function initDonateHeartRain() {
  const donateLinks = document.querySelectorAll(".support-link");

  if (!donateLinks.length) {
    return;
  }

  initSymbolRain(donateLinks, {
    className: "heart-drop",
    symbol: "♥",
    dropRange: [1, 2.2],
    driftRange: [-20, 20],
    fallRange: [96, 168],
    scaleRange: [0.8, 1.18],
    rotateRange: [-90, 90],
    durationRange: [0.9, 1.35],
    removeDelay: 1500,
    hoverBurst: 2,
    pressBurst: 2.8,
    intervalMs: 140,
  });
}

const screenshotKeysPressed = new Set();
let screenshotComboLatched = false;

function isTypingIntoField() {
  const activeElement = document.activeElement;

  if (!activeElement) {
    return false;
  }

  const tagName = activeElement.tagName;

  return (
    activeElement.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}

function initScreenshotModeShortcut() {
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key !== "o" && key !== "r") {
      return;
    }

    if (isTypingIntoField()) {
      return;
    }

    screenshotKeysPressed.add(key);

    if (screenshotKeysPressed.has("o") && screenshotKeysPressed.has("r") && !screenshotComboLatched) {
      document.body.classList.toggle("clean-shot-mode");
      screenshotComboLatched = true;
    }
  });

  document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();

    if (key !== "o" && key !== "r") {
      return;
    }

    screenshotKeysPressed.delete(key);

    if (!screenshotKeysPressed.has("o") || !screenshotKeysPressed.has("r")) {
      screenshotComboLatched = false;
    }
  });

  window.addEventListener("blur", () => {
    screenshotKeysPressed.clear();
    screenshotComboLatched = false;
  });
}

function setSquareStyles(element, containerRect, config) {
  const minDimension = Math.min(containerRect.width, containerRect.height);
  const size = Math.round(
    clamp(
      minDimension * randomBetween(config.sizeRange[0], config.sizeRange[1]),
      config.pixelRange[0],
      config.pixelRange[1],
    ),
  );
  const left = (randomBetween(config.leftRange[0], config.leftRange[1]) / 100) * containerRect.width;
  const top = (randomBetween(config.topRange[0], config.topRange[1]) / 100) * containerRect.height;
  const color = decorPalette[Math.floor(Math.random() * decorPalette.length)];

  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  element.style.right = "auto";
  element.style.bottom = "auto";
  element.style.background = color;
  element.dataset.baseTransform = "";
  element.dataset.baseLeft = `${left}`;
  element.dataset.baseTop = `${top}`;
  element.dataset.shapeWidth = `${size}`;
  element.dataset.shapeHeight = `${size}`;
  element.dataset.loopAxis = "y";
  element.dataset.loopRange = `${containerRect.height + size + 120}`;
  element.dataset.loopPhase = `${randomBetween(0, containerRect.height).toFixed(1)}`;
  element.dataset.loopSpeed = `${randomBetween(1, 2.4).toFixed(3)}`;
}

function setGridSquareStyles(element, containerRect, config, palette, cellSize) {
  const cols = Math.max(8, Math.ceil(containerRect.width / cellSize));
  const rows = Math.max(7, Math.ceil(containerRect.height / cellSize));
  const colSpan = clamp(randomInt(config.colSpanRange[0], config.colSpanRange[1]), 1, cols);
  const rowSpan = clamp(randomInt(config.rowSpanRange[0], config.rowSpanRange[1]), 1, rows);
  const maxColStart = Math.max(0, cols - colSpan);
  const maxRowStart = Math.max(0, rows - rowSpan);
  const colStart = clamp(randomInt(config.colRange[0], config.colRange[1]), 0, maxColStart);
  const rowStart = clamp(randomInt(config.rowRange[0], config.rowRange[1]), 0, maxRowStart);
  const color = palette[Math.floor(Math.random() * palette.length)];

  element.style.width = `${colSpan * cellSize}px`;
  element.style.height = `${rowSpan * cellSize}px`;
  element.style.left = `${colStart * cellSize}px`;
  element.style.top = `${rowStart * cellSize}px`;
  element.style.right = "auto";
  element.style.bottom = "auto";
  element.style.background = color;
  element.dataset.baseTransform = "";
  element.dataset.baseLeft = `${colStart * cellSize}`;
  element.dataset.baseTop = `${rowStart * cellSize}`;
  element.dataset.shapeWidth = `${colSpan * cellSize}`;
  element.dataset.shapeHeight = `${rowSpan * cellSize}`;
  element.dataset.loopAxis = "y";
  element.dataset.loopRange = `${containerRect.height + rowSpan * cellSize + 120}`;
  element.dataset.loopPhase = `${randomBetween(0, containerRect.height).toFixed(1)}`;
  element.dataset.loopSpeed = `${randomBetween(1.1, 2.8).toFixed(3)}`;
}

function randomizeDecorSquares() {
  const shellSquares = Array.from(document.querySelectorAll(".bg-block, .bg-line-right"));
  const aboutRemix = document.querySelector(".about-remix");
  const aboutSquares = Array.from(document.querySelectorAll(".about-floating"));
  const body = document.body;

  if (shell && shellSquares.length) {
    const shellRect = shell.getBoundingClientRect();
    const isHome = body.classList.contains("page-home");

    if (isHome) {
      const cellSize = Math.round(clamp(Math.min(shellRect.width, shellRect.height) / 8.5, 72, 118));
      const cols = Math.max(8, Math.ceil(shellRect.width / cellSize));
      const rows = Math.max(7, Math.ceil(shellRect.height / cellSize));
      const shellConfigs = [
        {
          colRange: [0, 1],
          rowRange: [Math.max(3, rows - 3), Math.max(4, rows - 2)],
          colSpanRange: [2, 3],
          rowSpanRange: [2, 3],
        },
        {
          colRange: [0, 1],
          rowRange: [1, 2],
          colSpanRange: [1, 2],
          rowSpanRange: [2, 3],
        },
        {
          colRange: [Math.max(4, cols - 4), Math.max(5, cols - 2)],
          rowRange: [0, 1],
          colSpanRange: [1, 2],
          rowSpanRange: [2, 3],
        },
        {
          colRange: [Math.max(4, cols - 4), Math.max(5, cols - 2)],
          rowRange: [Math.max(3, rows - 4), Math.max(4, rows - 3)],
          colSpanRange: [2, 3],
          rowSpanRange: [2, 3],
        },
      ];

      shellSquares.forEach((square, index) => {
        setGridSquareStyles(
          square,
          shellRect,
          shellConfigs[index] || shellConfigs[shellConfigs.length - 1],
          homeGridPalette,
          cellSize,
        );
      });
    } else {
      const shellConfigs = [
        {
          sizeRange: [0.2, 0.3],
          pixelRange: [140, 320],
          leftRange: [4, 18],
          topRange: [56, 72],
        },
        {
          sizeRange: [0.22, 0.34],
          pixelRange: [180, 380],
          leftRange: [-4, 8],
          topRange: [8, 24],
        },
        {
          sizeRange: [0.16, 0.24],
          pixelRange: [130, 260],
          leftRange: [72, 84],
          topRange: [2, 14],
        },
        {
          sizeRange: [0.22, 0.3],
          pixelRange: [170, 320],
          leftRange: [72, 84],
          topRange: [48, 66],
        },
      ];

      shellSquares.forEach((square, index) => {
        setSquareStyles(square, shellRect, shellConfigs[index] || shellConfigs[shellConfigs.length - 1]);
      });
    }
  }

  if (aboutRemix && aboutSquares.length) {
    const remixRect = aboutRemix.getBoundingClientRect();
    const aboutCellSize = Math.round(clamp(Math.min(remixRect.width, remixRect.height) / 8.5, 62, 96));
    const remixCols = Math.max(8, Math.ceil(remixRect.width / aboutCellSize));
    const remixRows = Math.max(8, Math.ceil(remixRect.height / aboutCellSize));
    const aboutConfigs = [
      {
        colRange: [Math.max(3, Math.floor(remixCols * 0.42)), Math.max(4, Math.floor(remixCols * 0.56))],
        rowRange: [1, 2],
        colSpanRange: [1, 2],
        rowSpanRange: [1, 2],
      },
      {
        colRange: [Math.max(5, remixCols - 3), Math.max(6, remixCols - 2)],
        rowRange: [2, 3],
        colSpanRange: [1, 2],
        rowSpanRange: [1, 2],
      },
      {
        colRange: [Math.max(4, Math.floor(remixCols * 0.48)), Math.max(5, Math.floor(remixCols * 0.62))],
        rowRange: [Math.max(5, remixRows - 3), Math.max(6, remixRows - 2)],
        colSpanRange: [1, 2],
        rowSpanRange: [1, 2],
      },
    ];

    aboutSquares.forEach((square, index) => {
      setGridSquareStyles(
        square,
        remixRect,
        aboutConfigs[index] || aboutConfigs[aboutConfigs.length - 1],
        aboutGridPalette,
        aboutCellSize,
      );
    });
  }
}

function animateParallax(timestamp = 0) {
  const elapsedSeconds = timestamp / 1000;

  currentX += (targetX - currentX) * 0.08;
  currentY += (targetY - currentY) * 0.08;

  shapes.forEach((shape) => {
    const depth = Number(shape.dataset.depth || 12);
    const motionBoost = shape.matches(".about-floating") ? 3.1 : shape.matches(".bg-tile") ? 2.95 : 2.6;
    let moveX = (currentX / depth) * motionBoost;
    let moveY = (currentY / depth) * motionBoost;
    const loopAxis = shape.dataset.loopAxis;

    if (loopAxis) {
      const loopRange = Number(shape.dataset.loopRange || 0);
      const loopSpeed = Number(shape.dataset.loopSpeed || 0);
      const loopPhase = Number(shape.dataset.loopPhase || 0);
      const baseLeft = Number(shape.dataset.baseLeft || 0);
      const baseTop = Number(shape.dataset.baseTop || 0);
      const shapeWidth = Number(shape.dataset.shapeWidth || 0);
      const shapeHeight = Number(shape.dataset.shapeHeight || 0);

      if (loopRange > 0 && loopSpeed > 0) {
        if (loopAxis === "x") {
          const wrappedX = (((baseLeft + elapsedSeconds * loopSpeed + loopPhase) % loopRange) + loopRange) % loopRange - shapeWidth;
          moveX += wrappedX - baseLeft;
        } else {
          const wrappedY = (((baseTop + elapsedSeconds * loopSpeed + loopPhase) % loopRange) + loopRange) % loopRange - shapeHeight;
          moveY += wrappedY - baseTop;
        }
      }
    }

    const baseTransform = shape.dataset.baseTransform || "";
    shape.style.transform = `translate(${moveX}px, ${moveY}px) ${baseTransform}`.trim();
  });

  panels.forEach((panel) => {
    const depth = Number(panel.dataset.depth || 12);
    const moveX = currentX / depth;
    const moveY = currentY / depth;
    const image = panel.querySelector("img");

    if (image) {
      image.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px)) scale(1.03)`;
    }
  });

  requestAnimationFrame(animateParallax);
}

if (shell) {
  initHeroNameJitter();
  initHireMeMoneyRain();
  initDonateHeartRain();
  randomizeShellBackground();
  randomizeDecorSquares();
  refreshParallaxShapes();

  shell.addEventListener("mousemove", (event) => {
    const rect = shell.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;
    const parallaxRange = document.body.classList.contains("page-about") ? 76 : 64;

    targetX = ((relativeX / rect.width) - 0.5) * parallaxRange;
    targetY = ((relativeY / rect.height) - 0.5) * parallaxRange;
  });

  shell.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
  });

  animateParallax();
}

const portfolioGrid = document.getElementById("portfolioPostGrid");
const portfolioWipGrid = document.getElementById("portfolioWipGrid");
const portfolioCreditGrid = document.getElementById("portfolioCreditGrid");
const portfolioLauncher = document.getElementById("portfolioLauncher");
const portfolioLauncherRotator = document.getElementById("portfolioLauncherRotator");
const portfolioContent = document.getElementById("portfolioContent");
const portfolioViewButtons = Array.from(document.querySelectorAll("[data-portfolio-view]"));
const portfolioPanels = Array.from(document.querySelectorAll("[data-portfolio-panel]"));
const portfolioLightbox = document.getElementById("portfolioLightbox");
const portfolioLightboxImage = document.getElementById("portfolioLightboxImage");
const portfolioLightboxCaption = document.getElementById("portfolioLightboxCaption");
const portfolioLightboxTitle = document.getElementById("portfolioLightboxTitle");
const portfolioLightboxMeta = document.getElementById("portfolioLightboxMeta");
const portfolioLightboxCounter = document.getElementById("portfolioLightboxCounter");
const portfolioLightboxStageFilters = document.getElementById("portfolioLightboxStageFilters");
const portfolioLightboxThumbs = document.getElementById("portfolioLightboxThumbs");
const portfolioLightboxPrev = document.getElementById("portfolioLightboxPrev");
const portfolioLightboxNext = document.getElementById("portfolioLightboxNext");
const portfolioLightboxClose = document.getElementById("portfolioLightboxClose");

function initPortfolioLauncherRotator() {
  if (!portfolioLauncherRotator) {
    return;
  }

  const messages = [
    "Thank you for checking my stuff out! Pick an option below",
    "Take a look around and choose what you want to see first",
    "Jump into finished art, WIPs, my resume work, or the future shop",
    "Pick a section below and I will take you right to it",
  ];

  let messageIndex = 0;

  const renderMessage = () => {
    applyJitterText(portfolioLauncherRotator, messages[messageIndex]);
  };

  renderMessage();

  if (messages.length > 1) {
    window.setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      renderMessage();
    }, 10000);
  }
}

const portfolioVideoPattern = /\.(mp4|webm|ogg|mov)$/i;
const portfolioStageOrder = ["finished", "wip", "bts"];
const portfolioStageLabels = {
  finished: "Finished",
  wip: "WIP",
  bts: "BTS",
};
const portfolioSectionLabels = {
  art: "Art",
  wips: "WIPs",
};
const portfolioVideoPlaceholder = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#0f131b"/>
  <rect x="60" y="60" width="1080" height="680" rx="30" fill="#171d28" stroke="#394255" stroke-width="8"/>
  <circle cx="600" cy="360" r="118" fill="#24314d" stroke="#7aa2ff" stroke-width="10"/>
  <polygon points="560,285 560,435 690,360" fill="#f5f8ff"/>
  <text x="600" y="585" text-anchor="middle" fill="#f5f8ff" font-family="Arial, sans-serif" font-size="64" font-weight="700">Video Clip</text>
  <text x="600" y="645" text-anchor="middle" fill="#aeb7cc" font-family="Arial, sans-serif" font-size="32">Shown as a still in the gallery viewer</text>
</svg>
`)}`;

function normalizePortfolioSection(value) {
  return String(value || "").trim().toLowerCase() === "wips" ? "wips" : "art";
}

function normalizePortfolioStage(value, section = "art") {
  const normalized = String(value || "").trim().toLowerCase();

  if (["finished", "final", "hero", "render", "rendered"].includes(normalized)) {
    return "finished";
  }

  if (["wip", "work-in-progress", "work in progress", "process", "progress", "rough", "blockout", "sketch", "in-progress"].includes(normalized)) {
    return "wip";
  }

  if (["bts", "behind-the-scenes", "behind the scenes", "viewport", "wireframe", "clay", "breakdown"].includes(normalized)) {
    return "bts";
  }

  return normalizePortfolioSection(section) === "wips" ? "wip" : "finished";
}

function getPortfolioStageLabel(stage) {
  return portfolioStageLabels[stage] || portfolioStageLabels.finished;
}

function getPortfolioMediaPreviewSrc(media) {
  if (media.type === "video") {
    return media.poster || portfolioVideoPlaceholder;
  }

  return media.src;
}

function guessPortfolioMediaType(src, explicitType = "") {
  if (explicitType === "video" || explicitType === "image") {
    return explicitType;
  }

  return portfolioVideoPattern.test(src || "") ? "video" : "image";
}

function normalizePortfolioMedia(media, item, index) {
  if (typeof media === "string") {
    return {
      type: guessPortfolioMediaType(media),
      src: media,
      alt: `${item.title} piece ${index + 1}`,
      caption: "",
      poster: "",
      stage: normalizePortfolioStage("", item.section),
    };
  }

  if (!media?.src) {
    return null;
  }

  return {
    type: guessPortfolioMediaType(media.src, media.type),
    src: media.src,
    alt: media.alt || `${item.title} piece ${index + 1}`,
    caption: media.caption || "",
    poster: media.poster || "",
    stage: normalizePortfolioStage(media.stage || media.category, item.section),
  };
}

function normalizePortfolioThumbnail(thumbnail, item) {
  if (!thumbnail) {
    return null;
  }

  return normalizePortfolioMedia(
    typeof thumbnail === "string"
      ? {
          src: thumbnail,
          alt: `${item.title} thumbnail`,
        }
      : thumbnail,
    item,
    -1,
  );
}

function collectPortfolioData(sourceItems = window.portfolioItems) {
  return Array.isArray(sourceItems)
    ? sourceItems
        .map((item, index) => {
          if (!item?.title) {
            return null;
          }

          const section = normalizePortfolioSection(item.section);
          const media = (
            Array.isArray(item.media)
              ? item.media
              : Array.isArray(item.images)
                ? item.images
                : item.image
                  ? [{ src: item.image, alt: item.alt, caption: item.text }]
                  : []
          )
            .map((asset, assetIndex) => normalizePortfolioMedia(asset, { ...item, section }, assetIndex))
            .filter(Boolean);

          if (!media.length) {
            return null;
          }

          return {
            title: item.title,
            text: item.text || "",
            section,
            status: item.status || "",
            link: item.link || "",
            linkLabel: item.linkLabel || "",
            madeIn: Array.isArray(item.madeIn) ? item.madeIn.filter(Boolean) : item.madeIn ? [item.madeIn] : [],
            media,
            thumbnail: normalizePortfolioThumbnail(item.thumbnail, { ...item, section }),
            dateLabel: item.dateLabel || item.yearLabel || "",
            sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index,
            originalIndex: index,
          };
        })
        .filter(Boolean)
        .sort((left, right) => {
          if (right.sortOrder !== left.sortOrder) {
            return right.sortOrder - left.sortOrder;
          }

          return left.originalIndex - right.originalIndex;
        })
        .map((item, portfolioIndex) => {
          const stageCounts = item.media.reduce((counts, media) => {
            counts[media.stage] = (counts[media.stage] || 0) + 1;
            return counts;
          }, {});

          return {
            ...item,
            portfolioIndex,
            stageCounts,
            availableStages: portfolioStageOrder.filter((stage) => stageCounts[stage]),
          };
        })
    : [];
}

let portfolioData = collectPortfolioData();
const portfolioCredits = Array.isArray(window.portfolioCredits)
  ? window.portfolioCredits
      .map((item) => {
        if (!item?.title) {
          return null;
        }

        return {
          title: item.title,
          type: item.type || "",
          role: item.role || "",
          text: item.text || "",
          image: item.image || "",
          alt: item.alt || item.title,
          status: item.status || "",
          link: item.link || "",
          linkLabel: item.linkLabel || "Open project",
        };
      })
      .filter(Boolean)
  : [];

function buildPortfolioSoftware(item) {
  return item.madeIn.length ? `Made in: ${item.madeIn.join(", ")}` : "";
}

function buildPortfolioMetaLine(item, extraParts = []) {
  return [item.dateLabel, buildPortfolioSoftware(item), ...extraParts].filter(Boolean).join(" | ");
}

function buildPortfolioStageSummary(item) {
  const stagesToShow = portfolioStageOrder.filter((stage) => item.stageCounts?.[stage]);

  if (!stagesToShow.length || (stagesToShow.length === 1 && item.section !== "wips")) {
    return null;
  }

  const summary = document.createElement("span");
  summary.className = "portfolio-post-stage-summary";

  stagesToShow.forEach((stage) => {
    const chip = document.createElement("span");
    chip.className = `portfolio-post-stage-chip portfolio-post-stage-chip-${stage}`;
    chip.textContent = `${item.stageCounts[stage]} ${getPortfolioStageLabel(stage)}`;
    summary.append(chip);
  });

  return summary;
}

function createPortfolioPreview(media) {
  const image = document.createElement("img");
  image.src = getPortfolioMediaPreviewSrc(media);
  image.alt = media.alt || (media.type === "video" ? "Portfolio clip preview" : "Portfolio preview");
  image.className = "portfolio-post-preview";

  return image;
}

function createPortfolioPost(item) {
  const post = document.createElement(item.link ? "a" : "button");
  post.className = "portfolio-post";

  if (item.link) {
    post.href = item.link;
    post.classList.add("portfolio-post-is-link");
  } else {
    post.type = "button";
    post.dataset.portfolioIndex = String(item.portfolioIndex);
  }

  if (item.section === "wips") {
    post.classList.add("portfolio-post-is-wip");
  }

  const imageShell = document.createElement("span");
  imageShell.className = "portfolio-post-image";

  imageShell.append(createPortfolioPreview(item.thumbnail || item.media[0]));

  if (item.media.length > 1) {
    const counter = document.createElement("span");
    counter.className = "portfolio-post-counter";
    counter.textContent = `${item.media.length} pieces`;
    imageShell.append(counter);
  } else if (item.media[0].type === "video") {
    const counter = document.createElement("span");
    counter.className = "portfolio-post-counter";
    counter.textContent = "1 clip";
    imageShell.append(counter);
  }

  const openHint = document.createElement("span");
  openHint.className = "portfolio-post-open";
  openHint.textContent = item.link
    ? item.linkLabel || "View Project"
    : item.media.length === 1 && item.media[0].type === "video"
      ? "Open Clip"
      : "Open Project";
  imageShell.append(openHint);

  const copy = document.createElement("span");
  copy.className = "portfolio-post-copy";

  if (item.dateLabel || item.section === "wips") {
    const header = document.createElement("span");
    header.className = "portfolio-post-header";

    if (item.dateLabel) {
      const badge = document.createElement("span");
      badge.className = "portfolio-post-badge";
      badge.textContent = item.dateLabel;
      header.append(badge);
    }

    if (item.section === "wips") {
      const sectionBadge = document.createElement("span");
      sectionBadge.className = "portfolio-post-badge portfolio-post-badge-section";
      sectionBadge.textContent = portfolioSectionLabels[item.section];
      header.append(sectionBadge);
    }

    if (item.status) {
      const statusBadge = document.createElement("span");
      statusBadge.className = "portfolio-post-badge portfolio-post-badge-status";
      statusBadge.textContent = item.status;
      header.append(statusBadge);
    }

    copy.append(header);
  }

  const title = document.createElement("span");
  title.className = "portfolio-post-title";
  title.textContent = item.title;
  copy.append(title);

  const stageSummary = buildPortfolioStageSummary(item);

  if (stageSummary) {
    copy.append(stageSummary);
  }

  if (item.text) {
    const meta = document.createElement("span");
    meta.className = "portfolio-post-meta";
    meta.textContent = item.text;
    copy.append(meta);
  }

  if (item.madeIn.length) {
    const software = document.createElement("span");
    software.className = "portfolio-post-software";

    item.madeIn.forEach((tool) => {
      const tag = document.createElement("span");
      tag.className = "portfolio-software-tag";
      tag.textContent = tool;
      software.append(tag);
    });

    copy.append(software);
  }

  post.append(imageShell, copy);

  return post;
}

function getPortfolioGroupSortValue(label, entries) {
  const normalizedLabel = String(label || "").trim();
  const yearMatch = normalizedLabel.match(/\d{4}/);

  if (yearMatch) {
    return Number(yearMatch[0]) * 1000 + Math.max(...entries.map((entry) => Number(entry.item.sortOrder) || 0), 0);
  }

  if (normalizedLabel.toLowerCase() === "archive") {
    return -1;
  }

  return Math.max(...entries.map((entry) => Number(entry.item.sortOrder) || 0), 0);
}

function buildPortfolioTimelineGroups(items) {
  const groups = [];
  const byLabel = new Map();

  items.forEach((item) => {
    const label = item.dateLabel || "Archive";

    if (!byLabel.has(label)) {
      const group = {
        label,
        entries: [],
      };

      byLabel.set(label, group);
      groups.push(group);
    }

    byLabel.get(label).entries.push({
      item,
    });
  });

  groups.forEach((group) => {
    group.entries.sort((left, right) => {
      if (right.item.sortOrder !== left.item.sortOrder) {
        return right.item.sortOrder - left.item.sortOrder;
      }

      return left.item.originalIndex - right.item.originalIndex;
    });

    group.sortValue = getPortfolioGroupSortValue(group.label, group.entries);
  });

  return groups.sort((left, right) => {
    if (right.sortValue !== left.sortValue) {
      return right.sortValue - left.sortValue;
    }

    return String(left.label || "").localeCompare(String(right.label || ""));
  });
}

function createPortfolioTimelineGroup(group) {
  const section = document.createElement("section");
  section.className = "portfolio-era";

  const heading = document.createElement("div");
  heading.className = "portfolio-era-heading";

  const kicker = document.createElement("p");
  kicker.className = "portfolio-era-kicker";
  kicker.textContent = "Timeline";
  heading.append(kicker);

  const title = document.createElement("h3");
  title.className = "portfolio-era-title";
  title.textContent = group.label;
  heading.append(title);

  const grid = document.createElement("div");
  grid.className = "portfolio-era-grid";

  group.entries.forEach((entry) => {
    grid.append(createPortfolioPost(entry.item));
  });

  section.append(heading, grid);

  return section;
}

function renderPortfolioTimeline(container, items, emptyMessage) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!items.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "portfolio-empty";
    emptyState.textContent = emptyMessage;
    container.append(emptyState);
    return;
  }

  buildPortfolioTimelineGroups(items).forEach((group) => {
    container.append(createPortfolioTimelineGroup(group));
  });
}

function createPortfolioCredit(item) {
  const card = document.createElement("article");
  card.className = "portfolio-credit-card";

  if (item.image) {
    const media = document.createElement("div");
    media.className = "portfolio-credit-media";

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.alt || `${item.title} artwork`;
    media.append(image);
    card.append(media);
  }

  const copy = document.createElement("div");
  copy.className = "portfolio-credit-copy";

  const top = document.createElement("div");
  top.className = "portfolio-credit-top";

  if (item.type) {
    const type = document.createElement("span");
    type.className = "portfolio-credit-badge";
    type.textContent = item.type;
    top.append(type);
  }

  if (item.status) {
    const status = document.createElement("span");
    status.className = "portfolio-credit-badge portfolio-credit-badge-status";
    status.textContent = item.status;
    top.append(status);
  }

  if (top.childElementCount) {
    copy.append(top);
  }

  const title = document.createElement("h3");
  title.className = "portfolio-credit-title";
  title.textContent = item.title;
  copy.append(title);

  if (item.role) {
    const role = document.createElement("p");
    role.className = "portfolio-credit-role";
    role.textContent = item.role;
    copy.append(role);
  }

  if (item.text) {
    const text = document.createElement("p");
    text.className = "portfolio-credit-text";
    text.textContent = item.text;
    copy.append(text);
  }

  if (item.link) {
    const link = document.createElement("a");
    link.className = "portfolio-credit-link";
    link.href = item.link;
    link.textContent = item.linkLabel || "Open project";

    const isExternal = /^https?:\/\//i.test(item.link);

    if (isExternal) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }

    copy.append(link);
  }

  card.append(copy);

  return card;
}

if (portfolioCreditGrid) {
  if (!portfolioCredits.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "portfolio-empty";
    emptyState.textContent = "Add games or videos in portfolio-data.js to show your contributions here.";
    portfolioCreditGrid.append(emptyState);
  } else {
    portfolioCredits.forEach((item) => {
      portfolioCreditGrid.append(createPortfolioCredit(item));
    });
  }
}

function setPortfolioView(view, options = {}) {
  if (!portfolioLauncher || !portfolioContent || !portfolioPanels.length) {
    return;
  }

  const activePanel = portfolioPanels.find((panel) => panel.dataset.portfolioPanel === view);

  if (!activePanel) {
    return;
  }

  portfolioLauncher.classList.add("is-docked");
  portfolioContent.hidden = false;

  portfolioPanels.forEach((panel) => {
    panel.hidden = panel !== activePanel;
  });

  portfolioViewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.portfolioView === view);
  });

  if (options.updateHash !== false && window.history?.replaceState) {
    window.history.replaceState(null, "", `#${view}`);
  }

  if (options.scroll !== false) {
    window.requestAnimationFrame(() => {
      activePanel.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }
}

if (portfolioLauncher && portfolioContent && portfolioPanels.length && portfolioViewButtons.length) {
  initPortfolioLauncherRotator();

  if (window.location.hash && window.history?.replaceState) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }

  portfolioViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setPortfolioView(button.dataset.portfolioView || "");
    });
  });

  window.addEventListener("hashchange", () => {
    const nextView = window.location.hash.replace("#", "").trim().toLowerCase();

    if (nextView) {
      setPortfolioView(nextView, {
        scroll: false,
        updateHash: false,
      });
    }
  });
}

function initPortfolioGallery() {
  if (
    !portfolioGrid ||
    !portfolioWipGrid ||
    !portfolioLightbox ||
    !portfolioLightboxImage ||
    !portfolioLightboxCaption ||
    !portfolioLightboxTitle ||
    !portfolioLightboxMeta ||
    !portfolioLightboxCounter ||
    !portfolioLightboxThumbs
  ) {
    return;
  }

  portfolioData = collectPortfolioData();
  const portfolioArtData = portfolioData.filter((item) => item.section !== "wips");
  const portfolioWipsData = portfolioData.filter((item) => item.section === "wips");

  renderPortfolioTimeline(
    portfolioGrid,
    portfolioArtData,
    "Add portfolio items in portfolio-data.js or Supabase to show your finished work here.",
  );
  renderPortfolioTimeline(
    portfolioWipGrid,
    portfolioWipsData,
    "Add published WIP projects to show rough passes, process shots, and unfinished work here.",
  );

  const portfolioPosts = Array.from(document.querySelectorAll(".portfolio-post"));
  let activePortfolioIndex = 0;
  let activePortfolioMediaIndex = 0;
  let activePortfolioStageFilter = "all";
  let activePortfolioVisibleMedia = [];

  function getDefaultPortfolioStageFilter(post) {
    if (!post) {
      return "all";
    }

    if (post.section === "wips" && post.availableStages.includes("wip")) {
      return "wip";
    }

    if (post.availableStages.includes("finished") && post.availableStages.length > 1) {
      return "finished";
    }

    return "all";
  }

  function getVisiblePortfolioMedia(post) {
    if (!post) {
      return [];
    }

    if (activePortfolioStageFilter === "all") {
      return post.media;
    }

    const filteredMedia = post.media.filter((media) => media.stage === activePortfolioStageFilter);
    return filteredMedia.length ? filteredMedia : post.media;
  }

  function syncPortfolioStageFilters(post) {
    if (!portfolioLightboxStageFilters || !post) {
      return;
    }

    const availableStages = post.availableStages || [];
    portfolioLightboxStageFilters.replaceChildren();

    if (availableStages.length <= 1) {
      portfolioLightboxStageFilters.hidden = true;
      return;
    }

    const filters = ["all", ...portfolioStageOrder.filter((stage) => availableStages.includes(stage))];

    filters.forEach((stage) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "portfolio-lightbox-stage-filter";
      button.textContent = stage === "all" ? "All" : getPortfolioStageLabel(stage);
      button.classList.toggle("is-active", activePortfolioStageFilter === stage);
      button.addEventListener("click", () => {
        activePortfolioStageFilter = stage;
        renderPortfolioLightbox(activePortfolioIndex, 0);
      });
      portfolioLightboxStageFilters.append(button);
    });

    portfolioLightboxStageFilters.hidden = false;
  }

  function renderPortfolioLightboxThumbs() {
    portfolioLightboxThumbs.replaceChildren();

    if (activePortfolioVisibleMedia.length <= 1) {
      portfolioLightboxThumbs.hidden = true;
      return;
    }

    activePortfolioVisibleMedia.forEach((media, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "portfolio-lightbox-thumb";
      button.classList.toggle("is-active", index === activePortfolioMediaIndex);

      if (media.type === "video") {
        button.classList.add("is-video");
      }

      button.setAttribute("aria-label", media.type === "video" ? `Show clip ${index + 1}` : `Show image ${index + 1}`);
      button.addEventListener("click", () => {
        renderPortfolioLightbox(activePortfolioIndex, index);
      });

      const image = document.createElement("img");
      image.className = "portfolio-lightbox-thumb-preview";
      image.src = getPortfolioMediaPreviewSrc(media);
      image.alt = media.alt || (media.type === "video" ? "Portfolio clip thumbnail" : "Portfolio thumbnail");
      button.append(image);

      if (media.type === "video") {
        const badge = document.createElement("span");
        badge.className = "portfolio-lightbox-thumb-badge";
        badge.textContent = "Clip";
        button.append(badge);
      }

      portfolioLightboxThumbs.append(button);
    });

    portfolioLightboxThumbs.hidden = false;

    const activeThumb = portfolioLightboxThumbs.querySelector(".portfolio-lightbox-thumb.is-active");
    activeThumb?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }

  function renderPortfolioLightbox(postIndex, mediaIndex = 0) {
    activePortfolioIndex = (postIndex + portfolioData.length) % portfolioData.length;
    const activePost = portfolioData[activePortfolioIndex];

    if (activePortfolioStageFilter !== "all" && !activePost.availableStages.includes(activePortfolioStageFilter)) {
      activePortfolioStageFilter = getDefaultPortfolioStageFilter(activePost);
    }

    activePortfolioVisibleMedia = getVisiblePortfolioMedia(activePost);
    activePortfolioMediaIndex = (mediaIndex + activePortfolioVisibleMedia.length) % activePortfolioVisibleMedia.length;
    const activeMedia = activePortfolioVisibleMedia[activePortfolioMediaIndex];

    portfolioLightboxImage.src = getPortfolioMediaPreviewSrc(activeMedia);
    portfolioLightboxImage.alt = activeMedia.alt || (activeMedia.type === "video" ? "Portfolio clip preview" : "Portfolio enlarged image");

    portfolioLightboxTitle.textContent = activePost.title;
    portfolioLightboxMeta.textContent = buildPortfolioMetaLine(activePost, [
      getPortfolioStageLabel(activeMedia.stage),
      activeMedia.type === "video" ? "Clip" : "",
    ]);
    portfolioLightboxCaption.textContent = activeMedia.caption || activePost.text || "Selected Work";
    portfolioLightboxCounter.textContent =
      activePortfolioVisibleMedia.length > 1
        ? `${activePortfolioMediaIndex + 1} / ${activePortfolioVisibleMedia.length}`
        : activeMedia.type === "video"
          ? "1 clip"
          : "1 / 1";
    portfolioLightboxPrev.hidden = activePortfolioVisibleMedia.length <= 1;
    portfolioLightboxNext.hidden = activePortfolioVisibleMedia.length <= 1;
    syncPortfolioStageFilters(activePost);
    renderPortfolioLightboxThumbs();
  }

  function openPortfolioLightbox(index) {
    activePortfolioStageFilter = getDefaultPortfolioStageFilter(portfolioData[index]);
    renderPortfolioLightbox(index, 0);
    portfolioLightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closePortfolioLightbox() {
    portfolioLightbox.hidden = true;
    portfolioLightboxImage.removeAttribute("src");

    if (portfolioLightboxStageFilters) {
      portfolioLightboxStageFilters.hidden = true;
      portfolioLightboxStageFilters.replaceChildren();
    }

    portfolioLightboxThumbs.hidden = true;
    portfolioLightboxThumbs.replaceChildren();

    document.body.style.overflow = "";
  }

  portfolioPosts.forEach((post) => {
    if (!post.dataset.portfolioIndex) {
      return;
    }

    post.addEventListener("click", () => {
      openPortfolioLightbox(Number(post.dataset.portfolioIndex || 0));
    });
  });

  portfolioLightboxPrev.onclick = () => {
    renderPortfolioLightbox(activePortfolioIndex, activePortfolioMediaIndex - 1);
  };

  portfolioLightboxNext.onclick = () => {
    renderPortfolioLightbox(activePortfolioIndex, activePortfolioMediaIndex + 1);
  };

  portfolioLightboxClose.onclick = closePortfolioLightbox;

  portfolioLightbox.onclick = (event) => {
    if (event.target === portfolioLightbox) {
      closePortfolioLightbox();
    }
  };

  document.onkeydown = (event) => {
    if (portfolioLightbox.hidden || !portfolioData.length) {
      return;
    }

    if (event.key === "Escape") {
      closePortfolioLightbox();
    }

    if (event.key === "ArrowLeft") {
      renderPortfolioLightbox(activePortfolioIndex, activePortfolioMediaIndex - 1);
    }

    if (event.key === "ArrowRight") {
      renderPortfolioLightbox(activePortfolioIndex, activePortfolioMediaIndex + 1);
    }
  };
}

const portfolioBootstrapPromise = window.portfolioBootstrapPromise && typeof window.portfolioBootstrapPromise.then === "function"
  ? window.portfolioBootstrapPromise
  : Promise.resolve();

portfolioBootstrapPromise
  .catch((error) => {
    console.warn("Portfolio bootstrap failed, falling back to local data.", error);
  })
  .finally(() => {
    initPortfolioGallery();
  });

const contactForm = document.getElementById("contactForm");

if (contactForm) {
  const contactName = document.getElementById("contactName");
  const contactReplyEmail = document.getElementById("contactReplyEmail");
  const contactSubject = document.getElementById("contactSubject");
  const contactMessage = document.getElementById("contactMessage");

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const subject = contactSubject?.value.trim() || "";
    const message = contactMessage?.value.trim() || "";

    if (!subject || !message) {
      contactForm.reportValidity();
      return;
    }

    const body = [
      contactName?.value.trim() ? `Name: ${contactName.value.trim()}` : "",
      contactReplyEmail?.value.trim() ? `Reply Email: ${contactReplyEmail.value.trim()}` : "",
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const mailtoUrl = `mailto:jackplaygames1@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  });
}

initScreenshotModeShortcut();
