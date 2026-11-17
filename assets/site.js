"use strict";

const page = document.documentElement;
const topBar = document.querySelector(".site-header");
const sectionNav = document.querySelector("#chapter-nav");
const sectionLinks = Array.from(sectionNav.querySelectorAll("a"));
const resumeSections = sectionLinks.map(link => document.querySelector(link.hash));
const menuButton = document.querySelector(".menu-toggle");
const phoneLayout = window.matchMedia("(max-width: 820px)");

page.classList.add("js");

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
}

function setUpMenu() {
  menuButton.hidden = !phoneLayout.matches;
  closeMenu();
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
});

sectionNav.addEventListener("click", event => {
  const link = event.target.closest("a");
  if (link && phoneLayout.matches) {
    closeMenu();
    const sectionHeading = document.querySelector(link.hash).querySelector("h2");
    sectionHeading.tabIndex = -1;
    sectionHeading.focus({ preventScroll: true });
  }
});

document.addEventListener("click", event => {
  if (!topBar.contains(event.target)) closeMenu();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menuButton.focus();
  }
});

phoneLayout.addEventListener("change", setUpMenu);
setUpMenu();

const cover = document.querySelector("#hero");
const pauseButton = document.querySelector(".motion-toggle");
const pauseText = pauseButton.querySelector("[data-motion-label]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(pointer: fine)");
let coverPaused = false;
let scrollQueued = false;
let activeSection = -1;

function updatePageScroll() {
  scrollQueued = false;

  const scrollTop = window.scrollY;
  const scrollRoom = page.scrollHeight - window.innerHeight;
  const progress = scrollRoom > 0 ? Math.min(1, Math.max(0, scrollTop / scrollRoom)) : 0;
  page.style.setProperty("--read-progress", String(progress));

  const readingLine = Math.max(topBar.offsetHeight + 50, window.innerHeight * .26);
  const sectionInView = resumeSections.findLastIndex(section => section.getBoundingClientRect().top <= readingLine);
  if (sectionInView !== activeSection) {
    sectionLinks[activeSection]?.removeAttribute("aria-current");
    sectionLinks[sectionInView]?.setAttribute("aria-current", "location");
    activeSection = sectionInView;
  }

  if (!coverPaused && !reduceMotion.matches) {
    const coverOffset = Math.min(17, Math.max(0, scrollTop * .055));
    cover.style.setProperty("--cover-scroll", coverOffset + "px");
  }
}

function queueScrollUpdate() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(updatePageScroll);
}

let revealOnScroll;
if ("IntersectionObserver" in window) {
  revealOnScroll = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealOnScroll.unobserve(entry.target);
      }
    }
  }, { threshold: .08 });

  document.querySelectorAll("[data-reveal]").forEach(part => revealOnScroll.observe(part));
}

function updateMotion() {
  const motionOff = coverPaused || reduceMotion.matches;
  page.classList.toggle("motion-ready", !motionOff && Boolean(revealOnScroll));
  page.classList.toggle("motion-paused", motionOff);
  pauseText.textContent = coverPaused ? "Resume motion" : "Pause motion";
  pauseButton.hidden = reduceMotion.matches;
  if (motionOff) {
    cover.style.removeProperty("--cover-x");
    cover.style.removeProperty("--cover-y");
    cover.style.removeProperty("--cover-scroll");
  }
  queueScrollUpdate();
}

pauseButton.addEventListener("click", () => {
  coverPaused = !coverPaused;
  updateMotion();
});
reduceMotion.addEventListener("change", updateMotion);
window.addEventListener("scroll", queueScrollUpdate, { passive: true });
window.addEventListener("resize", queueScrollUpdate, { passive: true });

cover.addEventListener("pointermove", event => {
  if (coverPaused || reduceMotion.matches || !finePointer.matches) return;
  const coverBox = cover.getBoundingClientRect();
  const fromCentreX = (event.clientX - coverBox.left) / coverBox.width - .5;
  const fromCentreY = (event.clientY - coverBox.top) / coverBox.height - .5;
  cover.style.setProperty("--cover-x", (fromCentreX * 21).toFixed(1) + "px");
  cover.style.setProperty("--cover-y", (fromCentreY * 10).toFixed(1) + "px");
});

cover.addEventListener("pointerleave", () => {
  cover.style.removeProperty("--cover-x");
  cover.style.removeProperty("--cover-y");
});

updateMotion();

const workFilter = document.querySelector(".work-filters");
const topicButtons = Array.from(workFilter.querySelectorAll("button"));
const projectCount = document.querySelector("#project-status");
const workCards = Array.from(document.querySelectorAll(".project-card"));

workFilter.addEventListener("submit", event => {
  event.preventDefault();
  const topic = event.submitter?.value ?? "all";
  let cardsShown = 0;

  for (const card of workCards) {
    const showCard = topic === "all" || topic === card.dataset.category;
    card.hidden = !showCard;
    if (showCard) cardsShown += 1;
  }

  for (const topicButton of topicButtons) {
    topicButton.setAttribute("aria-pressed", String(topicButton.value === topic));
  }

  projectCount.textContent = cardsShown === 1 ? "1 project shown." : cardsShown + " projects shown.";
  queueScrollUpdate();
});
workFilter.hidden = false;

const projectPopup = document.querySelector("#project-dialog");

if (typeof projectPopup.showModal === "function") {
  const popupTitle = projectPopup.querySelector("#dialog-title");
  const popupPhoto = projectPopup.querySelector(".dialog-image");
  const popupText = projectPopup.querySelector(".dialog-body");
  const popupButtons = projectPopup.querySelector(".dialog-nav");
  let projectIndex = 0;
  let filteredCards = [];
  let clickedSummary;

  // The pop-up uses the same text as the card's expandable details.
  function showProject(index) {
    projectIndex = index;
    const card = filteredCards[projectIndex];
    popupTitle.textContent = card.querySelector(".project-title").textContent;
    const photo = card.querySelector(".project-image img").cloneNode(true);
    photo.loading = "eager";
    popupPhoto.replaceChildren(photo);
    popupText.replaceChildren(card.querySelector(".project-detail").cloneNode(true));
    popupButtons.hidden = filteredCards.length <= 1;
    projectPopup.scrollTop = 0;
  }

  function changeProject(direction) {
    const count = filteredCards.length;
    if (count <= 1) return;
    showProject((projectIndex + direction + count) % count);
    popupTitle.focus({ preventScroll: true });
  }

  for (const card of workCards) {
    const summary = card.querySelector(".project-notes summary");
    summary.setAttribute("aria-haspopup", "dialog");
    summary.setAttribute("aria-controls", projectPopup.id);
    summary.addEventListener("click", event => {
      event.preventDefault();
      clickedSummary = summary;
      filteredCards = workCards.filter(workCard => !workCard.hidden);
      showProject(filteredCards.indexOf(card));
      projectPopup.showModal();
    });
  }

  popupButtons.addEventListener("click", event => {
    const arrowButton = event.target.closest("[data-step]");
    if (arrowButton) changeProject(Number(arrowButton.dataset.step));
  });

  projectPopup.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      changeProject(event.key === "ArrowLeft" ? -1 : 1);
    }
  });

  projectPopup.addEventListener("click", event => {
    if (event.target === projectPopup) projectPopup.close();
  });

  projectPopup.addEventListener("close", () => {
    clickedSummary?.focus({ preventScroll: true });
  });
}
