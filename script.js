const menuIcon = document.querySelector('#menu-icon');
const navLinks = document.querySelector('.nav-links');
const siteFavicon = document.querySelector('#site-favicon');
const themeBtn = document.querySelector('#theme-btn');
const themeIcon = themeBtn.querySelector('i');

const modal = document.querySelector('#modal');
const closeBtn = document.querySelector('#close-btn');
const resumeBtn = document.querySelector('#resume-btn');
const contactBtn = document.querySelector('#contact-btn');
const modalContent = document.querySelector('.modal-content');

const resumeModal = document.querySelector('#resume-modal');
const contactModal = document.querySelector('#contact-modal');
const projectModal = document.querySelector('#project-modal');
const projectTitle = document.querySelector('#project-title');
const modalEmployer = document.querySelector('#modal-employer');
const modalDate = document.querySelector('#modal-date');
const projectDescription = document.querySelector('#project-description');
const projectGallery = document.querySelector('#project-gallery');
const projectHero = document.querySelector('#project-hero');
const detailCards = document.querySelectorAll('.project-card, .grid-card');
const skillFilters = document.querySelectorAll('[data-skill-filter]');
const skillCards = document.querySelectorAll('[data-skill-category]');
const pdfViewer = document.querySelector('#pdf-viewer');
const resumeDownloadBtn = document.querySelector('#resume-download-btn');
const introScreen = document.querySelector('#intro-screen');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let sectionJumpTimeout;
if(introScreen){
    document.body.classList.add('intro-active');
}
const lenis = !prefersReducedMotion && window.Lenis
    ? new window.Lenis({
        lerp: 0.12,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1
    })
    : null;
let lenisFrame;

function scheduleLenisFrame(resetClock = false){
    if(!lenis || lenisFrame){
        return;
    }

    if(resetClock){
        lenis.time = performance.now();
    }

    lenisFrame = requestAnimationFrame((time) => {
        lenisFrame = undefined;
        lenis.raf(time);

        if(lenis.isScrolling === 'smooth'){
            scheduleLenisFrame();
        }
    });
}

if(lenis){
    lenis.on('virtual-scroll', () => {
        scheduleLenisFrame(lenis.isScrolling !== 'smooth');
    });

    document.addEventListener('visibilitychange', () => {
        if(document.hidden){
            cancelAnimationFrame(lenisFrame);
            lenisFrame = undefined;
        }
        else if(lenis.isScrolling === 'smooth'){
            scheduleLenisFrame(true);
        }
    });
}

function dismissIntro(){
    if(!introScreen){
        return;
    }

    introScreen.classList.add('is-leaving');
    window.setTimeout(() => {
        introScreen.remove();
        document.body.classList.remove('intro-active');
    }, prefersReducedMotion ? 20 : 1700);
}

window.setTimeout(dismissIntro, prefersReducedMotion ? 0 : 800);

skillFilters.forEach((filter) => {
    filter.addEventListener('click', () => {
        const category = filter.dataset.skillFilter;

        skillFilters.forEach((button) => {
            const isActive = button === filter;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', String(isActive));
        });

        skillCards.forEach((card) => {
            card.classList.toggle('is-filtered-out', category !== 'all' && card.dataset.skillCategory !== category);
        });
    });
});

function getResumePath(){
    return './assets/documents/Resume.pdf';
}

function setTheme(isDark){
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('dark-mode', isDark);
    siteFavicon.href = isDark
        ? 'assets/images/logo/favicon-dark-64.png?v=20260922'
        : 'assets/images/logo/favicon-light-64.png?v=20260922';
    themeIcon.classList.toggle('fa-moon', isDark);
    themeIcon.classList.toggle('fa-sun', !isDark);
    resumeDownloadBtn.href = './assets/documents/Resume.pdf';
}

let themeTransitionInProgress = false;

async function animateThemeChange(isDark){
    if(themeTransitionInProgress) return;
    themeTransitionInProgress = true;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!document.startViewTransition || prefersReducedMotion){
        setTheme(isDark);
        themeTransitionInProgress = false;
        return;
    }

    document.body.classList.add('theme-transitioning');
    const transition = document.startViewTransition(() => setTheme(isDark));

    try{
        await transition.ready;
        const animation = document.documentElement.animate(
            { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0 0)'] },
            { duration: 650, easing: 'ease-in-out', fill: 'both', pseudoElement: '::view-transition-new(root)' }
        );
        await animation.finished;
    }catch(error){
        // The theme is already updated if the browser skips the animation.
    }finally{
        document.body.classList.remove('theme-transitioning');
        themeTransitionInProgress = false;
    }
}

