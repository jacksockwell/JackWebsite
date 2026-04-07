const shell = document.getElementById("siteShell");
const shapes = document.querySelectorAll(".bg-block, .bg-line, .about-floating");
const panels = document.querySelectorAll(".parallax-panel");

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

const decorPalette = ["#ff0037", "#00ff2a", "#fbff00", "#ffac12", "#ff0f7b", "#1fdcff"];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  element.style.background = `linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(0, 0, 0, 0.03)), ${color}`;
  element.dataset.baseTransform = "";
}

function randomizeDecorSquares() {
  const shellSquares = Array.from(document.querySelectorAll(".bg-block, .bg-line-right"));
  const aboutRemix = document.querySelector(".about-remix");
  const aboutSquares = Array.from(document.querySelectorAll(".about-floating"));

  if (shell && shellSquares.length) {
    const shellRect = shell.getBoundingClientRect();
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
const portfolioLightboxPrev = document.getElementById("portfolioLightboxPrev");
const portfolioLightboxNext = document.getElementById("portfolioLightboxNext");
const portfolioLightboxClose = document.getElementById("portfolioLightboxClose");
const portfolioData = Array.isArray(window.portfolioItems)
  ? window.portfolioItems.filter((item) => item?.image && item?.title)
  : [];

function buildPortfolioCaption(item) {
  return [item.title, item.text].filter(Boolean).join(" / ");
}

function createPortfolioPost(item, index) {
  const post = document.createElement("button");
  post.className = "portfolio-post";
  post.type = "button";
  post.dataset.portfolioIndex = String(index);

  const imageShell = document.createElement("span");
  imageShell.className = "portfolio-post-image";

  const image = document.createElement("img");
  image.src = item.image;
  image.alt = item.alt || `${item.title} portfolio image`;
  imageShell.append(image);

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

  post.append(imageShell, copy);

  return post;
}

if (portfolioGrid && portfolioLightbox && portfolioLightboxImage && portfolioLightboxCaption) {
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
  const portfolioImages = portfolioData.map((item) => ({
    src: item.image,
    alt: item.alt || `${item.title} portfolio image`,
    caption: buildPortfolioCaption(item),
  }));

  let activePortfolioIndex = 0;

  function renderPortfolioLightbox(index) {
    activePortfolioIndex = (index + portfolioImages.length) % portfolioImages.length;
    const activeImage = portfolioImages[activePortfolioIndex];

    portfolioLightboxImage.src = activeImage.src;
    portfolioLightboxImage.alt = activeImage.alt;
    portfolioLightboxCaption.textContent = activeImage.caption || "Selected Work";
  }

  function openPortfolioLightbox(index) {
    renderPortfolioLightbox(index);
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
    renderPortfolioLightbox(activePortfolioIndex - 1);
  });

  portfolioLightboxNext?.addEventListener("click", () => {
    renderPortfolioLightbox(activePortfolioIndex + 1);
  });

  portfolioLightboxClose?.addEventListener("click", closePortfolioLightbox);

  portfolioLightbox.addEventListener("click", (event) => {
    if (event.target === portfolioLightbox) {
      closePortfolioLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (portfolioLightbox.hidden || !portfolioImages.length) {
      return;
    }

    if (event.key === "Escape") {
      closePortfolioLightbox();
    }

    if (event.key === "ArrowLeft") {
      renderPortfolioLightbox(activePortfolioIndex - 1);
    }

    if (event.key === "ArrowRight") {
      renderPortfolioLightbox(activePortfolioIndex + 1);
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
