const seen = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add("in");
    seen.unobserve(entry.target);
  }
}, { threshold: 0.15 });

export function reveal(nodes) {
  nodes.forEach((node, i) => {
    node.classList.add("reveal");
    node.style.setProperty("--i", i);
    seen.observe(node);
  });
}
