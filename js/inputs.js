function validateInput (input, regex, errorMessageElement, errorMessage, customErrorMessage = null) {
    if (customErrorMessage != null){
        input.classList.add('error');
        errorMessageElement.classList.add('show');
        typeText(customErrorMessage, errorMessageElement);
        input.classList.remove('shake');
        void input.offsetWidth; 
        input.classList.add('shake');
        return false;
    }

    if (!regex.test(input.value)) {
        input.classList.add('error');
        errorMessageElement.classList.add('show');
        typeText(errorMessage, errorMessageElement);
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

function baseInputEvents (input){
    input.addEventListener('input', () => {
        input.classList.remove('error');
        input.textContent = '';
        input.classList.remove('show');
    });
    return input;
}