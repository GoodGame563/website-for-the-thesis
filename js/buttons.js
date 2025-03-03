function baseButtonsEvents (button){
    button.addEventListener('click', (event) => {
        const wave = document.createElement('span');
        wave.classList.add('wave-effect');
        const rect = button.getBoundingClientRect();
        wave.style.left = `${event.clientX - rect.left}px`;
        wave.style.top = `${event.clientY - rect.top}px`;
        button.appendChild(wave);

        wave.addEventListener('animationend', () => {
            wave.remove();
        });
    });
    return button;
}