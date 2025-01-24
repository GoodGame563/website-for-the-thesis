const loginBtn = document.getElementById('login-btn');
const loginContainer = document.getElementById('login-container');
const secondWindow = document.getElementById('second-window');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

function validateInput (input, regex, errorMessageElement, errorMessage) {
    if (!regex.test(input.value)) {
        input.classList.add('error');
        errorMessageElement.textContent = errorMessage;
        errorMessageElement.classList.add('show');
        input.classList.remove('shake');
        void input.offsetWidth; 
        input.classList.add('shake');
        return false;
    } else {
        input.classList.remove('error');
        errorMessageElement.textContent = '';
        errorMessageElement.classList.remove('show');
        return true;
    }
};

emailInput.addEventListener('input', () => {
    emailInput.classList.remove('error');
    emailError.textContent = '';
    emailError.classList.remove('show');
});

passwordInput.addEventListener('input', () => {
    passwordInput.classList.remove('error');
    passwordError.textContent = '';
    passwordError.classList.remove('show');
});

loginBtn.addEventListener('click', (event) => {
    if (loginBtn.disabled) return;

    loginBtn.disabled = true;
    loginBtn.classList.add('disabled');

    const wave = document.createElement('span');
    wave.classList.add('wave-effect');
    const rect = loginBtn.getBoundingClientRect();
    wave.style.left = `${event.clientX - rect.left}px`;
    wave.style.top = `${event.clientY - rect.top}px`;
    loginBtn.appendChild(wave);

    wave.addEventListener('animationend', () => {
        wave.remove();
    });


    const isEmailValid = validateInput(
        emailInput,
        emailRegex,
        emailError,
        'Пожалуйста, введите корректный email.'
    );
    const isPasswordValid = validateInput(
        passwordInput,
        passwordRegex,
        passwordError,
        'Пароль должен содержать букву, цифру и специальный символ.'
    );
    if (!isEmailValid || !isPasswordValid) {
        event.preventDefault();
        console.log(!isEmailValid || !isPasswordValid);
        loginBtn.disabled = false;
        loginBtn.classList.remove('disabled');
        return;
    }
    
    setTimeout(() => {
        loginBtn.classList.add('button-transition'); 
        loginBtn.style.transition = 'all 0.6s ease';

        const buttonText = loginBtn.textContent;
        
        loginBtn.innerHTML = `<span class="button-text">${buttonText}</span>`;
        const buttonTextSpan = loginBtn.querySelector('.button-text');
        buttonTextSpan.style.display = 'inline-block';
        buttonTextSpan.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        buttonTextSpan.style.transformOrigin = 'center';
        buttonTextSpan.style.opacity = '1';

        setTimeout(() => {
            buttonTextSpan.style.transform = 'scale(0)';
            buttonTextSpan.style.opacity = '0';

            setTimeout(() => {
                loginBtn.innerHTML = '<div class="loading"></div>';
                const loader = loginBtn.querySelector('.loading');
                loader.style.width = '0';
                loader.style.height = '0';
                loader.style.opacity = '0';
                loader.style.transition = 'width 0.4s ease, height 0.4s ease, opacity 0.4s ease';

                setTimeout(() => {
                    loader.style.width = '6rem'; 
                    loader.style.height = '6rem'; 
                    loader.style.opacity = '1'; 
                    setTimeout(() => {
                        loader.style.opacity = '0';
                        loader.style.transition = 'opacity 0.6s ease';

                        setTimeout(() => {
                            loader.remove();
                            const resultContainer = loginBtn;
                            if (isEmailValid && isPasswordValid) {

                            } else {
                                resultContainer.innerHTML = `
                                    <div class="icon cross">
                                        <div class="line cross-show"></div>
                                        <div class="line cross-show"></div>
                                    </div>`;
                            }
                            loginContainer.appendChild(resultContainer);
                        }, 600);
                    }, 2000);
                }, 50);
            }, 400); 
        }, 400); 
        return;
        
    }, 400); 
});