const savedTheme = localStorage.getItem('portfolio-theme');
setTheme(savedTheme ? savedTheme === 'dark' : true);

menuIcon.onclick = () => {
    navLinks.classList.toggle('active');
}

navLinks.querySelectorAll('a').forEach((link) => {
    link.onclick = () => {
        navLinks.classList.remove('active');
    }
});

themeBtn.onclick = () => {
    const isDark = !document.body.classList.contains('dark-mode');
    animateThemeChange(isDark);
    localStorage.setItem('portfolio-theme', isDark ? 'dark' : 'light');
}


function fadeInSection(section){
    if(prefersReducedMotion || !section){
        return;
    }

    section.classList.remove('section-jump-in');
    void section.offsetWidth;
    section.classList.add('section-jump-in');
    window.clearTimeout(sectionJumpTimeout);
    sectionJumpTimeout = window.setTimeout(() => {
        section.classList.remove('section-jump-in');
    }, 500);
}

document.querySelectorAll('header a[href^="#"], footer a[href^="#"], .section-navigation a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
        const targetSelector = link.getAttribute('href');

        if(targetSelector === '#'){
            event.preventDefault();
            if(lenis){
                lenis.scrollTo(0, {immediate: true});
            }
            else{
                window.scrollTo({top: 0, behavior: 'auto'});
            }
            fadeInSection(document.querySelector('#about'));
            return;
        }

        const target = document.querySelector(targetSelector);
        if(!target){
            return;
        }

        event.preventDefault();
        if(lenis){
            lenis.scrollTo(target, {
                immediate: true,
                offset: 0
            });
        }
        else{
            target.scrollIntoView({
                behavior: 'auto',
                block: 'start'
            });
        }

        fadeInSection(target);
    });
});

let cancelPendingModalOpenWork = () => {};

function runAfterModalOpen(callback){
    cancelPendingModalOpenWork();

    let isCancelled = false;
    let fallbackTimer;
    let reducedMotionFrame;

    const cleanup = () => {
        modalContent.removeEventListener('animationend', handleAnimationEnd);
        window.clearTimeout(fallbackTimer);
        cancelAnimationFrame(reducedMotionFrame);
    };

    const run = () => {
        if(isCancelled){
            return;
        }

        isCancelled = true;
        cleanup();
        cancelPendingModalOpenWork = () => {};

        if(modal.classList.contains('active') && !modal.classList.contains('closing')){
            callback();
        }
    };

    const handleAnimationEnd = (event) => {
        if(event.target === modalContent && event.animationName === 'modal-content-in'){
            run();
        }
    };

    cancelPendingModalOpenWork = () => {
        isCancelled = true;
        cleanup();
    };

    if(prefersReducedMotion){
        reducedMotionFrame = requestAnimationFrame(run);
        return;
    }

    modalContent.addEventListener('animationend', handleAnimationEnd);
    fallbackTimer = window.setTimeout(run, 650);
}

function openModal(page, isProject = false){
    cancelPendingModalOpenWork();
    modal.classList.remove('closing');
    resumeModal.classList.remove('active');
    contactModal.classList.remove('active');
    projectModal.classList.remove('active');
    modalContent.classList.remove(
        'resume-modal-content',
        'contact-modal-content',
        'project-modal-content'
    );

    page.classList.add('active');
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    lenis?.stop();

    if(page === resumeModal){
        modalContent.classList.add('resume-modal-content');
    }
    if(page === contactModal){
        modalContent.classList.add('contact-modal-content');
    }
    if(page === projectModal && isProject){
        modalContent.classList.add('project-modal-content');
    }

    modal.scrollTop = 0;
}

function closeModal(){
    if(!modal.classList.contains('active') || modal.classList.contains('closing')){
        return;
    }

    modal.classList.add('closing');
    cancelPendingModalOpenWork();
    document.body.classList.remove('modal-open');
    lenis?.start();

    if(resumeModal.classList.contains('active')){
        cancelResumeRender();
    }

    window.setTimeout(() => {
        modal.classList.remove('active', 'closing');
    }, 220);
}

let resumePdfPromise;
let resumeRenderGeneration = 0;
let activeResumeRenderTask;

