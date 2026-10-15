import { animate, inView, stagger } from "motion";

export function initScrollMotion(selector = "[data-motion]") {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const getTargets = (element) => element.matches(".project-grid, .steps-list, .service-list, [data-motion-stagger]")
    ? Array.from(element.children)
    : [element];

  const enteringElements = Array.from(document.querySelectorAll(selector)).filter((element) => {
    const { top, bottom } = element.getBoundingClientRect();
    const visibleAtStart = top < window.innerHeight && bottom > 0;
    if (visibleAtStart && !element.hasAttribute("data-motion-initial")) return false;
    if (bottom <= 0) return false;

    if (!visibleAtStart) {
      getTargets(element).forEach((target) => { target.style.opacity = "0"; });
    }
    return true;
  });

  inView(enteringElements, (element) => {
    const targets = getTargets(element);
    animate(targets, { opacity: [0, 1], y: [18, 0] }, { duration: 0.55, delay: stagger(0.06), easing: "ease-out" })
      .then(() => targets.forEach((target) => { target.style.opacity = "1"; }));
  }, { amount: "some", margin: "0px 0px -80px 0px" });
}
