import { animate, inView, stagger } from "motion";

export function initScrollMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  inView("[data-motion]", (element) => {
    const children = element.matches(".project-grid, .steps-list, .service-list, [data-motion-stagger]")
      ? element.children
      : [element];

    animate(children, { opacity: [0, 1], y: [18, 0] }, { duration: 0.55, delay: stagger(0.06), easing: "ease-out" });
  }, { amount: 0.18, margin: "0px 0px -80px 0px" });
}
