import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../styles/AnalysisForm.module.css";
import Button from "./Button";
import Overlay from "./Overlay";
import { TokenManager } from "../utils/tokenManager";
import { handleFetchError } from "../utils/fetchErrorHandler";
import { ApiClient } from "../utils/ApiClient";
const apiClient = new ApiClient();

const fromUrlGetId = (url) => {
    const parts = url.split("/");
    const catalogIndex = parts.indexOf("catalog");
    if (catalogIndex === -1 || catalogIndex + 1 >= parts.length) return null;
    const id = parts[catalogIndex + 1];
    return /^\d+$/.test(id) ? parseInt(id, 10) : null;
};

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
    return `https://${domain}/vol${Math.floor(nomenclature / 100000)}/part${Math.floor(nomenclature / 1000)}/${nomenclature}/images/big/1.webp`;
};

// Генерация URL с явным basket-номером
const getPhotoUrlWithoutUrl = (nomenclature, id) => {
    return `https://basket-${id}.wbbasket.ru/vol${Math.floor(nomenclature / 100000)}/part${Math.floor(nomenclature / 1000)}/${nomenclature}/images/big/1.webp`;
};

// Асинхронная функция получения URL изображения
const getAllPhotoUrl = async (nomenclature) => {
    let url = getPhotoUrl(nomenclature);
    while (true) {
        const wbResponse = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
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
    console.log("Resolved photo URL:", url);
    return url;
};

// Основной компонент
export default function AnalysisForm({ onReset, onFill }) {
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
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
    const [controller, setController] = useState(null);

    // Форматирование сообщения об ошибке
    const formatErrorMessage = (error) => {
        if (!error) return "Произошла неизвестная ошибка";

        let message = "";
        if (typeof error === "string") {
            message = error;
        } else if (error.message) {
            message = error.message;
        } else {
            return "Произошла неизвестная ошибка";
        }

        // Удаляем undefined и null из сообщения
        message = message.replace(/undefined|null/g, "");
        // Удаляем двойные пробелы
        message = message.replace(/\s+/g, " ").trim();
        // Делаем первую букву заглавной
        return message.charAt(0).toUpperCase() + message.slice(1);
    };

    // Анимированное отображение сообщения об ошибке
    const showError = async (errorMessage) => {
        const formattedError = formatErrorMessage(errorMessage);
        if (!formattedError) return;

        setError("");
        for (let i = 0; i < formattedError.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 30));
            setError((prev) => prev + formattedError[i]);
        }
    };

    // Функция сброса всех состояний
    const resetForm = () => {
        setInput("");
        setError("");
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
        if (controller) {
            controller.abort();
            setController(null);
        }
        localStorage.removeItem("sseTaskId");
        if (inputRef.current) inputRef.current.value = "";
    };

    // Функция заполнения формы данными из API
    const fillForm = (data) => {
        const url = "https://www.wildberries.ru/catalog/" + data.main.id + "/detail.aspx";
        const mainId = fromUrlGetId(url);
        if (!mainId) {
            setError("Некорректный URL в данных задачи");
            return;
        }

        setInput(url);
        setError("");
        setResults(["Результат анализа товара"]);
        setDisplayedResults(["Результат анализа товара"]);
        setIsOverlayVisible(true);
        setIsMovedUp(true);
        setIsLoading(false);
        if (data.isRestored) {
            setIsRestoredTask(true); // Устанавливаем флаг восстановленной задачи только если задача восстановлена
        } else {
            setIsRestoredTask(false); // Сбрасываем флаг для новых задач
        }
        setCurrentTaskId(data.id); // Сохраняем id задачи

        // Устанавливаем основные данные товара
        setMainData(data.main);

        // Устанавливаем данные о товарах
        setCarouselItems(
            data.products.map((product) => ({
                id: product.id,
                root: product.root,
                name: product.name,
                brand: product.brand,
                price: product.price,
                reviewRating: product.reviewRating,
                description: product.description,
            })),
        );

        // Получаем URL фотографий для товаров
        const fetchPhotos = async () => {
            try {
                const urls = await Promise.all(data.products.map((item) => getAllPhotoUrl(item.id)));
                setPhotoUrls(urls);
            } catch (error) {
                console.error("Error fetching photo URLs:", error);
            }
        };
        fetchPhotos();

        // Устанавливаем списки слов
        setUsedWords(data.usedWords || []);
        setUnusedWords(data.unusedWords || []);
        setCurrentWords({
            used: data.usedWords || [],
            unused: data.unusedWords || [],
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
                method: "GET",
                headers: { "Content-Type": "application/json" },
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
            throw new Error("Не удалось получить данные главного товара");
        }

        const wbData = await wbResponse.json();
        return {
            id: wbData.nm_id,
            root: wbData.imt_id,
            name: wbData.imt_name,
            description: wbData.description,
            brand: "",
            brandId: 0,
            price: 0.0,
            reviewRating: 0.0,
        };
    };

    // Получение слов с сервера
    const fetchWordsFromServer = async (productId, token) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/v1/get/words/${encodeURIComponent(productId)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Ошибка авторизации. Пожалуйста, войдите снова.");
                }
                const errorData = await response.json();
                throw new Error(errorData.message || "Ошибка сервера при получении слов");
            }

            const data = await response.json();
            if (!data) {
                throw new Error("Пустой ответ от сервера");
            }

            return data;
        } catch (error) {
            throw new Error(handleFetchError(error));
        }
    };

    // Поиск продуктов на Wildberries
    const searchWbProducts = async (queries) => {
        try {
            const wbSearchPromises = queries.map(async (query) => {
                const url = `https://search.wb.ru/exactmatch/ru/common/v9/search?ab_daily_autotest=test_group2&appType=1&curr=rub&dest=-2133466&lang=ru&resultset=catalog&sort=popular&spp=30&suppressSpellcheck=false&query=${encodeURIComponent(query)}`;
                const wbResponse = await fetch(url, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!wbResponse.ok) {
                    throw new Error(`Ошибка Wildberries API для ${query}: ${wbResponse.status}`);
                }

                const wbData = await wbResponse.json();
                const wbProducts = wbData.data?.products || [];
                return wbProducts.map((product) => ({
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
        } catch (error) {
            throw new Error(handleFetchError(error));
        }
    };

    // Добавление описаний к продуктам
    const fetchProductDescriptions = async (products) => {
        const descriptionPromises = products.map(async (query) => {
            let url = getCardUrl(query.id);
            let wbResponse;

            while (true) {
                wbResponse = await fetch(url, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
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
                return { ...query, description: "" };
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

    const fetchReviews = async (root) => {
        const endpoints = ["feedbacks2.wb.ru", "feedbacks1.wb.ru"];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`http://${endpoint}/feedbacks/v1/${root}`);

                if (!response.ok) {
                    console.error(`Failed to fetch reviews from ${endpoint}`);
                    continue;
                }

                const data = await response.json();
                if (data?.feedbacks) {
                    return data.feedbacks.map((feedback) => ({
                        text: feedback.text || "",
                        pros: feedback.pros || "",
                        cons: feedback.cons || "",
                    }));
                }
            } catch (error) {
                console.error(`Error fetching reviews from ${endpoint}:`, error);
            }
        }

        return [];
    };

    const fetchMainPhotoUrl = async (mainId) => {
        try {
            const photoUrl = await getAllPhotoUrl(mainId);
            return photoUrl;
        } catch (error) {
            console.error("Error fetching main product photo URL:", error);
            return "";
        }
    };

    const createTaskOnServer = async (mainData, products, usedWords, unusedWords, regenerate = false, currentTaskId = 0) => {
            const mainPhotoUrl = await fetchMainPhotoUrl(mainData.id);
            const reviews = await fetchReviews(mainData.root);
            const enrichedMainData = { ...mainData, image_url: mainPhotoUrl || mainData.image_url, reviews:  reviews};

            const enrichedProducts = await Promise.all(products.map(async (product, index) => {
              const reviews = await fetchReviews(product.root);
              return {
                ...product,
                image_url: photoUrls[index] || product.image_url,
                reviews
              };
            }));
            
             let attempts = 0;
              const maxAttempts = 2;
              while (attempts < maxAttempts) {
                const response = regenerate ? await apiClient.regenerateTask(currentTaskId, enrichedMainData, enrichedProducts, usedWords, unusedWords) : await apiClient.createTask(enrichedMainData, enrichedProducts, usedWords, unusedWords);
                  if (response.type === "ErrorSystem") {
                      addNotification(response.body);
                      return null;
                  }
                  if (response.type === "ErrorToken") {
                      attempts++;
                      const result = await TokenManager.refreshTokens();
                      if (result === "err") {
                          addNotification(response.body);
                          setTimeout(router.replace, 3000, "/login");
                          return null;
                      }
                      if (attempts === maxAttempts) {
                          addNotification(response.body);
                          setTimeout(router.replace, 3000, "/login");
                          return null;
                      }
                      continue;
                  }
            return response;
          }

    };

    const handleDisplayResults = async (index, message) => {
        let targetResult = message;

        if (
            message === "Ожидание ответа по фоткам..." ||
            message === "Ожидание ответа по тексту..." ||
            message === "Ожидание ответа по отзывам..."
        ) {
            return;
        }

        setResults((prev) => {
            const newResults = [...prev];
            const currentMessage = newResults[index];

            if (currentMessage.includes("Ожидание ответа")) {
                newResults[index] = targetResult;
            } else {
                newResults[index] = currentMessage + targetResult;
            }
            return newResults;
        });

        setDisplayedResults((prev) => {
            const newResults = [...prev];
            const currentMessage = newResults[index];

            if (currentMessage.includes("Ожидание ответа")) {
                newResults[index] = targetResult;
            } else {
                newResults[index] = currentMessage + targetResult;
            }
            return newResults;
        });
    };

    const initSSEConnection = async (taskId) => {
        console.log("Starting stream connection");
        try {
            if (controller) {
                controller.abort();
            }

            const newController = new AbortController();
            setController(newController);

            localStorage.setItem("sseTaskId", taskId);

            // Устанавливаем начальные сообщения
            const initialMessages = [
                "Ожидание ответа по фоткам...",
                "Ожидание ответа по тексту...",
                "Ожидание ответа по отзывам...",
            ];
            setResults(initialMessages);
            setDisplayedResults(initialMessages);

            const response = await fetch(`http://localhost:8000/api/v1/information?id=${taskId}`, {
                signal: newController.signal,
                headers: {
                    Accept: "text/plain",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    console.log("Stream completed");
                    break;
                }

                buffer += new TextDecoder().decode(value);
                const messagesArray = buffer.split("\n\n");
                buffer = messagesArray.pop();

                for (const message of messagesArray) {
                    if (message.trim()) {
                        try {
                            const data = JSON.parse(message);
                            if (data.error) {
                                showError(data.error);
                                return;
                            }
                            switch (data.task_type) {
                                case "photo":
                                    handleDisplayResults(0, data.message);
                                    break;
                                case "text":
                                    handleDisplayResults(1, data.message);
                                    break;
                                case "reviews":
                                    handleDisplayResults(2, data.message);
                                    break;
                                case "system":
                                    if (data.message === "done") {
                                        break;
                                    }
                            }
                        } catch (error) {
                            console.error("Failed to parse message:", error, message);
                        }
                    }
                }
            }
        } catch (error) {
            if (error.name === "AbortError") {
                console.log("Fetch aborted");
            } else {
                console.error("Error:", error);
                showError("Соединение потеряно. Попробуйте снова.");
            }
        }
    };

    useEffect(() => {
        const savedTaskId = localStorage.getItem("sseTaskId");
        if (savedTaskId) {
            initSSEConnection(savedTaskId);
        }

        return () => {
            if (controller) {
                controller.abort();
                setController(null);
            }
        };
    }, []);

    const handleAnalyze = async () => {
        if (!requestRegex.test(input)) {
            showError("Вы не ввели корректный URL");
            return;
        }

        const token = localStorage.getItem("accessToken");
        if (!token) {
            showError("Ошибка авторизации");
            return;
        }

        setIsLoading(true);
        try {
            setError("");
            const id = fromUrlGetId(input);
            if (!id) {
                showError("Некорректный URL товара");
                return;
            }

            const mainData = await fetchMainProductData(id);
            setMainData(mainData);

            const words = await fetchWordsFromServer(id, token);
            if (words.length === 0) {
                setError("Увы к сожалению вашего товара нет в списке пожалуйста ожидайте");
                return;
            }

            const usedWordsList = words.slice(0, 10);
            const unusedWordsList = words.slice(10, 30);

            setCurrentWords({
                used: [...usedWordsList],
                unused: [...unusedWordsList],
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
                .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.firstIndex - b.firstIndex))
                .slice(0, 10);

            const productsWithDescriptions = await fetchProductDescriptions(sortedProducts);
            const urls = await Promise.all(productsWithDescriptions.map((item) => getAllPhotoUrl(item.id)));

            setPhotoUrls(urls);
            setCarouselItems(
                productsWithDescriptions.map((product) => ({
                    id: product.id,
                    root: product.root,
                    name: product.name,
                    brand: product.brand,
                    price: product.price,
                    reviewRating: product.reviewRating,
                    description: product.description,
                })),
            );
        } catch (error) {
            setError(error.message);
        } finally {
            setIsSearchingProducts(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setIsLoading(true);
            const createTaskResponse = await createTaskOnServer(
                mainData,
                carouselItems,
                currentWords.used,
                currentWords.unused,
            );
            if (createTaskResponse === null){
              setIsGenerating(false);
              setIsLoading(false);
              return;
            }
            const { id: taskId } = await createTaskResponse.body;
            setCurrentTaskId(taskId);

            initSSEConnection(taskId);
            setIsOverlayVisible(false);
    };

    const handleRegenerate = async () => {
        setIsGenerating(true);
        setIsLoading(true);
        // const { id: taskId } = await createTaskResponse.body;
        const createTaskResponse = await createTaskOnServer(
          mainData,
          carouselItems,
          currentWords.used,
          currentWords.unused,
          true,
          currentTaskId
      );
      if (createTaskResponse === null){
        setIsGenerating(false);
        setIsLoading(false);
        return;
      }
      
            // const mainPhotoUrl = await fetchMainPhotoUrl(mainData.id);
            // const reviews = await fetchReviews(mainData.root);
            // const enrichedMainData = { ...mainData, image_url: mainPhotoUrl || mainData.image_url, reviews:  reviews};

            // const enrichedProducts = await Promise.all(products.map(async (product, index) => {
            //   const reviews = await fetchReviews(product.root);
            //   return {
            //     ...product,
            //     image_url: photoUrls[index] || product.image_url,
            //     reviews
            //   };
            // }));

            // const response = await fetch("http://127.0.0.1:8000/api/v1/regenerate/task/", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json",
            //         Authorization: `Bearer ${token}`,
            //     },
            //     body: JSON.stringify({
            //         id: currentTaskId,
            //         main: enrichedMainData,
            //         products: enrichedProducts,
            //         used_words: currentWords.used,
            //         unused_words: currentWords.unused,
            //     }),
            // });

            // if (!response.ok) {
            //     const errorData = await response.json();
            //     throw new Error(errorData.message || "Ошибка при перегенерации задачи");
            // }

            initSSEConnection(currentTaskId);

            setIsOverlayVisible(false);

            setIsLoading(false);
            setIsGenerating(false);
    };

    const handleWordChange = async (newUsedWords, newUnusedWords) => {
        setCurrentWords({
            used: [...newUsedWords],
            unused: [...newUnusedWords],
        });
        await updateProductsList(newUsedWords);
    };

    const inputShake = { shake: { x: [0, -5, 5, -5, 0], transition: { duration: 0.3, ease: "easeInOut" } } };
    const errorVariants = {
        hidden: { opacity: 0, y: -5 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    };
    const itemVariants = {
        hidden: { scaleY: 0, opacity: 0 },
        visible: { scaleY: 1, opacity: 1, transition: { duration: 0.6, ease: "easeInOut" } },
    };
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
                    className={`${styles.input} ${error ? styles.error : ""}`}
                    variants={inputShake}
                    animate={error ? "shake" : undefined}
                    disabled={isInputDisabled}
                />
                <motion.div
                    className={styles.errorMessage}
                    variants={errorVariants}
                    initial="hidden"
                    animate={error ? "visible" : "hidden"}
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
                            {isInputDisabled ? (isRestoredTask ? "Перегенерировать" : "Генерировать") : "Анализ"}
                        </span>
                        {isLoading && <div className={styles.loading}></div>}
                    </div>
                </Button>
            </div>
            <div className={styles.answerContainer}>
                <AnimatePresence>
                    {displayedResults.map((result, index) => (
                        <motion.div
                            key={index}
                            className={`${styles.horizontalItem} ${
                                index === 0
                                    ? styles.photoBlock
                                    : index === 1
                                      ? styles.textBlock
                                      : index === 2
                                        ? styles.reviewBlock
                                        : ""
                            }`}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                        >
                            <motion.p variants={textVariants} initial="hidden" animate="visible">
                                {result || ""}
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
                            showError("Во время генерации нельзя менять настройки");
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