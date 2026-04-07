const shell = document.getElementById("siteShell");
const shapes = document.querySelectorAll(".bg-block, .bg-line, .about-floating");
const panels = document.querySelectorAll(".parallax-panel");

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

const decorPalette = ["#ff2452", "#29ff3f", "#fff200", "#00e5ff", "#ff00a8", "#ff8a00"];
const homePastelPalette = ["#ffb8d7", "#ffd7a8", "#fff3a8", "#c7f7c2", "#afeeff", "#d7c8ff"];

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

function createColorBlockLayer(direction, start, size, color) {
  const safeStart = clamp(start, 0, 94);
  const safeEnd = clamp(safeStart + size, safeStart + 6, 100);
  return `linear-gradient(${direction}deg, transparent 0 ${safeStart}%, ${color} ${safeStart}% ${safeEnd}%, transparent ${safeEnd}% 100%)`;
}

function createSolidBlockLayer(x, y, width, height, color) {
  return `linear-gradient(${color} 0 0) ${x}px ${y}px / ${width}px ${height}px no-repeat`;
}

function createGridBlockLayer(config) {
  const colSpan = clamp(randomInt(config.colSpanRange[0], config.colSpanRange[1]), 1, config.cols);
  const rowSpan = clamp(randomInt(config.rowSpanRange[0], config.rowSpanRange[1]), 1, config.rows);
  const maxColStart = Math.max(0, config.cols - colSpan);
  const maxRowStart = Math.max(0, config.rows - rowSpan);
  const colStart = clamp(randomInt(config.colRange[0], config.colRange[1]), 0, maxColStart);
  const rowStart = clamp(randomInt(config.rowRange[0], config.rowRange[1]), 0, maxRowStart);

  return createSolidBlockLayer(
    colStart * config.cellSize,
    rowStart * config.cellSize,
    colSpan * config.cellSize,
    rowSpan * config.cellSize,
    config.color,
  );
}

function buildHomePixelBackground(shellRect) {
  const cellSize = Math.round(clamp(Math.min(shellRect.width, shellRect.height) / 8.5, 72, 118));
  const cols = Math.max(8, Math.ceil(shellRect.width / cellSize));
  const rows = Math.max(7, Math.ceil(shellRect.height / cellSize));
  const colors = pickRandomColors(8, homePastelPalette);
  const blockConfigs = [
    {
      colRange: [0, 1],
      rowRange: [1, 2],
      colSpanRange: [2, 4],
      rowSpanRange: [Math.max(3, rows - 4), Math.max(4, rows - 2)],
    },
    {
      colRange: [2, Math.max(3, Math.floor(cols * 0.35))],
      rowRange: [0, 1],
      colSpanRange: [2, 4],
      rowSpanRange: [1, 2],
    },
    {
      colRange: [Math.max(2, Math.floor(cols * 0.3)), Math.max(3, Math.floor(cols * 0.46))],
      rowRange: [Math.max(2, Math.floor(rows * 0.28)), Math.max(3, Math.floor(rows * 0.45))],
      colSpanRange: [1, 2],
      rowSpanRange: [Math.max(2, Math.floor(rows * 0.35)), Math.max(3, Math.floor(rows * 0.5))],
    },
    {
      colRange: [Math.max(4, cols - 4), Math.max(5, cols - 2)],
      rowRange: [0, 1],
      colSpanRange: [2, 3],
      rowSpanRange: [Math.max(4, rows - 4), Math.max(5, rows - 1)],
    },
    {
      colRange: [Math.max(1, Math.floor(cols * 0.18)), Math.max(2, Math.floor(cols * 0.34))],
      rowRange: [Math.max(4, rows - 3), Math.max(5, rows - 2)],
      colSpanRange: [2, 3],
      rowSpanRange: [2, 3],
    },
    {
      colRange: [Math.max(3, Math.floor(cols * 0.5)), Math.max(4, Math.floor(cols * 0.64))],
      rowRange: [Math.max(4, Math.floor(rows * 0.55)), Math.max(5, Math.floor(rows * 0.68))],
      colSpanRange: [2, 4],
      rowSpanRange: [1, 2],
    },
    {
      colRange: [Math.max(4, Math.floor(cols * 0.62)), Math.max(5, Math.floor(cols * 0.76))],
      rowRange: [1, 2],
      colSpanRange: [2, 3],
      rowSpanRange: [1, 2],
    },
  ];

  const layers = blockConfigs.map((config, index) =>
    createGridBlockLayer({
      ...config,
      cols,
      rows,
      cellSize,
      color: colors[index + 1],
    }),
  );

  return {
    background: [...layers, colors[0]].join(", "),
    cellSize,
    accent: colors[2],
  };
}

