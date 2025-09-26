// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Theme handling
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('themeToggle');

    function setNavbarForTheme(theme) {
        const nav = document.querySelector('.navbar');
        if (!nav) return;
        if (theme === 'dark') {
            nav.classList.remove('navbar-light', 'bg-light');
            nav.classList.add('navbar-dark', 'bg-dark');
            if (themeToggleBtn) {
                themeToggleBtn.classList.remove('btn-outline-dark');
                themeToggleBtn.classList.add('btn-outline-light');
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
            }
        } else {
            nav.classList.remove('navbar-dark', 'bg-dark');
            nav.classList.add('navbar-light', 'bg-light');
            if (themeToggleBtn) {
                themeToggleBtn.classList.remove('btn-outline-light');
                themeToggleBtn.classList.add('btn-outline-dark');
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
            }
        }
    }

    function applyTheme(theme) {
        htmlEl.setAttribute('data-bs-theme', theme);
        setNavbarForTheme(theme);
        localStorage.setItem('theme', theme);
    }

    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const current = htmlEl.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse, {toggle: false});
                    bsCollapse.hide();
                }
                
                // Scroll to the target section
                window.scrollTo({
                    top: targetElement.offsetTop - 70, // Adjust for fixed navbar
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background change on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        const theme = htmlEl.getAttribute('data-bs-theme') || 'light';
        if (window.scrollY > 50) {
            navbar.classList.add('shadow');
            if (theme === 'dark') {
                navbar.classList.remove('bg-light');
                navbar.classList.add('bg-dark');
            } else {
                navbar.classList.remove('bg-dark');
                navbar.classList.add('bg-light');
            }
        } else {
            navbar.classList.remove('bg-dark', 'bg-light', 'shadow');
        }
    });

    // Add animation on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.animate-on-scroll');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (elementPosition < screenPosition) {
                element.style.animation = 'fadeInUp 0.6s ease forwards';
            }
        });
    };
    
    // Run once on page load
    animateOnScroll();
    
    // Run on scroll
    window.addEventListener('scroll', animateOnScroll);

    // Form submission handling -> Supabase Edge Function
    const contactForm = document.querySelector('#contact form');
    if (contactForm) {
        const statusEl = document.getElementById('contact-status');
        const submitBtn = contactForm.querySelector('button[type="submit"]');

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Honeypot check
            const websiteTrap = document.getElementById('website');
            if (websiteTrap && websiteTrap.value) {
                // Silently drop bots
                return;
            }

            const payload = {
                name: document.getElementById('name')?.value?.trim() || '',
                email: document.getElementById('email')?.value?.trim() || '',
                subject: document.getElementById('subject')?.value?.trim() || '',
                message: document.getElementById('message')?.value?.trim() || '',
                userAgent: navigator.userAgent,
                page: window.location.href,
            };

            // Basic guard
            if (!payload.name || !payload.email || !payload.message) {
                statusEl.innerHTML = '<div class="alert alert-warning">Please complete all required fields.</div>';
                return;
            }

            try {
                submitBtn.disabled = true;
                statusEl.innerHTML = '<div class="alert alert-info">Sending your message…</div>';

                // Replace YOUR_PROJECT_REF with your Supabase project ref; keep path as deployed function name
                const endpoint = 'https://rczduppvlpvjumdyhmzh.supabase.co/functions/v1/contact-email';
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    let detail = '';
                    try {
                        const data = await res.json();
                        detail = data?.detail || data?.error || JSON.stringify(data);
                    } catch (_) {
                        detail = await res.text();
                    }
                    throw new Error(detail || `Request failed with ${res.status}`);
                }

                statusEl.innerHTML = '<div class="alert alert-success">Thanks! Your message has been sent.</div>';
                contactForm.reset();
            } catch (err) {
                console.error(err);
                const msg = (err && err.message) ? err.message : 'Unknown error';
                statusEl.innerHTML = `<div class="alert alert-danger">Sorry, something went wrong. <br><small>${msg}</small></div>`;
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // Add animation classes to elements when they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-on-scroll');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // Add animation to skill cards
    document.querySelectorAll('.card').forEach((card, index) => {
        // Add a small delay to each card for a staggered effect
        card.style.animationDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
});

// Hide the preloader ~5 seconds after the entire page (including images) has loaded
window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    // Minimum display time of ~5 seconds before fading out
    setTimeout(() => {
        preloader.classList.add('preloader-hidden');
    }, 2000);
});
