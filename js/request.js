const analyzeBtn = baseButtonsEvents(document.getElementById('analyze-btn'));
const settingsBtn = baseButtonsEvents(document.getElementById('settings-btn'));
const input = baseInputEvents(document.getElementById('analysis-input'));
const inputError = document.getElementById('request-error');
const requestContainer = document.getElementById('request-container');
const answerContainer = document.getElementById('answer-container');
const disappearElements = answerContainer.querySelectorAll('.horizontal-item');
const carousel = document.querySelector('.carousel');
const prevBtn = baseButtonsEvents(document.querySelector('.carousel-btn.prev'));
const nextBtn = baseButtonsEvents(document.querySelector('.carousel-btn.next'));
const closeBtn = baseButtonsEvents(document.getElementById('close-btn'));
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const usedWordContainer = document.getElementById('container-used-word');
const unusedWordContainer = document.getElementById('container-unused-word');
const classCarusel = document.getElementById('carousel');
const overlayBtn = document.getElementById('overlay');



const text = "Уникальность и конкретика<br>Вам нужно добавить в описание уникальные характеристики товара и конкретные преимущества. Избегайте общих фраз, таких как «высокое качество» или «лучший выбор». Например, вместо этого укажите, чем ваш товар отличается: «Термокружка, которая сохраняет напиток горячим до 12 часов — идеальна для поездок и прогулок»."
const requestRegex = /^.{20,300}$/;


sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});
let typingAnimationEnabled = true; 
document.addEventListener('click', (event) => {
    const items = document.querySelectorAll('.horizontal-item.expanded');
    items.forEach(item => {
        if (!item.contains(event.target)) {
            item.classList.remove('expanded');
            item.classList.add('smaller');
        }
    });
    if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
        sidebar.classList.remove('active');
    }
});

analyzeBtn.addEventListener('click', () => {
    sidebarToggle.classList.remove('disappear');

    if (!validateInput(input, requestRegex, inputError, "Вы не ввели url")) {
        return;
    }

    // Показываем состояние загрузки
    analyzeBtn.disabled = true;
    inputError.classList.add('hidden');
    const token = localStorage.getItem('accessToken');
    if (!token) {
        inputError.textContent = 'Ошибка авторизации: токен отсутствует';
        inputError.classList.remove('hidden');
        return;
    }

    // Отправка запроса на сервер
    fetch('http://127.0.0.1:8000/create/task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: input.value.trim() })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message || 'Ошибка сервера') });
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        usedWordContainer.innerHTML+=''
        unusedWordContainer.innerHTML+=''
        for (let i = 0; i< data.words.length; i++){
            if (data.words[i].used){
                usedWordContainer.innerHTML+=`<div class="keyword-item">${data.words[i].word}<button></button></div>`
                continue;
            }
            unusedWordContainer.innerHTML+=`<div class="keyword-item">${data.words[i].word}<button></button></div>`
        }
        // Успешный ответ - запускаем анимации
        setTimeout(() => {
            requestContainer.classList.remove('center');
            requestContainer.classList.add('up');
        }, 200);

        // Обработка элементов интерфейса
        disappearElements.forEach((element) => {
            setTimeout(() => {
                element.classList.remove('disappear');
                element.classList.add('appear');
            }, 100);
            
            element.addEventListener('click', () => {
                element.classList.remove('smaller');
                element.classList.add('expanded');
            });
        });

        // Заполнение данных ответа
        setTimeout(() => {
            disappearElements.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.remove('hidden');
                    const resultText = data.results?.[index] || `Результат анализа товара ${index + 1}`;
                    
                    if (typingAnimationEnabled) {
                        simulateServerResponse(index + 1, item.querySelector('p'), resultText);
                    } else {
                        item.querySelector('p').textContent = resultText;
                    }
                }, index * 1000);
            });
        }, 2400);

        // Показ кнопки настроек
        setTimeout(() => {
            settingsBtn.classList.remove('hidden');
            settingsBtn.style.transition = 'bottom 0.5s ease';
            settingsBtn.style.bottom = '2%';
        }, disappearElements.length * 1000 + 2400);
    })
    .catch(error => {
        // Обработка ошибок
        inputError.textContent = `Ошибка: ${error.message}`;
        inputError.classList.remove('hidden');
        
        // Возвращаем элементы в исходное состояние
        requestContainer.classList.add('center');
        requestContainer.classList.remove('up');
        disappearElements.forEach(el => el.classList.add('hidden'));
    })
    .finally(() => {
        analyzeBtn.disabled = false;
    });
});

settingsBtn.addEventListener('click', ()=>{
    document.getElementById('overlay').classList.remove('down');
    document.getElementById('overlay').classList.add('up');
});
closeBtn.addEventListener('click', ()=>{
    document.getElementById('overlay').classList.remove('up');
    document.getElementById('overlay').classList.add('down');
})
function simulateServerResponse(index, element) {
    element.textContent = '';
    let dots = 0;
    const interval = setInterval(() => {
        element.textContent = `Ожидание ответа${'.'.repeat(dots)}`;
        dots = (dots + 1) % 4;
    }, 300);

    setTimeout(() => {
        clearInterval(interval);
        typeText(`Результат анализа товара ${index}.`+ text, element);
    }, Math.random() * 2000 + 1000);
}




const getScrollAmount = () => {
    const item = carousel.querySelector('.vertical-item');
    if (!item) return 0;
    return item.offsetWidth + parseInt(getComputedStyle(item).marginRight);
};

const scrollCarousel = (direction) => {
    const amount = getScrollAmount() * direction;
    carousel.scrollBy({
        left: amount,
        behavior: 'smooth'
    });
};

prevBtn.addEventListener('click', () => scrollCarousel(-1));
nextBtn.addEventListener('click', () => scrollCarousel(1));

const updateButtons = () => {
    prevBtn.disabled = carousel.scrollLeft <= 0;
    nextBtn.disabled = carousel.scrollLeft + carousel.offsetWidth >= carousel.scrollWidth - 1;
};

carousel.addEventListener('scroll', updateButtons);
window.addEventListener('resize', updateButtons);
updateButtons(); 