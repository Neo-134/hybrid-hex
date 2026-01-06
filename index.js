/* -----------------------------------------
  Have focus outline only for keyboard users 
 ---------------------------------------- */

const handleFirstTab = (e) => {
  if(e.key === 'Tab') {
    document.body.classList.add('user-is-tabbing')

    window.removeEventListener('keydown', handleFirstTab)
    window.addEventListener('mousedown', handleMouseDownOnce)
  }

}

const handleMouseDownOnce = () => {
  document.body.classList.remove('user-is-tabbing')

  window.removeEventListener('mousedown', handleMouseDownOnce)
  window.addEventListener('keydown', handleFirstTab)
}

window.addEventListener('keydown', handleFirstTab)

const backToTopButton = document.querySelector(".back-to-top");
let isBackToTopRendered = false;

let alterStyles = (isBackToTopRendered) => {
  backToTopButton.style.visibility = isBackToTopRendered ? "visible" : "hidden";
  backToTopButton.style.opacity = isBackToTopRendered ? 1 : 0;
  backToTopButton.style.transform = isBackToTopRendered
    ? "scale(1)"
    : "scale(0)";
};

window.addEventListener("scroll", () => {
  if (window.scrollY > 700) {
    isBackToTopRendered = true;
    alterStyles(isBackToTopRendered);
  } else {
    isBackToTopRendered = false;
    alterStyles(isBackToTopRendered);
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".carousel-track");
  const items = Array.from(track.children);
  const prevBtn = document.querySelector(".carousel-btn.prev");
  const nextBtn = document.querySelector(".carousel-btn.next");
  const section = document.querySelector(".carousel");
  let currentIndex = 0;

  // Convert all iframe src -> data-src
  const iframes = items.map(item => item.querySelector("iframe"));
  iframes.forEach(iframe => {
    const src = iframe.getAttribute("src");
    if (src && !iframe.dataset.src) {
      iframe.dataset.src = src;
      iframe.removeAttribute("src");
    }
  });

  // --- Carousel Functions ---
  function updateCarousel() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Ensure target iframe starts loading immediately
    const iframe = iframes[currentIndex];
    if (iframe && !iframe.src) {
      iframe.src = iframe.dataset.src;
      iframe.dataset.loaded = "true";
    }
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % items.length;
    updateCarousel();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateCarousel();
  }

  prevBtn.addEventListener("click", showPrev);
  nextBtn.addEventListener("click", showNext);

  // --- Sequential Loader ---
  async function loadIframeSequentially(startIndex = 0) {
    for (let i = startIndex; i < iframes.length; i++) {
      const iframe = iframes[i];
      if (!iframe || iframe.dataset.loaded === "true") continue;

      iframe.src = iframe.dataset.src;
      iframe.dataset.loaded = "true";

      // Wait a bit before moving to the next one (keeps site responsive)
      await new Promise(res => setTimeout(res, 800));
    }
  }

  // --- Wait for all images before loading 3D models ---
  function waitForImages() {
    const images = Array.from(document.images);
    if (!images.length) return Promise.resolve();

    return new Promise(resolve => {
      let remaining = images.length;
      const done = () => {
        remaining--;
        if (remaining <= 0) resolve();
      };
      images.forEach(img => {
        if (img.complete) {
          done();
        } else {
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }
      });
    });
  }

  // --- Observer to trigger first model if section is visible early ---
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Load the first model immediately if not yet loaded
        if (!iframes[0].src) {
          iframes[0].src = iframes[0].dataset.src;
          iframes[0].dataset.loaded = "true";
        }
        observer.disconnect();
      }
    });
  }, { threshold: 0.2 });

  if (section) observer.observe(section);

  // --- Main flow ---
  (async () => {
    await waitForImages();
    // Start sequential loading after images are ready
    loadIframeSequentially(0);
  })();

  // Init position
  updateCarousel();
});
