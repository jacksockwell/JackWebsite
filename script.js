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

const portfolioPosts = Array.from(document.querySelectorAll(".portfolio-post"));
const portfolioLightbox = document.getElementById("portfolioLightbox");
const portfolioLightboxImage = document.getElementById("portfolioLightboxImage");
const portfolioLightboxCaption = document.getElementById("portfolioLightboxCaption");
const portfolioLightboxPrev = document.getElementById("portfolioLightboxPrev");
const portfolioLightboxNext = document.getElementById("portfolioLightboxNext");
const portfolioLightboxClose = document.getElementById("portfolioLightboxClose");

if (portfolioPosts.length && portfolioLightbox && portfolioLightboxImage && portfolioLightboxCaption) {
  const portfolioImages = portfolioPosts.map((post) => {
    const image = post.querySelector("img");
    const title = post.querySelector(".portfolio-post-title");
    const meta = post.querySelector(".portfolio-post-meta");

    return {
      src: image?.getAttribute("src") || "",
      alt: image?.getAttribute("alt") || "Portfolio image",
      caption: [title?.textContent, meta?.textContent].filter(Boolean).join(" / "),
    };
  });

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

  portfolioPosts.forEach((post, index) => {
    post.addEventListener("click", () => {
      openPortfolioLightbox(index);
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
    if (portfolioLightbox.hidden) {
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
