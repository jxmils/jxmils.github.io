const projectsContainer = document.querySelector('.projects');
const slider = document.querySelector('.slider');

projectsContainer.addEventListener('mousemove', (e) => {
    const containerWidth = projectsContainer.clientWidth;
    const sliderWidth = slider.clientWidth;
    const maxScroll = sliderWidth - containerWidth;

    const mouseX = e.clientX;
    const scrollSpeed = mouseX / containerWidth;

    const scrollPos = maxScroll * scrollSpeed;
    slider.style.transform = `translateX(-${scrollPos}px)`;
});
