import { animate, inView, stagger } from "motion";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const siteHeader = document.querySelector(".site-header");
const navShell = document.querySelector(".nav-shell");
const navToggle = document.querySelector(".nav-toggle");
const navMenuPanel = document.querySelector(".nav-scroll");
const scrollThreshold = 150;
let currentNavType = siteHeader?.dataset.navType || "fix";

function updateNavigationType() {
  if (!siteHeader || siteHeader.dataset.navType === "project") return;
  const nextNavType = window.scrollY > scrollThreshold ? "scroll" : "fix";
  if (nextNavType === currentNavType) return;

  siteHeader.dataset.navType = nextNavType;

  if (!prefersReducedMotion && navShell) {
    animate(
      navShell,
      {
        opacity: [0.92, 1],
        y: nextNavType === "scroll" ? [-4, 0] : [4, 0],
        scale: nextNavType === "scroll" ? [0.985, 1] : [1.01, 1],
      },
      { duration: 2, easing: [0.16, 1, 0.3, 1] },
    );
  }

  currentNavType = nextNavType;
}

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navMenuPanel?.classList.toggle("is-open", !isOpen);
});

document.querySelectorAll(".nav-links a, .nav-contact").forEach((link) => {
  link.addEventListener("click", () => {
    navToggle?.setAttribute("aria-expanded", "false");
    navMenuPanel?.classList.remove("is-open");
  });
});

window.addEventListener("scroll", updateNavigationType, { passive: true });
updateNavigationType();

const chips = document.querySelectorAll("[data-filter]");
const projects = document.querySelectorAll(".project-card");

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const filter = chip.dataset.filter;
    chips.forEach((item) => item.classList.toggle("is-active", item === chip));
    projects.forEach((project) => {
      const visible = filter === "all" || project.dataset.category === filter;
      project.hidden = !visible;
      if (!prefersReducedMotion && visible) {
        animate(project, { opacity: [0, 1], y: [14, 0] }, { duration: 0.32, easing: "ease-out" });
      }
    });
  });
});

const viewport = document.querySelector(".testimonial-viewport");
const track = document.querySelector(".testimonial-track");
const dots = document.querySelectorAll(".carousel-dots span");
let carouselIndex = 0;

function updateCarousel(direction = 1) {
  if (!track || !viewport) return;
  const firstCard = track.querySelector(".testimonial-card");
  const cardWidth = firstCard ? firstCard.getBoundingClientRect().width + 16 : 416;
  const visibleCards = Math.max(1, Math.floor(viewport.clientWidth / cardWidth));
  const maxIndex = Math.max(0, track.children.length - visibleCards);
  carouselIndex = Math.min(Math.max(carouselIndex + direction, 0), maxIndex);
  track.style.transform = `translateX(${carouselIndex * -cardWidth}px)`;
  const activeDot = carouselIndex > 0 ? 1 : 0;
  dots.forEach((dot, index) => dot.classList.toggle("is-active", index === activeDot));
}

document.querySelector("[data-carousel='prev']")?.addEventListener("click", () => updateCarousel(-1));
document.querySelector("[data-carousel='next']")?.addEventListener("click", () => updateCarousel(1));
window.addEventListener("resize", () => updateCarousel(0));

if (!prefersReducedMotion) {
  inView("[data-motion]", (element) => {
    const children = element.matches(".project-grid, .steps-list, .service-list")
      ? element.children
      : [element];
    animate(children, { opacity: [0, 1], y: [18, 0] }, { duration: 0.55, delay: stagger(0.06), easing: "ease-out" });
  }, { amount: 0.18, margin: "0px 0px -80px 0px" });
}
