import { initI18n, t } from "./i18n.js";
import "./analytics-tracker.js";
import { initScrollMotion } from "./scroll-motion.js";

initI18n();

document.querySelector(".case-next video")?.play().catch(() => {});

const gallery = document.querySelector("[data-case-gallery]");
if (gallery) {
  const viewport = gallery.querySelector(".case-gallery-viewport");
  const shell = gallery.querySelector(".case-gallery-shell");
  const track = gallery.querySelector(".case-gallery-track");
  const slides = Array.from(gallery.querySelectorAll(".case-gallery-item"));
  const dotsContainer = gallery.querySelector(".case-gallery-dots");
  const dots = slides.map((slide, index) => {
    slide.id = `${viewport.id}-image-${index + 1}`;
    slide.setAttribute("aria-label", t("case.gallery.slide", { index: index + 1, total: slides.length }));
    slide.querySelector("[data-gallery-zoom]")?.setAttribute("aria-label", t("case.gallery.enlarge", { index: index + 1, total: slides.length }));

    const dot = document.createElement("button");
    dot.type = "button";
    dot.dataset.galleryDot = String(index);
    dot.setAttribute("aria-label", t("case.gallery.dot", { index: index + 1, total: slides.length }));
    dot.setAttribute("aria-controls", slide.id);
    dotsContainer.append(dot);
    return dot;
  });
  const previous = document.querySelector("[data-gallery-prev]");
  const next = document.querySelector("[data-gallery-next]");
  const zoomDialog = document.querySelector(".case-gallery-dialog");
  const zoomView = zoomDialog.querySelector(".case-gallery-dialog-view");
  const zoomButton = zoomDialog.querySelector(".case-gallery-dialog-image");
  const zoomImage = zoomButton.querySelector("img");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let scrollFrame = 0;
  let zoomTrigger = null;

  function updateGalleryLanguage() {
    slides.forEach((slide, index) => {
      const values = { index: index + 1, total: slides.length };
      slide.setAttribute("aria-label", t("case.gallery.slide", values));
      slide.querySelector("[data-gallery-zoom]")?.setAttribute("aria-label", t("case.gallery.enlarge", values));
      dots[index].setAttribute("aria-label", t("case.gallery.dot", values));
    });
    const zoomLabel = t(zoomDialog.classList.contains("is-zoomed") ? "case.gallery.zoomOut" : "case.gallery.zoomIn");
    zoomButton.setAttribute("aria-label", zoomLabel);
    zoomButton.title = zoomLabel;
    if (zoomDialog.open && zoomTrigger) zoomImage.alt = zoomTrigger.querySelector("img").alt;
  }

  window.addEventListener("localechange", updateGalleryLanguage);
  updateGalleryLanguage();

  const slideOffset = (index) => slides[index].offsetLeft - slides[0].offsetLeft;

  function setActiveSlide(index) {
    activeIndex = index;
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
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
    shell.classList.toggle("has-next", viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 2);
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

  gallery.querySelectorAll("[data-gallery-zoom]").forEach((button) => {
    button.addEventListener("click", () => {
      const image = button.querySelector("img");
      zoomTrigger = button;
      zoomImage.src = image.currentSrc || image.src;
      zoomImage.alt = image.alt;
      zoomDialog.classList.remove("is-zoomed");
      zoomButton.setAttribute("aria-pressed", "false");
      updateGalleryLanguage();
      zoomView.scrollTo(0, 0);
      document.documentElement.classList.add("is-gallery-zoomed");
      zoomDialog.showModal();
    });
  });

  zoomButton.addEventListener("click", () => {
    const isZoomed = zoomDialog.classList.toggle("is-zoomed");
    zoomButton.setAttribute("aria-pressed", String(isZoomed));
    updateGalleryLanguage();
    zoomView.scrollTo(isZoomed ? (zoomView.scrollWidth - zoomView.clientWidth) / 2 : 0, 0);
  });

  zoomDialog.querySelector(".case-gallery-dialog-close").addEventListener("click", () => zoomDialog.close());
  zoomDialog.addEventListener("click", (event) => {
    if (event.target === zoomDialog) zoomDialog.close();
  });
  zoomDialog.addEventListener("close", () => {
    document.documentElement.classList.remove("is-gallery-zoomed");
    zoomImage.removeAttribute("src");
    zoomImage.alt = "";
    zoomTrigger?.focus();
  });
}

initScrollMotion();
