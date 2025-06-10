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


const getCardUrl = (nomenclature) => {
    const domain = getUrl(Math.floor(nomenclature / 100000));
    return `https://${domain}/vol${Math.floor(nomenclature / 100000)}/part${Math.floor(nomenclature / 1000)}/${nomenclature}/info/ru/card.json`;
};


const getCardUrlWithoutUrl = (nomenclature, id) => {
    return `https://basket-${id}.wbbasket.ru/vol${Math.floor(nomenclature / 100000)}/part${Math.floor(nomenclature / 1000)}/${nomenclature}/info/ru/card.json`;
};


const getPhotoUrl = (nomenclature) => {
    const domain = getUrl(Math.floor(nomenclature / 100000));
    return `https://${domain}/vol${Math.floor(nomenclature / 100000)}/part${Math.floor(nomenclature / 1000)}/${nomenclature}/images/big/1.webp`;
};


const getPhotoUrlWithoutUrl = (nomenclature, id) => {
    return `https://basket-${id}.wbbasket.ru/vol${Math.floor(nomenclature / 100000)}/part${Math.floor(nomenclature / 1000)}/${nomenclature}/images/big/1.webp`;
};


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

    const [hoveredBlock, setHoveredBlock] = useState(null); 
    const [expandedBlock, setExpandedBlock] = useState(null); 

    const [isDone, setIsDone] = useState(false);

    useEffect(() => {
        if (expandedBlock === null) return;
        const handleClick = (e) => {
            if (!e.target.closest('.' + styles.horizontalItem)) {
                setExpandedBlock(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [expandedBlock]);

    const SSE_MESSAGES_KEY = "sseMessages";

    function getSseMessagesFromStorage() {
        const raw = localStorage.getItem(SSE_MESSAGES_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
    function clearSseMessagesInStorage() {
        localStorage.removeItem(SSE_MESSAGES_KEY);
    }

    function saveSseMessageToStorage(newMessage, index) {
        let messages = getSseMessagesFromStorage();
        if (!Array.isArray(messages) || messages.length !== 3) {
            messages = ["", "", ""];
        }
        messages[index] = messages[index]
            ? messages[index] + newMessage
            : newMessage;
        localStorage.setItem(SSE_MESSAGES_KEY, JSON.stringify(messages));
        setDisplayedResults(messages);
    }

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

    
        message = message.replace(/undefined|null/g, "");
    
        message = message.replace(/\s+/g, " ").trim();
        return message.charAt(0).toUpperCase() + message.slice(1);
    };


    const showError = async (errorMessage) => {
        const formattedError = formatErrorMessage(errorMessage);
        if (!formattedError) return;

        setError("");
        for (let i = 0; i < formattedError.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 30));
            setError((prev) => prev + formattedError[i]);
        }
    };

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
        localStorage.removeItem("productAnalysisUrl"); 
        setIsRestoredTask(false); 
        if (inputRef.current) inputRef.current.value = "";
    };

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
            setIsRestoredTask(true); 
        } else {
            setIsRestoredTask(false);
        }
        setCurrentTaskId(data.id); 

        
        setMainData(data.main);

       
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

        const fetchPhotos = async () => {
            try {
                const urls = await Promise.all(data.products.map((item) => getAllPhotoUrl(item.id)));
                setPhotoUrls(urls);
            } catch (error) {
                console.error("Error fetching photo URLs:", error);
            }
        };
        fetchPhotos();

       
        setUsedWords(data.usedWords || []);
        setUnusedWords(data.unusedWords || []);
        setCurrentWords({
            used: data.usedWords || [],
            unused: data.unusedWords || [],
        });
        clearSseMessagesInStorage();
        saveSseMessageToStorage(data.photoAnalyses, 0);
        saveSseMessageToStorage(data.reviewAnalyses, 2);
        saveSseMessageToStorage(data.textAnalyses, 1);

        setIsInputDisabled(true);
    };

    useEffect(() => {
        if (onReset) {
            onReset.current = resetForm;
        }
        if (onFill) {
            onFill.current = fillForm;
        }
    }, [onReset, onFill]);

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

    const fetchWordsFromServer = async (productId) => {
        let attempts = 0;
              const maxAttempts = 2;
              while (attempts < maxAttempts) {
        const response = await apiClient.getWords(productId);
        if (response.type === "ErrorSystem") {
            // addNotification(response.body);
            showError(response.body);
            return null;
        }
         if (response.type === "Error") {
            // addNotification(response.body);
            showError(response.body);
            return null;
        }
        if (response.type === "ErrorToken") {
            attempts++;
            const result = await TokenManager.refreshTokens();
            if (result === "err") {
                // addNotification(response.body);
                showError(response.body);
                setTimeout(router.replace, 3000, "/login");
                return null;
            }
            if (attempts === maxAttempts) {
                // addNotification(response.body);
                showError(response.body);
                setTimeout(router.replace, 3000, "/login");
                return null;
            }
            continue;
        }

        const data = response.body;
        return data;
    }   
    };

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
      const MAX_REVIEWS = 100;
  
      for (const endpoint of endpoints) {
          try {
              const response = await fetch(`http://${endpoint}/feedbacks/v1/${root}`);
  
              if (!response.ok) {
                  console.error(`Failed to fetch reviews from ${endpoint}`);
                  continue;
              }
  
              const data = await response.json();
              if (data?.feedbacks) {
                  return data.feedbacks
                      .slice(0, MAX_REVIEWS)
                      .map((feedback) => ({
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
                    setError(response.body);
                      return null;
                  }
                  if (response.type === "ErrorToken") {
                      attempts++;
                      const result = await TokenManager.refreshTokens();
                      if (result === "err") {
                        setError(response.body);
                          setTimeout(router.replace, 3000, "/login");
                          return null;
                      }
                      if (attempts === maxAttempts) {
                        setError(response.body);
                          setTimeout(router.replace, 3000, "/login");
                          return null;
                      }
                      continue;
                  }
                  if (response.type === "Error"){
                    setError(response.body);
                    return null;
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
            const currentMessage = newResults[index].replace(/<\|im_end\|>/g, "");
            if (currentMessage.includes("Ожидание ответа")) {
                newResults[index] = targetResult;
            } else {
                newResults[index] = currentMessage + targetResult;
            }
            return newResults;
        });

        saveSseMessageToStorage(targetResult, index);
    };
    const handleMessage = async (response) => {
      if (response.type === 'Error' || response.type === 'ErrorSystem') {
        console.error(response.body);
        return;
      }
      if (response.type === 'Ok' && response.bodyType === 'struct') {
        if (response.body.message === "<|im_end|>") return;
        if (response.body.message === "__end__") {
            const info = getSseMessagesFromStorage();
            const taskId = localStorage.getItem("sseTaskId");
            switch (response.body.task_type) {
                case "photo": 
                    await apiClient.postTask(taskId, "photo", info[0])
                    break;
                case "text":
                    await apiClient.postTask(taskId, "text", info[1])
                    break;
                case "reviews":
                    await apiClient.postTask(taskId, "reviews", info[2])
                    break;
            }
            return;
        }
        switch (response.body.task_type) {
            case "photo":
                handleDisplayResults(0, response.body.message);
                break;
            case "text":
                handleDisplayResults(1, response.body.message);
                break;
            case "reviews":
                handleDisplayResults(2, response.body.message);
                break;
            case "system":
                if (response.body.message === "done") {
                    break;
                }
              }
      }
      if (response.type === 'Done') {
        setIsDone(true);
        console.log('Задача завершена');
      }
    };

    const initSSEConnection = async (taskId, restore = false) => {
        console.log("Starting stream connection");
        try {
            if (controller) {
                controller.abort();
            }

            const newController = new AbortController();
            setController(newController);

            localStorage.setItem("sseTaskId", taskId);

            const initialMessages = [
                "Ожидание ответа по фоткам...",
                "Ожидание ответа по тексту...",
                "Ожидание ответа по отзывам...",
            ];
            if (!restore) {
                clearSseMessagesInStorage();
                setResults(initialMessages);
                setDisplayedResults(initialMessages);
            } else {
            }
            const result = await apiClient.streamTaskInformation(taskId, handleMessage);
            console.log(result.body);
            
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
        const savedMessages = getSseMessagesFromStorage();
        const savedProductUrl = localStorage.getItem("productAnalysisUrl");
        if (savedTaskId && savedMessages && Array.isArray(savedMessages)) {
            setResults(savedMessages);
            setDisplayedResults(savedMessages);
            setInput(savedProductUrl || "");
            setIsInputDisabled(true);
            setIsMovedUp(true);
            setIsOverlayVisible(false);
            initSSEConnection(savedTaskId, true);
        } else if (savedProductUrl) {
            setInput(savedProductUrl);
            setIsInputDisabled(true);
            setIsMovedUp(true);
            setIsOverlayVisible(false);
        } else if (savedTaskId) {
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
        setIsDone(false);
        if (!requestRegex.test(input)) {
            showError("Вы не ввели корректный URL");
            return;
        }

        localStorage.setItem("productAnalysisUrl", input);

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

            const words = await fetchWordsFromServer(id);
            if (words === null) {
                return;
            }
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
        setIsDone(false);
        if (mainData && mainData.id) {
            const url = `https://www.wildberries.ru/catalog/${mainData.id}/detail.aspx`;
            localStorage.setItem("productAnalysisUrl", url);
        }
        clearSseMessagesInStorage();
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
        setIsDone(false);
        if (mainData && mainData.id) {
            const url = `https://www.wildberries.ru/catalog/${mainData.id}/detail.aspx`;
            localStorage.setItem("productAnalysisUrl", url);
        }
        clearSseMessagesInStorage();
        setIsGenerating(true);
        setIsLoading(true);
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
                    disabled={isLoading && !isDone}
                    isLoading={isLoading && !isDone}
                >
                    <div className={styles.buttonContent}>
                        <span>
                            {isDone ? "Генерировать" : (isInputDisabled ? (isRestoredTask ? "Перегенерировать" : "Генерировать") : "Анализ")}
                        </span>
                        {isLoading && !isDone && <div className={styles.loading}></div>}
                    </div>
                </Button>
            </div>
            <div className={styles.answerContainer}>
                <AnimatePresence>
                    {displayedResults.map((result, index) => {
                        const isHovered = hoveredBlock === index;
                        const isExpanded = expandedBlock === index;
                        if (isExpanded) return null; 
                        return (
                            <motion.div
                                key={index}
                                className={
                                    `${styles.horizontalItem} ` +
                                    (index === 0
                                        ? styles.photoBlock
                                        : index === 1
                                        ? styles.textBlock
                                        : index === 2
                                        ? styles.reviewBlock
                                        : "") +
                                    (isHovered ? ' ' + styles.expandedBlock : '')
                                }
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                onMouseEnter={() => setHoveredBlock(index)}
                                onMouseLeave={() => setHoveredBlock(null)}
                                onClick={() => setExpandedBlock(index)}
                                style={{ cursor: 'pointer' }}
                            >
                                <motion.p variants={textVariants} initial="hidden" animate="visible">
                                    {result || ""}
                                </motion.p>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
            {expandedBlock !== null && (
                <div className={styles.fullscreenOverlay} onClick={() => setExpandedBlock(null)}>
                    <div
                        className={styles.fullscreenBlock}
                        onClick={e => e.stopPropagation()}
                    >
                        <button className={styles.closeBtn} onClick={() => setExpandedBlock(null)}>
                            ×
                        </button>
                        <div className={styles.fullscreenContent}>
                            <p>{displayedResults[expandedBlock]}</p>
                        </div>
                    </div>
                </div>
            )}
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