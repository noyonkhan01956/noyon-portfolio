const root = document.querySelector(".ps-root");
if (root) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasObserver = "IntersectionObserver" in window;
    // Hero/reveal styles only apply once this class exists, so no-JS output stays visible.
    root.classList.add("ps-js");

    /* ---------- Scroll progress, navbar state and sheet parallax ---------- */
    const progress = root.querySelector("[data-progress]");
    const nav = root.querySelector("[data-nav]");
    let scheduled = false;
    const updateScroll = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            const y = window.scrollY;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
            nav?.classList.toggle("is-scrolled", y > 16);
            root.style.setProperty("--sy", String(Math.min(y, 900)));
        });
    };
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    /* ---------- Smooth in-page links ---------- */
    root.querySelectorAll("[data-scroll-link]").forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href") || "";
            if (!href.startsWith("#") || href.length < 2) return;
            const target = document.getElementById(href.slice(1));
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        });
    });

    const reveals = root.querySelectorAll("[data-reveal]");
    if (hasObserver) {
        /* ---------- Active nav link ---------- */
        const navLinks = root.querySelectorAll("[data-section-link]");
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                navLinks.forEach((link) => {
                    link.dataset.active = String(link.getAttribute("data-section-link") === entry.target.id);
                });
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        root.querySelectorAll("[data-page-section]").forEach((section) => sectionObserver.observe(section));

        /* ---------- Scroll reveal ---------- */
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-in");
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
        reveals.forEach((element) => revealObserver.observe(element));
    } else {
        reveals.forEach((element) => element.classList.add("is-in"));
    }

    /* ---------- Google Form submission state ---------- */
    const googleForm = root.querySelector("[data-google-form]");
    const formFrame = root.querySelector('iframe[name="ps-gform-frame"]');
    if (googleForm && formFrame) {
        const button = googleForm.querySelector('button[type="submit"]');
        const label = googleForm.querySelector("[data-submit-label]");
        const status = googleForm.querySelector("[data-form-status]");
        let pending = false;
        let fallbackTimer = 0;
        const finish = () => {
            if (!pending) return;
            pending = false;
            window.clearTimeout(fallbackTimer);
            googleForm.reset();
            if (button) button.disabled = false;
            if (label) label.textContent = "Send";
            if (status) status.hidden = false;
        };
        googleForm.addEventListener("submit", () => {
            pending = true;
            if (button) button.disabled = true;
            if (label) label.textContent = "…";
            if (status) status.hidden = true;
            // Google's response can't be read cross-origin; confirm optimistically if the frame never reports.
            fallbackTimer = window.setTimeout(finish, 4000);
        });
        formFrame.addEventListener("load", finish);
    }
}