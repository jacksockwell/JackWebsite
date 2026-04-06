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
