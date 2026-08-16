import * as pdfjsLib from './vendor/pdfjs/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc ='./vendor/pdfjs/pdf.worker.min.mjs';

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
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let sectionJumpTimeout;
const lenis = !prefersReducedMotion && window.Lenis
    ? new window.Lenis({
        lerp: 0.08,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1
    })
    : null;

if(lenis){
    const updateLenis = (time) => {
        lenis.raf(time);
        requestAnimationFrame(updateLenis);
    };

    requestAnimationFrame(updateLenis);
}

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

const popoutImageSources = new Set();
detailCards.forEach((card) => {
    if(card.dataset.hero){
        popoutImageSources.add(card.dataset.hero);
    }
    if(card.classList.contains('project-card')){
        popoutImageSources.add(card.querySelector('img').src);
    }
    card.dataset.photos?.split('|').forEach((photo) => popoutImageSources.add(photo));
});
popoutImageSources.forEach((source) => {
    const preload = new Image();
    preload.src = source;
});

['./assets/documents/Resume.pdf'].forEach((path) => {
    fetch(path, {cache: 'force-cache'}).catch(() => {
        // The resume viewer will show its existing fallback if a PDF cannot load.
    });
});

function getResumePath(){
    return './assets/documents/Resume.pdf';
}

function setTheme(isDark){
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('dark-mode', isDark);
    siteFavicon.href = isDark
        ? 'assets/images/logo/favicon-dark.png?v=20260814'
        : 'assets/images/logo/favicon-light.png?v=20260814';
    themeIcon.classList.toggle('fa-moon', isDark);
    themeIcon.classList.toggle('fa-sun', !isDark);
    resumeDownloadBtn.href = './assets/documents/Resume.pdf';

    if(modal.classList.contains('active') && resumeModal.classList.contains('active')){
        loadResume();
    }
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

document.querySelectorAll('header a[href^="#"], .section-navigation a[href^="#"]').forEach((link) => {
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

function openModal(page, isProject = false){
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
    document.body.classList.remove('modal-open');
    lenis?.start();

    window.setTimeout(() => {
        modal.classList.remove('active', 'closing');
    }, 220);
}

async function loadResume(){
    pdfViewer.innerHTML = '<p>Loading resume...</p>';

    try{
        const resumePath = getResumePath();
        const pdf = await pdfjsLib.getDocument(resumePath).promise;

        pdfViewer.innerHTML = '';

        for(let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++){
            const page = await pdf.getPage(pageNumber);
            const baseViewport = page.getViewport({scale: 1});
            const availableWidth = pdfViewer.clientWidth;
            const displayScale = Math.max(0.1, availableWidth / baseViewport.width);
            const renderScale = displayScale * Math.min(window.devicePixelRatio || 1, 3);
            const viewport = page.getViewport({scale: renderScale});
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = `${baseViewport.width * displayScale}px`;
            canvas.style.height = `${baseViewport.height * displayScale}px`;

            pdfViewer.appendChild(canvas);

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
        }
    }
    catch(error){
        pdfViewer.innerHTML = `
            <p>Could not load the resume.</p>
            <a href="${getResumePath()}" class="btn" target="_blank">Open Resume PDF</a>
        `;
    }
}

resumeBtn.onclick = () => {
    openModal(resumeModal);
    loadResume();
}

contactBtn.onclick = () => {
    openModal(contactModal);
}

detailCards.forEach((card) => {
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

        projectHero.replaceChildren();
        const heroPath = card.dataset.hero || (card.classList.contains('project-card') ? card.querySelector('img').src : undefined);
        if(heroPath){
            const heroImage = document.createElement('img');
            heroImage.src = heroPath;
            heroImage.alt = `${card.dataset.title} image`;
            projectHero.appendChild(heroImage);
            projectHero.classList.add('active');
        }
        else{
            projectHero.classList.remove('active');
        }

        projectGallery.replaceChildren();
        if(card.dataset.photos){
            const captions = card.dataset.captions?.split('|') || [];
            card.dataset.photos.split('|').forEach((photo, index) => {
                const figure = document.createElement('figure');
                const image = document.createElement('img');
                image.src = photo;
                image.alt = `${card.dataset.title} supporting photo ${index + 1}`;
                figure.appendChild(image);

                if(captions[index]){
                    const caption = document.createElement('figcaption');
                    caption.textContent = captions[index];
                    figure.appendChild(caption);
                }

                projectGallery.appendChild(figure);
            });
            projectGallery.classList.add('active');
        }
        else{
            projectGallery.classList.remove('active');
        }

        openModal(projectModal, card.classList.contains('project-card') || Boolean(card.dataset.hero));
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
    resumeResizeTimer = setTimeout(loadResume, 150);
});

const pageSections = [...document.querySelectorAll('body > section')];
const sectionUpBtn = document.querySelector('#section-up-btn');
const sectionDownBtn = document.querySelector('#section-down-btn');
const timelines = document.querySelectorAll('.timeline');
const projectsSection = document.querySelector('#projects');
const projectsRail = document.querySelector('.projects-rail');
let projectScrollTarget = 0;
let projectScrollPosition = 0;
let projectScrollFrame;

function updateTimelines(){
    timelines.forEach((timeline) => {
        const timelineBounds = timeline.getBoundingClientRect();
        const trackHeight = Math.max(timelineBounds.height, 1);
        const progressTrigger = window.innerHeight * 0.55;
        const viewportTrigger = window.innerHeight * 0.9;
        const timelineItems = timeline.querySelectorAll('.timeline-item');
        const lastTimelineItem = timelineItems[timelineItems.length - 1];
        const timelineEnd = lastTimelineItem
            ? lastTimelineItem.offsetTop + lastTimelineItem.offsetHeight / 2
            : trackHeight;
        const progress = Math.min(Math.max(progressTrigger - timelineBounds.top, 0), timelineEnd);

        timeline.style.setProperty('--timeline-progress', `${progress}px`);
        timeline.classList.toggle('is-visible', timelineBounds.top < window.innerHeight * 0.9 && timelineBounds.bottom > 0);

        timeline.querySelectorAll('.timeline-item').forEach((item) => {
            item.classList.toggle('is-active', item.getBoundingClientRect().top < viewportTrigger);
        });
    });
}

function updateProjectsScroll(){
    if(!projectsSection || !projectsRail){
        return;
    }

    if(window.innerWidth <= 900){
        if(projectScrollFrame){
            cancelAnimationFrame(projectScrollFrame);
            projectScrollFrame = undefined;
        }
        projectsRail.style.transform = '';
        projectScrollTarget = 0;
        projectScrollPosition = 0;
        return;
    }

    const bounds = projectsSection.getBoundingClientRect();
    const scrollDistance = projectsSection.offsetHeight - window.innerHeight;
    const progress = Math.min(Math.max(-bounds.top / scrollDistance, 0), 1);
    const railBuffer = 0.12;
    const railProgress = Math.min(Math.max((progress - railBuffer) / (1 - railBuffer * 2), 0), 1);
    const railDistance = projectsRail.scrollWidth - projectsRail.clientWidth;

    projectScrollTarget = railProgress * railDistance;

    if(projectScrollFrame){
        return;
    }

    const animateProjects = () => {
        projectScrollPosition += (projectScrollTarget - projectScrollPosition) * 0.14;
        projectsRail.style.transform = `translate3d(${-projectScrollPosition}px, 0, 0)`;

        if(Math.abs(projectScrollTarget - projectScrollPosition) > 0.5){
            projectScrollFrame = requestAnimationFrame(animateProjects);
        }
        else{
            projectScrollPosition = projectScrollTarget;
            projectsRail.style.transform = `translate3d(${-projectScrollPosition}px, 0, 0)`;
            projectScrollFrame = undefined;
        }
    };

    projectScrollFrame = requestAnimationFrame(animateProjects);
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

window.addEventListener('scroll', () => {
    updateSectionNavigation();
    updateTimelines();
    updateProjectsScroll();
}, {passive: true});

window.addEventListener('resize', updateProjectsScroll);

updateSectionNavigation();
updateTimelines();
updateProjectsScroll();
