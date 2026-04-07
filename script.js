const shell = document.getElementById("siteShell");
const shapes = document.querySelectorAll(".bg-block, .bg-line");
const panels = document.querySelectorAll(".parallax-panel");

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

const baseTransforms = new Map([
  ["bg-block-pink", "rotate(-12deg)"],
  ["bg-block-green", "rotate(10deg)"],
  ["bg-block-yellow", "rotate(-8deg)"],
  ["bg-line-right", "skew(-16deg)"],
]);

function animateParallax() {
  currentX += (targetX - currentX) * 0.08;
  currentY += (targetY - currentY) * 0.08;

  shapes.forEach((shape) => {
    const depth = Number(shape.dataset.depth || 12);
    const moveX = currentX / depth;
    const moveY = currentY / depth;
    const transformClass = Array.from(shape.classList).find((className) => baseTransforms.has(className));
    const baseTransform = baseTransforms.get(transformClass) || "";
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
