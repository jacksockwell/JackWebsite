const frame = document.getElementById('siteFrame');
const items = document.querySelectorAll('.parallax-card, .shape');

let mouseX = 0;
let mouseY = 0;
let currentX = 0;
let currentY = 0;

function animate() {
  currentX += (mouseX - currentX) * 0.08;
  currentY += (mouseY - currentY) * 0.08;

  items.forEach((item) => {
    const depth = Number(item.dataset.depth || 10);
    const moveX = currentX / depth;
    const moveY = currentY / depth;

    if (item.classList.contains('parallax-card')) {
      const img = item.querySelector('img');
      if (img) {
        img.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px)) scale(1.035)`;
      }
    } else {
      const rotation =
        item.classList.contains('shape-red') ? ' rotate(9deg)' :
        item.classList.contains('shape-green') ? ' rotate(-11deg)' :
        item.classList.contains('shape-white') ? ' rotate(8deg)' : '';
      item.style.transform = `translate(${moveX}px, ${moveY}px)` + rotation;
    }
  });

  requestAnimationFrame(animate);
}

frame.addEventListener('mousemove', (e) => {
  const rect = frame.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  mouseX = ((x / rect.width) - 0.5) * 26;
  mouseY = ((y / rect.height) - 0.5) * 26;
});

frame.addEventListener('mouseleave', () => {
  mouseX = 0;
  mouseY = 0;
});

animate();
