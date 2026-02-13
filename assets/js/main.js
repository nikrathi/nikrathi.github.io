(function () {
  const body = document.body;
  const activeNav = body.dataset.nav;

  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
  navLinks.forEach((link) => {
    if (link.dataset.navLink === activeNav) {
      link.setAttribute("aria-current", "page");
    }
  });

  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.getElementById("primary-menu");
  if (header && navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = header.dataset.menuOpen === "true";
      header.dataset.menuOpen = String(!isOpen);
      navToggle.setAttribute("aria-expanded", String(!isOpen));
    });

    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        header.dataset.menuOpen = "false";
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const revealNodes = Array.from(document.querySelectorAll("[data-reveal]"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealElement = (node) => node.classList.add("is-visible");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach(revealElement);
  } else {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealElement(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealNodes.forEach((node) => observer.observe(node));
  }

  const headshot = document.querySelector("[data-headshot]");
  if (headshot) {
    const portraitCard = headshot.closest(".portrait-card");
    const useFallback = () => {
      if (portraitCard) {
        portraitCard.classList.add("is-fallback");
      }
    };

    headshot.addEventListener("error", useFallback);
    if (headshot.complete && headshot.naturalWidth === 0) {
      useFallback();
    }
  }
})();
