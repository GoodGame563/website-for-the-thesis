function nextToContainer(idCurrentContainer, idNextContainer) {
    const array = ['left', 'center', 'right']
    const CurrentContainer = document.getElementById(idCurrentContainer);
    const NextContainer = document.getElementById(idNextContainer);
    const CurrentContainerPosition = CurrentContainer.classList.item(1);
    const NextContainerPosition = NextContainer.classList.item(1);
    setTimeout(() => {
        if (array.indexOf(CurrentContainerPosition) < array.indexOf(NextContainerPosition)){
            CurrentContainer.classList.remove(CurrentContainerPosition);
            CurrentContainer.classList.add(array[array.indexOf(CurrentContainerPosition) - 1]);   
            NextContainer.classList.add(array[array.indexOf(NextContainerPosition) - 1]);
            NextContainer.classList.remove(NextContainerPosition);
        }else{
            CurrentContainer.classList.remove(CurrentContainerPosition);
            CurrentContainer.classList.add(array[array.indexOf(CurrentContainerPosition) + 1]);
            NextContainer.classList.add(array[array.indexOf(NextContainerPosition) + 1]);
            NextContainer.classList.remove(NextContainerPosition);
        }
    }, 200);
}

function typeText(text, element) {
    element.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
        if (i < text.length) {
            element.textContent += text[i];
            i++;
        } else {
            clearInterval(interval);
        }
    }, 50);
}

const element = document.querySelector('.container.long');
const elementHeight = element.offsetHeight;
element.style.setProperty('--element-height', `${elementHeight}px`);
undefined

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    // Проверяем наличие access token в cookie

    if (localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')) {
        nextToContainer('window-1', 'window-2');
    } else {
    }
}

// Обновляем функцию успешного входа
function showSuccessAnimation(button, callback) {
    button.innerHTML = `
        <div class="icon checkmark">
            <div class="checkmark-stem"></div>
            <div class="checkmark-kick"></div>
        </div>`;
    setTimeout(() => {
        // Устанавливаем cookies при успешном входе
        document.cookie = `accessToken=${localStorage.getItem('accessToken')}; path=/; max-age=86400`;
        document.cookie = `refreshToken=${localStorage.getItem('refreshToken')}; path=/; max-age=2592000`;
        callback();
    }, 1000);
}
