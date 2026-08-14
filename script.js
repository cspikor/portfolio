import * as pdfjsLib from './vendor/pdfjs/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc ='./vendor/pdfjs/pdf.worker.min.mjs';

const menuIcon = document.querySelector('#menu-icon');
const navLinks = document.querySelector('.nav-links');
const themeBtn = document.querySelector('#theme-btn');
const themeIcon = themeBtn.querySelector('i');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

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
const projectDescription = document.querySelector('#project-description');
const projectGallery = document.querySelector('#project-gallery');
const projectHero = document.querySelector('#project-hero');
const detailCards = document.querySelectorAll('.project-card, .grid-card');
const pdfViewer = document.querySelector('#pdf-viewer');
const resumeDownloadBtn = document.querySelector('#resume-download-btn');

function getResumePath(){
    return document.body.classList.contains('dark-mode')
        ? './Resume-dark.pdf'
        : './Resume-light.pdf';
}

function setTheme(isDark){
    document.body.classList.toggle('dark-mode', isDark);
    themeIcon.classList.toggle('fa-moon', isDark);
    themeIcon.classList.toggle('fa-sun', !isDark);
    resumeDownloadBtn.href = getResumePath();

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
setTheme(savedTheme ? savedTheme === 'dark' : systemTheme.matches);

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

systemTheme.addEventListener('change', (event) => {
    if(!localStorage.getItem('portfolio-theme')){
        setTheme(event.matches);
    }
});

document.querySelectorAll('header a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
        const targetSelector = link.getAttribute('href');
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if(targetSelector === '#'){
            event.preventDefault();
            window.scrollTo({top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth'});
            return;
        }

        const target = document.querySelector(targetSelector);
        if(!target){
            return;
        }

        event.preventDefault();
        target.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: target.classList.contains('contact') ? 'start' : 'center'
        });
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
            const availableWidth = pdfViewer.clientWidth - 24;
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

        if(card.classList.contains('grid-card') && employer){
            modalEmployer.textContent = employer;
            modalEmployer.classList.add('active');
        }
        else if(card.classList.contains('project-card')){
            projectTitle.textContent = card.dataset.title;
        }
        projectDescription.replaceChildren(
            ...card.dataset.details.split('|').map((detail) => {
                const item = document.createElement('li');
                item.textContent = detail;
                return item;
            })
        );

        projectHero.replaceChildren();
        if(card.classList.contains('project-card')){
            const heroImage = document.createElement('img');
            const tileImage = card.querySelector('img');
            heroImage.src = tileImage.src;
            heroImage.alt = tileImage.alt;
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

        openModal(projectModal, card.classList.contains('project-card'));
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

function updateSectionNavigation(){
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
}, {passive: true});

updateSectionNavigation();