function randomizeShellBackground() {
  if (!shell) {
    return;
  }

  const body = document.body;
  const topLine = document.querySelector(".bg-line-top");
  const shellRect = shell.getBoundingClientRect();

  if (body.classList.contains("page-home")) {
    const homeBackground = buildHomePixelBackground(shellRect);

    shell.style.background = homeBackground.background;
    shell.style.setProperty("--pixel-grid-size", `${homeBackground.cellSize}px`);
    shell.style.borderTopColor = homeBackground.accent;

    if (topLine) {
      topLine.style.background = homeBackground.accent;
    }

    return;
  }

  if (body.classList.contains("page-about")) {
    const [base, leftBlock, rightBlock, topBand, bottomBand, centerBand] = pickRandomColors(6, decorPalette);

    shell.style.background = [
      createColorBlockLayer(90, randomBetween(0, 16), randomBetween(20, 34), leftBlock),
      createColorBlockLayer(90, randomBetween(70, 84), randomBetween(12, 20), rightBlock),
      createColorBlockLayer(180, randomBetween(0, 12), randomBetween(8, 16), topBand),
      createColorBlockLayer(180, randomBetween(46, 66), randomBetween(18, 28), bottomBand),
      createColorBlockLayer(90, randomBetween(26, 44), randomBetween(10, 18), centerBand),
      base,
    ].join(", ");

    shell.style.borderTopColor = topBand;

    if (topLine) {
      topLine.style.background = topBand;
    }
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

    line.textContent = "";

    [...text].forEach((character, index) => {
      const letter = document.createElement("span");
      letter.className = "hero-letter";
      letter.textContent = character;
      letter.style.setProperty("--jitter-x", `${randomBetween(-1.8, 1.8).toFixed(2)}px`);
      letter.style.setProperty("--jitter-y", `${randomBetween(-1.6, 1.6).toFixed(2)}px`);
      letter.style.setProperty("--jitter-rotate", `${randomBetween(-1.4, 1.4).toFixed(2)}deg`);
      letter.style.setProperty("--jitter-duration", `${randomBetween(2.4, 4.8).toFixed(2)}s`);
      letter.style.setProperty("--jitter-delay", `${(index * 0.05 + randomBetween(0, 0.4)).toFixed(2)}s`);
      line.append(letter);
    });

    line.dataset.jitterReady = "true";
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
  const left = randomBetween(config.leftRange[0], config.leftRange[1]);
  const top = randomBetween(config.topRange[0], config.topRange[1]);
  const color = decorPalette[Math.floor(Math.random() * decorPalette.length)];

  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.left = `${left}%`;
  element.style.top = `${top}%`;
  element.style.right = "auto";
  element.style.bottom = "auto";
  element.style.background = color;
  element.dataset.baseTransform = "";
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
          homePastelPalette,
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
    const aboutConfigs = [
      {
        sizeRange: [0.14, 0.22],
        pixelRange: [110, 210],
        leftRange: [48, 62],
        topRange: [4, 16],
      },
      {
        sizeRange: [0.1, 0.16],
        pixelRange: [90, 150],
        leftRange: [76, 86],
        topRange: [16, 30],
      },
      {
        sizeRange: [0.12, 0.18],
        pixelRange: [100, 170],
        leftRange: [50, 64],
        topRange: [72, 82],
      },
    ];

    aboutSquares.forEach((square, index) => {
      setSquareStyles(square, remixRect, aboutConfigs[index] || aboutConfigs[aboutConfigs.length - 1]);
    });
  }
}

function animateParallax() {
  currentX += (targetX - currentX) * 0.08;
  currentY += (targetY - currentY) * 0.08;

  shapes.forEach((shape) => {
    const depth = Number(shape.dataset.depth || 12);
    const moveX = currentX / depth;
    const moveY = currentY / depth;
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
  randomizeShellBackground();
  randomizeDecorSquares();

  shell.addEventListener("mousemove", (event) => {
    const rect = shell.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;

    targetX = ((relativeX / rect.width) - 0.5) * 32;
    targetY = ((relativeY / rect.height) - 0.5) * 32;
  });

  shell.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
  });

  animateParallax();
}

const portfolioGrid = document.getElementById("portfolioPostGrid");
const portfolioLightbox = document.getElementById("portfolioLightbox");
const portfolioLightboxImage = document.getElementById("portfolioLightboxImage");
const portfolioLightboxCaption = document.getElementById("portfolioLightboxCaption");
const portfolioLightboxTitle = document.getElementById("portfolioLightboxTitle");
const portfolioLightboxMeta = document.getElementById("portfolioLightboxMeta");
const portfolioLightboxCounter = document.getElementById("portfolioLightboxCounter");
const portfolioLightboxPrev = document.getElementById("portfolioLightboxPrev");
const portfolioLightboxNext = document.getElementById("portfolioLightboxNext");
const portfolioLightboxClose = document.getElementById("portfolioLightboxClose");
const portfolioData = Array.isArray(window.portfolioItems)
  ? window.portfolioItems
      .map((item) => {
        if (!item?.title) {
          return null;
        }

        const images = (Array.isArray(item.images) ? item.images : item.image ? [{ src: item.image, alt: item.alt, caption: item.text }] : [])
          .map((image, index) => {
            if (typeof image === "string") {
              return {
                src: image,
                alt: `${item.title} image ${index + 1}`,
                caption: "",
              };
            }

            if (!image?.src) {
              return null;
            }

            return {
              src: image.src,
              alt: image.alt || `${item.title} image ${index + 1}`,
              caption: image.caption || "",
            };
          })
          .filter(Boolean);

        if (!images.length) {
          return null;
        }

        return {
          title: item.title,
          text: item.text || "",
          madeIn: Array.isArray(item.madeIn) ? item.madeIn.filter(Boolean) : item.madeIn ? [item.madeIn] : [],
          images,
        };
      })
      .filter(Boolean)
  : [];

