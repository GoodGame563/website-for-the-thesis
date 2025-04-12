import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/AnalysisForm.module.css';
import Button from './Button';
import Overlay from './Overlay';
import { TokenManager } from '../utils/tokenManager';

// Извлечение ID из URL
const fromUrlGetId = (url) => {
  const parts = url.split('/');
  const catalogIndex = parts.indexOf('catalog');
  if (catalogIndex === -1 || catalogIndex + 1 >= parts.length) return null;
  const id = parts[catalogIndex + 1];
  return /^\d+$/.test(id) ? parseInt(id, 10) : null;
};

// Определение домена Wildberries
const getUrl = (nomenclature) => {
  if (0 <= nomenclature && nomenclature <= 143) return "basket-01.wbbasket.ru";
  if (144 <= nomenclature && nomenclature <= 287) return "basket-02.wbbasket.ru";
  if (288 <= nomenclature && nomenclature <= 431) return "basket-03.wbbasket.ru";
  if (432 <= nomenclature && nomenclature <= 719) return "basket-04.wbbasket.ru";
  if (720 <= nomenclature && nomenclature <= 1007) return "basket-05.wbbasket.ru";
  if (1008 <= nomenclature && nomenclature <= 1061) return "basket-06.wbbasket.ru";
  if (1062 <= nomenclature && nomenclature <= 1115) return "basket-07.wbbasket.ru";
  if (1116 <= nomenclature && nomenclature <= 1169) return "basket-08.wbbasket.ru";
  if (1170 <= nomenclature && nomenclature <= 1313) return "basket-09.wbbasket.ru";
  if (1314 <= nomenclature && nomenclature <= 1601) return "basket-10.wbbasket.ru";
  if (1602 <= nomenclature && nomenclature <= 1655) return "basket-11.wbbasket.ru";
  if (1656 <= nomenclature && nomenclature <= 1919) return "basket-12.wbbasket.ru";
  if (1920 <= nomenclature && nomenclature <= 2045) return "basket-13.wbbasket.ru";
  if (2046 <= nomenclature && nomenclature <= 2189) return "basket-14.wbbasket.ru";
  if (2190 <= nomenclature && nomenclature <= 2405) return "basket-15.wbbasket.ru";
  if (2406 <= nomenclature && nomenclature <= 2621) return "basket-16.wbbasket.ru";
  if (2622 <= nomenclature && nomenclature <= 2837) return "basket-17.wbbasket.ru";
  if (2838 <= nomenclature && nomenclature <= 3053) return "basket-18.wbbasket.ru";
  if (3054 <= nomenclature && nomenclature <= 3269) return "basket-19.wbbasket.ru";
  if (3270 <= nomenclature && nomenclature <= 3485) return "basket-20.wbbasket.ru";
  return "basket-21.wbbasket.ru";
};

// Генерация URL карточки
const getCardUrl = (nomenclature) => {
  const domain = getUrl(Math.floor(nomenclature / 100000));
  return `https://${domain}/vol${Math.floor(nomenclature / 100000)}/part${Math.floor(nomenclature / 1000)}/${nomenclature}/info/ru/card.json`;
};

// Генерация URL с явным basket-номером
const getCardUrlWithoutUrl = (nomenclature, id) => {
  return `https://basket-${id}.wbbasket.ru/vol${Math.floor(nomenclature / 100000)}/part${Math.floor(nomenclature / 1000)}/${nomenclature}/info/ru/card.json`;
};

// Генерация URL без явного basket-номера
const getPhotoUrl = (nomenclature) => {
  const domain = getUrl(Math.floor(nomenclature / 100000));
  return `https://${domain}/vol${Math.floor(nomenclature / 100000)}/part${Math.floor(nomenclature / 1000)}/${nomenclature}/images/c246x328/1.webp`;
};

