import { initScrollMotion } from "./scroll-motion.js";

document.querySelector(".case-next video")?.play().catch(() => {});

const gallery = document.querySelector("[data-case-gallery]");
if (gallery) {
  const viewport = gallery.querySelector(".case-gallery-viewport");
  const track = gallery.querySelector(".case-gallery-track");
  const slides = Array.from(gallery.querySelectorAll(".case-gallery-item"));
  const dots = Array.from(gallery.querySelectorAll("[data-gallery-dot]"));
  const previous = document.querySelector("[data-gallery-prev]");
  const next = document.querySelector("[data-gallery-next]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let scrollFrame = 0;

  const slideOffset = (index) => slides[index].offsetLeft - slides[0].offsetLeft;

  function setActiveSlide(index) {
    activeIndex = index;
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    gallery.classList.toggle("is-at-end", next.disabled);
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
      if (dotIndex === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  function goToSlide(index) {
    const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
    viewport.scrollTo({
      left: slideOffset(nextIndex),
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
    setActiveSlide(nextIndex);
  }

  function syncActiveSlide() {
    const closestIndex = slides.reduce((closest, slide, index) => (
      Math.abs(slideOffset(index) - viewport.scrollLeft) < Math.abs(slideOffset(closest) - viewport.scrollLeft)
        ? index
        : closest
    ), 0);
    setActiveSlide(closestIndex);
  }

  function measureGallery() {
    track.style.setProperty("--case-gallery-trailing-space", `${Math.max(0, viewport.clientWidth - slides[0].clientWidth)}px`);
    viewport.scrollLeft = slideOffset(activeIndex);
    syncActiveSlide();
  }

  previous.addEventListener("click", () => goToSlide(activeIndex - 1));
  next.addEventListener("click", () => goToSlide(activeIndex + 1));
  dots.forEach((dot, index) => dot.addEventListener("click", () => goToSlide(index)));
  viewport.addEventListener("scroll", () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(syncActiveSlide);
  }, { passive: true });
  viewport.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    goToSlide(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
  });
  window.addEventListener("resize", measureGallery);
  measureGallery();
}

initScrollMotion();
