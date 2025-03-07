import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/AnalysisForm.module.css';
import Button from './Button';
import Overlay from './Overlay';

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
  return "basket-18.wbbasket.ru";
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
  const [usedWords, setUsedWords] = useState([]);
  const [unusedWords, setUnusedWords] = useState([]);
  const inputRef = useRef(null);
  const requestRegex = /^.{20,300}$/;

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
    if (inputRef.current) inputRef.current.value = '';
  };

  // Функция заполнения формы данными из API
  const fillForm = (data) => {
    const mainId = fromUrlGetId(data.main.url); // Извлекаем ID из URL
    if (!mainId) {
      setError('Некорректный URL в данных задачи');
      return;
    }
    setInput(data.main.url); // Устанавливаем полный URL из main.url
    setError('');
    setResults(['Результат анализа товара']);
    setDisplayedResults(['Результат анализа товара']);
    setIsOverlayVisible(true);
    setIsMovedUp(true);
    setIsLoading(false);
    setCarouselItems(data.products.map(product => ({
      id: fromUrlGetId(product.url), // Извлекаем ID из URL продуктов
      name: product.name,
      brand: product.brand,
      price: product.price,
      reviewRating: product.reviewRating,
      description: product.description,
    })));
    setUsedWords(data.usedWords || []);
    setUnusedWords(data.unusedWords || []);
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

  const handleAnalyze = async () => {
    if (!requestRegex.test(input)) {
      setError('Вы не ввели корректный URL');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Ошибка авторизации');
      return;
    }

    setIsLoading(true);
    try {
      setError('');
      const id = fromUrlGetId(input);
      if (!id) {
        setError('Вы не ввели корректный URL');
        return;
      }
      console.log('Extracted ID:', id);

      const mainData = await fetchMainProductData(id);
      console.log('Main product data:', mainData);

      const words = await fetchWordsFromServer(id, token);
      console.log('Words from server:', words);
      if (words.length === 0) {
        setError('Увы к сожалению вашего товара нет в списке пожалуйста ожидайте');
        return;
      }

      const newResults = words.length === 0
        ? ['Увы к сожалению вашего товара нет в списке пожалуйста ожидайте']
        : ['Результат анализа товара'];
      setResults(newResults);
      setIsMovedUp(true);
      setDisplayedResults(newResults.map(() => ''));

      const firstTenWords = words.slice(0, 10);
      const allWbProducts = await searchWbProducts(firstTenWords);

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
      console.log('Top 10 products:', sortedProducts);

      const productsWithDescriptions = await fetchProductDescriptions(sortedProducts);
      console.log('Products with descriptions:', productsWithDescriptions);

      const usedWordsList = words.slice(0, 10);
      const unusedWordsList = words.slice(10, 30);
      const createTaskResponse = await createTaskOnServer(
        mainData,
        productsWithDescriptions,
        usedWordsList,
        unusedWordsList,
        token
      );
      console.log('Task response:', createTaskResponse);

      setCarouselItems(productsWithDescriptions.map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        reviewRating: product.reviewRating,
        description: product.description,
      })));
      setUsedWords(usedWordsList);
      setUnusedWords(unusedWordsList);
      setIsOverlayVisible(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (results.length > 0 && displayedResults.length > 0) {
      results.forEach((result, index) => {
        const chars = result.split('');
        chars.forEach((char, charIndex) => {
          setTimeout(() => {
            setDisplayedResults(prev =>
              prev.map((text, i) => (i === index ? text + char : text))
            );
          }, charIndex * 50 + index * 1000);
        });
      });
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
        />
        <motion.div
          className={styles.errorMessage}
          variants={errorVariants}
          initial="hidden"
          animate={error ? 'visible' : 'hidden'}
        >
          {error}
        </motion.div>
        <Button onClick={handleAnalyze} disabled={isLoading} isLoading={isLoading}>
          <div className={styles.buttonContent}>
            <span>Анализ</span>
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
        <Button className={styles.settingsBtn} onClick={() => setIsOverlayVisible(true)}>
          Настройки
        </Button>
      )}
      {isOverlayVisible && (
        <Overlay
          onClose={() => setIsOverlayVisible(false)}
          carouselItems={carouselItems}
          usedWords={usedWords}
          unusedWords={unusedWords}
        />
      )}
    </div>
  );
}