async function getResumePdf(){
    if(!resumePdfPromise){
        resumePdfPromise = import('./vendor/pdfjs/pdf.min.mjs')
            .then((pdfjsLib) => {
                pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdfjs/pdf.worker.min.mjs';
                return pdfjsLib.getDocument(getResumePath()).promise;
            })
            .catch((error) => {
                resumePdfPromise = undefined;
                throw error;
            });
    }

    return resumePdfPromise;
}

function cancelResumeRender(){
    resumeRenderGeneration++;
    activeResumeRenderTask?.cancel();
    activeResumeRenderTask = undefined;
}

async function loadResume(){
    const renderGeneration = ++resumeRenderGeneration;
    activeResumeRenderTask?.cancel();
    activeResumeRenderTask = undefined;
    pdfViewer.innerHTML = '<p>Loading resume...</p>';

    try{
        const pdf = await getResumePdf();
        if(renderGeneration !== resumeRenderGeneration){
            return;
        }

        pdfViewer.innerHTML = '';

        for(let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++){
            const page = await pdf.getPage(pageNumber);
            if(renderGeneration !== resumeRenderGeneration){
                return;
            }

            const baseViewport = page.getViewport({scale: 1});
            const availableWidth = pdfViewer.clientWidth;
            const displayScale = Math.max(0.1, availableWidth / baseViewport.width);
            const renderScale = displayScale * Math.min(window.devicePixelRatio || 1, 2);
            const viewport = page.getViewport({scale: renderScale});
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = `${baseViewport.width * displayScale}px`;
            canvas.style.height = `${baseViewport.height * displayScale}px`;

            pdfViewer.appendChild(canvas);

            activeResumeRenderTask = page.render({
                canvasContext: context,
                viewport: viewport
            });
            await activeResumeRenderTask.promise;
            activeResumeRenderTask = undefined;
        }
    }
    catch(error){
        if(renderGeneration !== resumeRenderGeneration){
            return;
        }

        pdfViewer.innerHTML = `
            <p>Could not load the resume.</p>
            <a href="${getResumePath()}" class="btn" target="_blank">Open Resume PDF</a>
        `;
    }
}

resumeBtn.onclick = () => {
    pdfViewer.innerHTML = '<p>Loading resume...</p>';
    openModal(resumeModal);
    runAfterModalOpen(() => {
        void loadResume();
    });
}

contactBtn.onclick = () => {
    openModal(contactModal);
}

const cardImageCache = new Map();

function cacheCardImage(source){
    if(!source){
        return null;
    }

    const url = new URL(source, document.baseURI).href;
    if(!cardImageCache.has(url)){
        const image = new Image();
        image.decoding = 'async';
        image.fetchPriority = 'low';
        image.src = url;
        image.decode?.().catch(() => {
            // The image can still render normally if eager decoding is unavailable.
        });
        cardImageCache.set(url, image);
    }

    return cardImageCache.get(url);
}

function preloadCardImages(card){
    if(card.dataset.hero){
        cacheCardImage(card.dataset.hero);
    }
    if(card.classList.contains('project-card')){
        cacheCardImage(card.querySelector('img')?.getAttribute('src'));
    }

    card.dataset.photos?.split('|').forEach((source) => {
        if(!/\.(mp4|webm)$/i.test(source)){
            cacheCardImage(source);
        }
    });
}

function createCachedModalImage(source, alt){
    const image = cacheCardImage(source) || new Image();
    image.alt = alt;
    image.decoding = 'async';
    image.fetchPriority = 'high';
    image.loading = 'eager';
    return image;
}

const preloadAllCardImages = () => {
    detailCards.forEach(preloadCardImages);
};

if(document.readyState === 'complete'){
    window.setTimeout(preloadAllCardImages, 0);
}
else{
    window.addEventListener('load', preloadAllCardImages, {once: true});
}