// Генерация URL с явным basket-номером
const getPhotoUrlWithoutUrl = (nomenclature, id) => {
  return `https://basket-${id}.wbbasket.ru/vol${Math.floor(nomenclature / 100000)}/part${Math.floor(nomenclature / 1000)}/${nomenclature}/images/c246x328/1.webp`;
};

// Асинхронная функция получения URL изображения
const getAllPhotoUrl = async (nomenclature) => {
  let url = getPhotoUrl(nomenclature);
  while (true) {
    const wbResponse = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!wbResponse.ok && wbResponse.status === 404) {
      const match = url.match(/\d+/);
      let number = match ? Number(match[0]) : null;
      number = number + 1;
      if (number > 30) break;
      url = getPhotoUrlWithoutUrl(nomenclature, number);
      continue;
    }
    if (wbResponse.ok) break;
  }
  console.log('Resolved photo URL:', url);
  return url;
};

// Основной компонент
export default function AnalysisForm({ onReset, onFill }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isMovedUp, setIsMovedUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [carouselItems, setCarouselItems] = useState([]);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [usedWords, setUsedWords] = useState([]);
  const [unusedWords, setUnusedWords] = useState([]);
  const inputRef = useRef(null);
  const requestRegex = /^.{20,300}$/;
  const [currentlyTyping, setCurrentlyTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [currentWords, setCurrentWords] = useState({ used: [], unused: [] });
  const [mainData, setMainData] = useState(null);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isRestoredTask, setIsRestoredTask] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);

  // Форматирование сообщения об ошибке
  const formatErrorMessage = (error) => {
    if (!error) return 'Произошла неизвестная ошибка';
    
    let message = '';
    if (typeof error === 'string') {
      message = error;
    } else if (error.message) {
      message = error.message;
    } else {
      return 'Произошла неизвестная ошибка';
    }
    
    // Удаляем undefined и null из сообщения
    message = message.replace(/undefined|null/g, '');
    // Удаляем двойные пробелы
    message = message.replace(/\s+/g, ' ').trim();
    // Делаем первую букву заглавной
    return message.charAt(0).toUpperCase() + message.slice(1);
  };

  // Анимированное отображение сообщения об ошибке
  const showError = async (errorMessage) => {
    const formattedError = formatErrorMessage(errorMessage);
    if (!formattedError) return;
    
    setError('');
    for (let i = 0; i < formattedError.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      setError(prev => prev + formattedError[i]);
    }
  };

  // Функция сброса всех состояний
  const resetForm = () => {
    setInput('');
    setError('');
    setResults([]);
    setDisplayedResults([]);
    setIsOverlayVisible(false);
    setIsMovedUp(false);
    setIsLoading(false);
    setCarouselItems([]);
    setUsedWords([]);
    setUnusedWords([]);
    setCurrentWords({ used: [], unused: [] });
    setMainData(null);
    setIsInputDisabled(false);
    setIsGenerating(false);
    setIsSearchingProducts(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Функция заполнения формы данными из API
  const fillForm = (data) => {
    const url = "https://www.wildberries.ru/catalog/"+data.main.id+"/detail.aspx";
    const mainId = fromUrlGetId(url);
    if (!mainId) {
      setError('Некорректный URL в данных задачи');
      return;
    }

    setInput(url);
    setError('');
    setResults(['Результат анализа товара']);
    setDisplayedResults(['Результат анализа товара']);
    setIsOverlayVisible(true);
    setIsMovedUp(true);
    setIsLoading(false);
    setIsRestoredTask(true); // Устанавливаем флаг восстановленной задачи
    setCurrentTaskId(data.id); // Сохраняем id задачи
    
    // Устанавливаем основные данные товара
    setMainData(data.main);
    
    // Устанавливаем данные о товарах
    setCarouselItems(data.products.map(product => ({
      id: product.id,
      root: product.root,
      name: product.name,
      brand: product.brand,
      price: product.price,
      reviewRating: product.reviewRating,
      description: product.description,
    })));

    // Получаем URL фотографий для товаров
    const fetchPhotos = async () => {
      try {
        const urls = await Promise.all(data.products.map(item => getAllPhotoUrl(item.id)));
        setPhotoUrls(urls);
      } catch (error) {
        console.error('Error fetching photo URLs:', error);
      }
    };
    fetchPhotos();

    // Устанавливаем списки слов
    setUsedWords(data.usedWords || []);
    setUnusedWords(data.unusedWords || []);
    setCurrentWords({
      used: data.usedWords || [],
      unused: data.unusedWords || []
    });
    
    setIsInputDisabled(true);
  };

  // Передаем функции через пропсы
  useEffect(() => {
    if (onReset) {
      onReset.current = resetForm;
    }
    if (onFill) {
      onFill.current = fillForm;
    }
  }, [onReset, onFill]);

  // Получение данных главного товара
  const fetchMainProductData = async (productId) => {
    let url = getCardUrl(productId);
    let wbResponse;

    while (true) {
      wbResponse = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!wbResponse.ok && wbResponse.status === 404) {
        const match = url.match(/\d+/);
        let number = match ? Number(match[0]) : null;
        number = number + 1;
        if (number > 30) break;
        url = getCardUrlWithoutUrl(productId, number);
        continue;
      }

      if (!wbResponse.ok) {
        console.log(`Ошибка Wildberries API для ${productId}: ${wbResponse.status}`);
        break;
      }

      if (wbResponse.ok) break;
    }

    if (!wbResponse || !wbResponse.ok) {
      throw new Error('Не удалось получить данные главного товара');
    }

    const wbData = await wbResponse.json();
    return {
      id: wbData.nm_id,
      root: wbData.imt_id,
      name: wbData.imt_name,
      description: wbData.description,
      brand: '',
      brandId: 0,
      price: 0.0,
      reviewRating: 0.0,
    };
  };

  // Получение слов с сервера
  const fetchWordsFromServer = async (productId, token) => {
    const response = await fetch(`http://127.0.0.1:8000/get/words/${encodeURIComponent(productId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка сервера при получении слов');
    }

    return await response.json() || [];
  };

  // Поиск продуктов на Wildberries
  const searchWbProducts = async (queries) => {
    const wbSearchPromises = queries.map(async (query) => {
      const url = `https://search.wb.ru/exactmatch/ru/common/v9/search?ab_daily_autotest=test_group2&appType=1&curr=rub&dest=-2133466&lang=ru&resultset=catalog&sort=popular&spp=30&suppressSpellcheck=false&query=${encodeURIComponent(query)}`;
      const wbResponse = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!wbResponse.ok) {
        throw new Error(`Ошибка Wildberries API для ${query}: ${wbResponse.status}`);
      }

      const wbData = await wbResponse.json();
      const wbProducts = wbData.data?.products || [];
      return wbProducts.map(product => ({
        id: product.id,
        root: product.root,
        reviewRating: product.reviewRating,
        name: product.name,
        brand: product.brand,
        brandId: product.brandId,
        price: product.sizes[0]?.price.total || 0,
      }));
    });

    const wbResults = await Promise.all(wbSearchPromises);
    return wbResults.flat();
  };

  // Добавление описаний к продуктам
  const fetchProductDescriptions = async (products) => {
    const descriptionPromises = products.map(async (query) => {
      let url = getCardUrl(query.id);
      let wbResponse;

      while (true) {
        wbResponse = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!wbResponse.ok && wbResponse.status === 404) {
          const match = url.match(/\d+/);
          let number = match ? Number(match[0]) : null;
          number = number + 1;
          if (number > 30) break;
          url = getCardUrlWithoutUrl(query.id, number);
          continue;
        }

        if (!wbResponse.ok) {
          console.log(`Ошибка Wildberries API для ${query.id}: ${wbResponse.status}`);
          break;
        }

        if (wbResponse.ok) break;
      }

      if (!wbResponse || !wbResponse.ok) {
        return { ...query, description: '' };
      }

      const wbData = await wbResponse.json();
      return {
        id: query.id,
        root: query.root,
        reviewRating: query.reviewRating,
        name: query.name,
        brand: query.brand,
        brandId: query.brandId,
        price: query.price,
        description: wbData.description,
      };
    });

    return await Promise.all(descriptionPromises);
  };

  // Создание задачи на сервере
  const createTaskOnServer = async (mainData, products, usedWords, unusedWords, token) => {
    const response = await fetch(`http://127.0.0.1:8000/create/task/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        main: mainData,
        products,
        used_words: usedWords,
        unused_words: unusedWords,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка создания задачи');
    }
    return response;
  };

  const sendRequest = async (input) => {
    const token = await TokenManager.getValidAccessToken();
    if (!token) {
      throw new Error('Ошибка авторизации');
    }
  
    const response = await fetch(`http://127.0.0.1:8000/create/task/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        main: mainData,
        products,
        used_words: usedWords,
        unused_words: unusedWords,
      }),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка создания задачи');
    }
    return response;
  };

  const handleAnalyze = async () => {
    if (!requestRegex.test(input)) {
      showError('Вы не ввели корректный URL');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      showError('Ошибка авторизации');
      return;
    }

    setIsLoading(true);
    try {
      setError('');
      const id = fromUrlGetId(input);
      if (!id) {
        showError('Некорректный URL товара');
        return;
      }

      const mainData = await fetchMainProductData(id);
      setMainData(mainData);

      const words = await fetchWordsFromServer(id, token);
      if (words.length === 0) {
        setError('Увы к сожалению вашего товара нет в списке пожалуйста ожидайте');
        return;
      }

      // Take first 10 words as used and rest as unused, maintaining order
      const usedWordsList = words.slice(0, 10);
      const unusedWordsList = words.slice(10, 30);

      setCurrentWords({
        used: [...usedWordsList],
        unused: [...unusedWordsList]
      });

      await updateProductsList(usedWordsList);

      setUsedWords(usedWordsList);
      setUnusedWords(unusedWordsList);

      setIsInputDisabled(true);
      setIsOverlayVisible(true);
      setIsMovedUp(true);

    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProductsList = async (wordsToUse) => {
    setIsSearchingProducts(true);
    try {
      const allWbProducts = await searchWbProducts(wordsToUse);

      const productFrequency = {};
      allWbProducts.forEach((product, index) => {
        const key = `${product.id}-${product.brand}`;
        if (!productFrequency[key]) {
          productFrequency[key] = { ...product, count: 0, firstIndex: index };
        }
        productFrequency[key].count += 1;
      });

      const sortedProducts = Object.values(productFrequency)
        .sort((a, b) => b.count !== a.count ? b.count - a.count : a.firstIndex - b.firstIndex)
        .slice(0, 10);

      const productsWithDescriptions = await fetchProductDescriptions(sortedProducts);
      const urls = await Promise.all(productsWithDescriptions.map(item => getAllPhotoUrl(item.id)));
      
      setPhotoUrls(urls);
      setCarouselItems(productsWithDescriptions.map(product => ({
        id: product.id,
        root: product.root,
        name: product.name,
        brand: product.brand,
        price: product.price,
        reviewRating: product.reviewRating,
        description: product.description,
      })));
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSearchingProducts(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Ошибка авторизации');

      const createTaskResponse = await createTaskOnServer(
        mainData,
        carouselItems,
        currentWords.used,
        currentWords.unused,
        token
      );
      
      setResults(['Результат анализа товара']);
      setDisplayedResults(['']);
      setIsOverlayVisible(false);
      
    } catch (error) {
      setError(error.message);
      setIsGenerating(false); // Разблокируем настройки при ошибке
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Ошибка авторизации');

      // Отправляем запрос на перегенерацию
      console.log(currentTaskId)
      const response = await fetch('http://127.0.0.1:8000/regenerate/task/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: currentTaskId,
          main: mainData,
          products: carouselItems,
          used_words: currentWords.used,
          unused_words: currentWords.unused,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при перегенерации задачи');
      }

      setResults(['Результат перегенерации товара']);
      setDisplayedResults(['']);
      setIsOverlayVisible(false);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const handleWordChange = async (newUsedWords, newUnusedWords) => {
    setCurrentWords({
      used: [...newUsedWords], // Use spread to maintain array order
      unused: [...newUnusedWords]
    });
    await updateProductsList(newUsedWords);
  };

  useEffect(() => {
    if (results.length > 0 && !currentlyTyping) {
      setCurrentlyTyping(true);
      const animateText = async () => {
        for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
          const result = results[resultIndex];
          setDisplayedResults(prev => {
            const newResults = [...prev];
            newResults[resultIndex] = '';
            return newResults;
          });
          
          for (let charIndex = 0; charIndex < result.length; charIndex++) {
            await new Promise(resolve => setTimeout(resolve, 50));
            setDisplayedResults(prev => {
              const newResults = [...prev];
              newResults[resultIndex] = result.slice(0, charIndex + 1);
              return newResults;
            });
          }
          
          // Пауза между строками
          if (resultIndex < results.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        setCurrentlyTyping(false);
      };
      
      animateText();
    }
  }, [results]);

  const inputShake = { shake: { x: [0, -5, 5, -5, 0], transition: { duration: 0.3, ease: 'easeInOut' } } };
  const errorVariants = { hidden: { opacity: 0, y: -5 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeInOut' } } };
  const itemVariants = { hidden: { scaleY: 0, opacity: 0 }, visible: { scaleY: 1, opacity: 1, transition: { duration: 0.6, ease: 'easeInOut' } } };
  const textVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.1 } } };

  return (
    <div className={styles.max}>
      <div className={`${styles.container} ${isMovedUp ? styles.movedUp : styles.center}`}>
        <h1>Анализ товара</h1>
        <motion.input
          ref={inputRef}
          type="text"
          placeholder="Введите данные для анализа"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`${styles.input} ${error ? styles.error : ''}`}
          variants={inputShake}
          animate={error ? 'shake' : undefined}
          disabled={isInputDisabled}
        />
        <motion.div
          className={styles.errorMessage}
          variants={errorVariants}
          initial="hidden"
          animate={error ? 'visible' : 'hidden'}
        >
          {error}
        </motion.div>
        <Button 
          onClick={isInputDisabled ? (isRestoredTask ? handleRegenerate : handleGenerate) : handleAnalyze} 
          disabled={isLoading} 
          isLoading={isLoading}
        >
          <div className={styles.buttonContent}>
            <span>
              {isInputDisabled 
                ? (isRestoredTask ? 'Перегенерировать' : 'Генерировать') 
                : 'Анализ'}
            </span>
            {isLoading && <div className={styles.loading}></div>}
          </div>
        </Button>
      </div>
      <div className={styles.answerContainer}>
        <AnimatePresence>
          {results.map((result, index) => (
            <motion.div
              key={index}
              className={styles.horizontalItem}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.p variants={textVariants} initial="hidden" animate="visible">
                {displayedResults[index] || ''}
              </motion.p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {isMovedUp && (
        <Button 
          className={styles.settingsBtn} 
          onClick={() => {
            if (isGenerating) {
              showError('Во время генерации нельзя менять настройки');
              return;
            }
            setIsOverlayVisible(true);
          }}
          disabled={isGenerating}
        >
          Настройки
        </Button>
      )}
      {isOverlayVisible && (
        <Overlay
          onClose={() => setIsOverlayVisible(false)}
          carouselItems={carouselItems}
          photoUrls={photoUrls}
          usedWords={currentWords.used}
          unusedWords={currentWords.unused}
          onWordChange={handleWordChange}
          isGenerating={isGenerating}
          isSearchingProducts={isSearchingProducts}
          setIsSearchingProducts={setIsSearchingProducts}
        />
      )}
    </div>
  );
}