function buildPortfolioSoftware(item) {
  return item.madeIn.length ? `Made in: ${item.madeIn.join(", ")}` : "";
}

function createPortfolioPost(item, index) {
  const post = document.createElement("button");
  post.className = "portfolio-post";
  post.type = "button";
  post.dataset.portfolioIndex = String(index);

  const imageShell = document.createElement("span");
  imageShell.className = "portfolio-post-image";

  const image = document.createElement("img");
  image.src = item.images[0].src;
  image.alt = item.images[0].alt || `${item.title} portfolio image`;
  imageShell.append(image);

  if (item.images.length > 1) {
    const counter = document.createElement("span");
    counter.className = "portfolio-post-counter";
    counter.textContent = `${item.images.length} photos`;
    imageShell.append(counter);
  }

  const copy = document.createElement("span");
  copy.className = "portfolio-post-copy";

  const title = document.createElement("span");
  title.className = "portfolio-post-title";
  title.textContent = item.title;
  copy.append(title);

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

if (
  portfolioGrid &&
  portfolioLightbox &&
  portfolioLightboxImage &&
  portfolioLightboxCaption &&
  portfolioLightboxTitle &&
  portfolioLightboxMeta &&
  portfolioLightboxCounter
) {
  if (!portfolioData.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "portfolio-empty";
    emptyState.textContent = "Add portfolio items in portfolio-data.js to show your work here.";
    portfolioGrid.append(emptyState);
  } else {
    portfolioData.forEach((item, index) => {
      portfolioGrid.append(createPortfolioPost(item, index));
    });
  }

  const portfolioPosts = Array.from(document.querySelectorAll(".portfolio-post"));
  let activePortfolioIndex = 0;
  let activePortfolioImageIndex = 0;

  function renderPortfolioLightbox(postIndex, imageIndex = 0) {
    activePortfolioIndex = (postIndex + portfolioData.length) % portfolioData.length;
    const activePost = portfolioData[activePortfolioIndex];
    activePortfolioImageIndex = (imageIndex + activePost.images.length) % activePost.images.length;
    const activeImage = activePost.images[activePortfolioImageIndex];

    portfolioLightboxImage.src = activeImage.src;
    portfolioLightboxImage.alt = activeImage.alt;
    portfolioLightboxTitle.textContent = activePost.title;
    portfolioLightboxMeta.textContent = buildPortfolioSoftware(activePost);
    portfolioLightboxCaption.textContent = activeImage.caption || activePost.text || "Selected Work";
    portfolioLightboxCounter.textContent =
      activePost.images.length > 1 ? `${activePortfolioImageIndex + 1} / ${activePost.images.length}` : "1 / 1";
    portfolioLightboxPrev.hidden = activePost.images.length <= 1;
    portfolioLightboxNext.hidden = activePost.images.length <= 1;
  }

  function openPortfolioLightbox(index) {
    renderPortfolioLightbox(index, 0);
    portfolioLightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closePortfolioLightbox() {
    portfolioLightbox.hidden = true;
    document.body.style.overflow = "";
  }

  portfolioPosts.forEach((post) => {
    post.addEventListener("click", () => {
      openPortfolioLightbox(Number(post.dataset.portfolioIndex || 0));
    });
  });

  portfolioLightboxPrev?.addEventListener("click", () => {
    renderPortfolioLightbox(activePortfolioIndex, activePortfolioImageIndex - 1);
  });

  portfolioLightboxNext?.addEventListener("click", () => {
    renderPortfolioLightbox(activePortfolioIndex, activePortfolioImageIndex + 1);
  });

  portfolioLightboxClose?.addEventListener("click", closePortfolioLightbox);

  portfolioLightbox.addEventListener("click", (event) => {
    if (event.target === portfolioLightbox) {
      closePortfolioLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (portfolioLightbox.hidden || !portfolioData.length) {
      return;
    }

    if (event.key === "Escape") {
      closePortfolioLightbox();
    }

    if (event.key === "ArrowLeft") {
      renderPortfolioLightbox(activePortfolioIndex, activePortfolioImageIndex - 1);
    }

    if (event.key === "ArrowRight") {
      renderPortfolioLightbox(activePortfolioIndex, activePortfolioImageIndex + 1);
    }
  });
}

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
