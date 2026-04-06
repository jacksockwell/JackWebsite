const shell = document.getElementById("siteShell");
const shapes = document.querySelectorAll(".shape");
const panels = document.querySelectorAll(".parallax-panel");
const sectionPanels = document.querySelectorAll("[data-section]");
const openButtons = document.querySelectorAll("[data-section-target]");
const closeButtons = document.querySelectorAll("[data-close-section]");

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

const shapeRotations = new Map([
  ["shape-coral", -12],
  ["shape-sky", 11],
  ["shape-cream", 14],
  ["shape-gold", -8],
]);

function setActiveSection(sectionId) {
  sectionPanels.forEach((panel) => {
    const isOpen = panel.id === sectionId;
    panel.classList.toggle("is-open", isOpen);
  });
}

openButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveSection(button.dataset.sectionTarget);
  });
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveSection("");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setActiveSection("");
  }
});

function animateParallax() {
  currentX += (targetX - currentX) * 0.08;
  currentY += (targetY - currentY) * 0.08;

  shapes.forEach((shape) => {
    const depth = Number(shape.dataset.depth || 10);
    const moveX = currentX / depth;
    const moveY = currentY / depth;
    const rotationClass = Array.from(shape.classList).find((className) => shapeRotations.has(className));
    const rotation = shapeRotations.get(rotationClass) || 0;
    shape.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${rotation}deg)`;
  });

  panels.forEach((panel) => {
    const depth = Number(panel.dataset.depth || 10);
    const moveX = currentX / depth;
    const moveY = currentY / depth;
    const image = panel.querySelector("img");

    if (image) {
      image.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px)) scale(1.03)`;
    }
  });

  requestAnimationFrame(animateParallax);
}

shell.addEventListener("mousemove", (event) => {
  const rect = shell.getBoundingClientRect();
  const relativeX = event.clientX - rect.left;
  const relativeY = event.clientY - rect.top;

  targetX = ((relativeX / rect.width) - 0.5) * 36;
  targetY = ((relativeY / rect.height) - 0.5) * 36;
});

shell.addEventListener("mouseleave", () => {
  targetX = 0;
  targetY = 0;
});

animateParallax();
