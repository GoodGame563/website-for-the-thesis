export const handleFetchError = (error) => {
  if (error.message === 'Failed to fetch') {
    return '  Сервер сейчас не доступен. Пожалуйста, проверьте своё интернет-соединение.';
  }
  return error.message;
};