const loginBtn = baseButtonsEvents(document.getElementById('login-btn'));
const loginContainer = document.getElementById('login-container');
const secondWindow = document.getElementById('second-window');
const emailInput = baseInputEvents(document.getElementById('email'));
const passwordInput = baseInputEvents(document.getElementById('password'));
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{2,}$/;



loginBtn.addEventListener('click', async (event) => {
    if (loginBtn.disabled) return;

    loginBtn.disabled = true;
    loginBtn.classList.add('disabled');

    const isEmailValid = validateInput(
        emailInput,
        emailRegex,
        emailError,
        'Пожалуйста, введите корректный email.'
    );
    // const isPasswordValid = validateInput(
    //     passwordInput,
    //     passwordRegex,
    //     passwordError,
    //     'Пароль должен содержать букву, цифру и специальный символ.'
    // );
    const isPasswordValid = true;

    if (!isEmailValid || !isPasswordValid) {
        event.preventDefault();
        loginBtn.disabled = false;
        loginBtn.classList.remove('disabled');
        return;
    }

    try {
        // Собираем данные для запроса
        const formData = {
            email: emailInput.value,
            password: passwordInput.value,
            browser: navigator.userAgent,
            device: navigator.platform,
            os: navigator.oscpu || 'Unknown OS'
        };

        // Запускаем анимацию загрузки
        startLoginAnimation(loginBtn);

        // Отправляем запрос на сервер
        const response = await fetch('http://localhost:8000/authorization', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
            mode: 'cors', // Явно указываем режим CORS
            credentials: 'include' // Если используются куки
        });

        if (!response.ok) {
            const error = await response.json();
            // handleLoginError(error, loginBtn);
            throw "Возраст должен быть положительным";
            // throw new Error(error.message || 'Ошибка сервера');
        }

        const data = await response.json();
        console.log(data);
        // Сохраняем токены
        localStorage.setItem('accessToken', data.Ok.accessToken.token);
        localStorage.setItem('refreshToken', data.Ok.refreshToken.token);

        // Успешный вход - переходим к следующему окну
        showSuccessAnimation(loginBtn, () => {
            nextToContainer('window-1', 'window-2');
        });

    } catch (error) {
        handleLoginError(error, loginBtn);
    }
});

// Функции для анимаций и обработки ошибок
function startLoginAnimation(button) {
    button.classList.add('button-transition');
    button.innerHTML = '<div class="loading"></div>';
    const loader = button.querySelector('.loading');
    loader.style.width = '6rem';
    loader.style.height = '6rem';
    loader.style.opacity = '1';
}

function showSuccessAnimation(button, callback) {
    button.innerHTML = `
        <div class="icon checkmark">
            <div class="checkmark-stem"></div>
            <div class="checkmark-kick"></div>
        </div>`;
    setTimeout(callback, 1000);
}

function handleLoginError(error, button) {
    console.error('Login error:', error);
    button.innerHTML = `
        <div class="icon cross">
            <div class="line cross-show"></div>
            <div class="line cross-show"></div>
        </div>`;
    
    setTimeout(() => {
        button.disabled = false;
        button.classList.remove('disabled');
        button.classList.remove('button-transition');
        button.innerHTML = 'Войти';
    }, 3000);

    // Здесь можно добавить отображение ошибки пользователю
    // alert(error.message || 'Ошибка входа. Проверьте данные и попробуйте снова.');
}
