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

function setTheme(isDark){
    document.body.classList.toggle('dark-mode', isDark);
    themeIcon.classList.toggle('fa-moon', !isDark);
    themeIcon.classList.toggle('fa-sun', isDark);
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
    setTheme(isDark);
    localStorage.setItem('portfolio-theme', isDark ? 'dark' : 'light');
}

systemTheme.addEventListener('change', (event) => {
    if(!localStorage.getItem('portfolio-theme')){
        setTheme(event.matches);
    }
});

function openModal(page){
    modal.classList.remove('closing');
    resumeModal.classList.remove('active');
    contactModal.classList.remove('active');
    projectModal.classList.remove('active');
    modalContent.classList.remove('resume-modal-content', 'contact-modal-content');

    page.classList.add('active');
    modal.classList.add('active');
    document.body.classList.add('modal-open');

    if(page === resumeModal){
        modalContent.classList.add('resume-modal-content');
    }
    if(page === contactModal){
        modalContent.classList.add('contact-modal-content');
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
        const pdf = await pdfjsLib.getDocument('./Resume.pdf').promise;

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
            <a href="./Resume.pdf" class="btn" target="_blank">Open Resume PDF</a>
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

        openModal(projectModal);
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

const snapSections = [...document.querySelectorAll('body > section')];
let sectionScrollAnimation;

function scrollToSection(section){
    const startPosition = window.scrollY;
    const maximumScroll = document.documentElement.scrollHeight - window.innerHeight;
    const destination = Math.min(section.offsetTop, maximumScroll);
    const duration = 800;
    const startTime = performance.now();

    document.documentElement.classList.add('is-section-scrolling');

    function animateScroll(currentTime){
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 4);
        window.scrollTo(0, startPosition + (destination - startPosition) * easedProgress);

        if(progress < 1){
            sectionScrollAnimation = requestAnimationFrame(animateScroll);
        }
        else{
            sectionScrollAnimation = undefined;
            document.documentElement.classList.remove('is-section-scrolling');
        }
    }

    sectionScrollAnimation = requestAnimationFrame(animateScroll);
}

window.addEventListener('wheel', (event) => {
    if(window.innerWidth <= 768 || modal.classList.contains('active') || Math.abs(event.deltaY) < 24){
        return;
    }

    if(sectionScrollAnimation){
        event.preventDefault();
        return;
    }

    const currentSectionIndex = snapSections.reduce((closestIndex, section, index) => {
        return Math.abs(section.offsetTop - window.scrollY) < Math.abs(snapSections[closestIndex].offsetTop - window.scrollY)
            ? index
            : closestIndex;
    }, 0);
    const direction = event.deltaY > 0 ? 1 : -1;
    const nextSection = snapSections[currentSectionIndex + direction];

    if(nextSection){
        event.preventDefault();
        scrollToSection(nextSection);
    }
}, {passive: false});