detailCards.forEach((card) => {
    card.addEventListener('pointerenter', () => preloadCardImages(card), {once: true});

    card.onclick = () => {
        const [role, employer] = card.dataset.title.split(' | ');
        projectTitle.textContent = role;
        modalEmployer.textContent = '';
        modalEmployer.classList.remove('active');
        modalDate.textContent = '';
        modalDate.classList.remove('active');

        if(card.classList.contains('grid-card') && employer){
            modalEmployer.textContent = employer;
            modalEmployer.classList.add('active');
        }
        else if(card.classList.contains('project-card')){
            projectTitle.textContent = card.dataset.title;
            modalEmployer.textContent = card.querySelector('.project-location')?.textContent || '';
            modalEmployer.classList.toggle('active', Boolean(modalEmployer.textContent));
        }

        if(card.dataset.date){
            modalDate.textContent = card.dataset.date;
            modalDate.classList.add('active');
        }
        projectDescription.replaceChildren(
            ...card.dataset.details.split('|').map((detail) => {
                const item = document.createElement('li');
                item.textContent = detail;
                return item;
            })
        );

        const heroPath = card.dataset.hero || (card.classList.contains('project-card') ? card.querySelector('img').src : undefined);
        const photos = card.dataset.photos?.split('|') || [];
        const captions = card.dataset.captions?.split('|') || [];
        projectHero.replaceChildren();
        projectHero.classList.remove('active');
        projectGallery.replaceChildren();
        projectGallery.classList.remove('active');

        if(heroPath){
            projectHero.appendChild(createCachedModalImage(heroPath, `${card.dataset.title} image`));
            projectHero.classList.add('active');
        }

        const deferredVideos = [];
        photos.forEach((photo, index) => {
            const figure = document.createElement('figure');
            const isVideo = /\.(mp4|webm)$/i.test(photo);

            if(isVideo){
                const video = document.createElement('video');
                video.setAttribute('aria-label', `${card.dataset.title} supporting video ${index + 1}`);
                video.autoplay = true;
                video.defaultMuted = true;
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                video.preload = 'metadata';
                video.width = 800;
                video.height = 450;
                figure.appendChild(video);
                deferredVideos.push(() => {
                    video.src = photo;
                    video.load();
                });
            }
            else{
                figure.appendChild(
                    createCachedModalImage(photo, `${card.dataset.title} supporting photo ${index + 1}`)
                );
            }

            if(captions[index]){
                const caption = document.createElement('figcaption');
                caption.textContent = captions[index];
                figure.appendChild(caption);
            }

            projectGallery.appendChild(figure);
        });
        projectGallery.classList.toggle('active', photos.length > 0);

        openModal(projectModal, card.classList.contains('project-card') || Boolean(card.dataset.hero));

        if(deferredVideos.length){
            runAfterModalOpen(() => {
                deferredVideos.forEach((loadVideo) => loadVideo());
            });
        }
    }
});

closeBtn.onclick = () => {
    closeModal();
}

modal.onclick = (event) => {
    if(event.target === modal){
        closeModal();
    }
}

document.onkeydown = (event) => {
    if(event.key === 'Escape'){
        closeModal();
    }
}

let resumeResizeTimer;
window.addEventListener('resize', () => {
    if(!modal.classList.contains('active') || !resumeModal.classList.contains('active')){
        return;
    }

    clearTimeout(resumeResizeTimer);
    resumeResizeTimer = setTimeout(() => {
        void loadResume();
    }, 150);
});

const pageSections = [...document.querySelectorAll('body > section')];
const sectionUpBtn = document.querySelector('#section-up-btn');
const sectionDownBtn = document.querySelector('#section-down-btn');
const timelines = document.querySelectorAll('.timeline');
const timelineEntries = [...timelines].map((timeline) => ({
    timeline,
    items: [...timeline.querySelectorAll('.timeline-item')],
    end: 0,
    isVisible: false,
    lastProgress: -1
}));
const supportsIntersectionObserver = 'IntersectionObserver' in window;
const projectsSection = document.querySelector('#projects');
const projectsRail = document.querySelector('.projects-rail');
let projectScrollPosition = 0;
let projectScrollDistance = 1;
let projectRailDistance = 0;
let pageScrollFrame;

if(supportsIntersectionObserver){
    const timelineObserver = new IntersectionObserver((observations) => {
        observations.forEach((observation) => {
            const entry = timelineEntries.find(({timeline}) => timeline === observation.target);
            if(!entry){
                return;
            }

            entry.isVisible = observation.isIntersecting;
            entry.timeline.classList.toggle('is-visible', entry.isVisible);

            if(entry.isVisible){
                schedulePageScrollUpdate();
            }
        });
    }, {rootMargin: '0px 0px -10% 0px'});

    const timelineItemObserver = new IntersectionObserver((observations) => {
        observations.forEach((observation) => {
            const activationLine = observation.rootBounds?.bottom ?? window.innerHeight * 0.9;
            observation.target.classList.toggle(
                'is-active',
                observation.boundingClientRect.top < activationLine
            );
        });
    }, {rootMargin: '0px 0px -10% 0px'});

    timelineEntries.forEach((entry) => {
        timelineObserver.observe(entry.timeline);
        entry.items.forEach((item) => timelineItemObserver.observe(item));
    });
}
else{
    timelineEntries.forEach((entry) => {
        entry.isVisible = true;
    });
}

function measureProjectsScroll(){
    if(!projectsSection || !projectsRail || window.innerWidth <= 900){
        projectScrollDistance = 1;
        projectRailDistance = 0;
        return;
    }

    projectScrollDistance = Math.max(projectsSection.offsetHeight - window.innerHeight, 1);
    projectRailDistance = Math.max(projectsRail.scrollWidth - projectsRail.clientWidth, 0);
}

function setProjectsScroll(position){
    if(Math.abs(position - projectScrollPosition) < 0.1){
        return;
    }

    projectScrollPosition = position;
    projectsRail.style.transform = `translate3d(${-position}px, 0, 0)`;
}

function measureTimelineEntries(){
    timelineEntries.forEach((entry) => {
        const lastTimelineItem = entry.items[entry.items.length - 1];
        entry.end = lastTimelineItem
            ? lastTimelineItem.offsetTop + lastTimelineItem.offsetHeight / 2
            : Math.max(entry.timeline.getBoundingClientRect().height, 1);
        entry.lastProgress = -1;
    });
}

function updateTimelines(){
    const progressTrigger = window.innerHeight * 0.55;
    const viewportTrigger = window.innerHeight * 0.9;
    timelineEntries.forEach((entry) => {
        const bounds = entry.timeline.getBoundingClientRect();
        const isVisible = supportsIntersectionObserver
            ? entry.isVisible
            : bounds.top < viewportTrigger && bounds.bottom > 0;

        if(!supportsIntersectionObserver){
            entry.timeline.classList.toggle('is-visible', isVisible);
            entry.items.forEach((item) => {
                item.classList.toggle('is-active', item.getBoundingClientRect().top < viewportTrigger);
            });
        }

        if(!isVisible){
            return;
        }

        const progress = Math.min(Math.max(progressTrigger - bounds.top, 0), entry.end);
        if(Math.abs(progress - entry.lastProgress) >= 0.1){
            entry.timeline.style.setProperty('--timeline-progress', `${progress}px`);
            entry.lastProgress = progress;
        }
    });
}

function updateProjectsScroll(){
    if(!projectsSection || !projectsRail){
        return;
    }

    if(window.innerWidth <= 900){
        projectsRail.style.transform = '';
        projectScrollPosition = 0;
        return;
    }

    const bounds = projectsSection.getBoundingClientRect();
    if(bounds.top >= window.innerHeight){
        setProjectsScroll(0);
        return;
    }
    if(bounds.bottom <= 0){
        setProjectsScroll(projectRailDistance);
        return;
    }

    const progress = Math.min(Math.max(-bounds.top / projectScrollDistance, 0), 1);
    const railBuffer = 0.12;
    const railProgress = Math.min(Math.max((progress - railBuffer) / (1 - railBuffer * 2), 0), 1);
    setProjectsScroll(railProgress * projectRailDistance);
}

function updateSectionNavigation(){
    if(!sectionUpBtn || !sectionDownBtn){
        return;
    }

    const currentSectionIndex = Math.max(
        pageSections.findLastIndex((section) => section.offsetTop <= window.scrollY + 1),
        0
    );

    const previousSection = pageSections[currentSectionIndex - 1];
    const nextSection = pageSections[currentSectionIndex + 1];

    sectionUpBtn.hidden = !previousSection;
    sectionDownBtn.hidden = !nextSection;

    if(previousSection){
        sectionUpBtn.href = `#${previousSection.id}`;
    }
    if(nextSection){
        sectionDownBtn.href = `#${nextSection.id}`;
    }
}

function updatePageScroll(){
    updateSectionNavigation();
    updateTimelines();
    updateProjectsScroll();
}

function schedulePageScrollUpdate(){
    if(pageScrollFrame){
        return;
    }

    pageScrollFrame = requestAnimationFrame(() => {
        pageScrollFrame = undefined;
        updatePageScroll();
    });
}

window.addEventListener('scroll', schedulePageScrollUpdate, {passive: true});

window.addEventListener('resize', () => {
    measureTimelineEntries();
    measureProjectsScroll();
    schedulePageScrollUpdate();
});

measureTimelineEntries();
measureProjectsScroll();
updatePageScroll();
