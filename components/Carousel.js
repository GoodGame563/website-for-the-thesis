import { useState, useEffect, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import styles from '../styles/Carousel.module.css';
import Button from './Button';

const ProductCard = memo(({ item, index }) => {
  return (
    <motion.div
      className={styles.verticalItem}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: 0.4
      }}
    >
      <div className={styles.cardContent}>
        <div className={styles.imageWrapper}>
          {item.image && (
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 30vw"
              className={styles.productImage}
              priority={index === 0}
            />
          )}
        </div>
        <div className={styles.productInfo}>
          <h3 className={styles.productTitle}>{item.title}</h3>
          <div className={styles.rating}>
            <span className={styles.ratingIcon}>★</span>
            {item.rating}
          </div>
          <div className={styles.price}>{item.price}</div>
          <Button className={styles.detailsButton}>
            Подробнее
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default function Carousel({ items }) {
  const [currentItems, setCurrentItems] = useState([]);
  const carouselRef = useRef(null);

  useEffect(() => {
    setCurrentItems(items);
  }, [items]);

  const scroll = (direction) => {
    if (!carouselRef.current) return;
    
    const scrollAmount = carouselRef.current.offsetWidth * 0.8;
    const newPosition = carouselRef.current.scrollLeft + (direction === 'next' ? scrollAmount : -scrollAmount);
    
    carouselRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
  };

  return (
    <div className={styles.carouselContainer}>
      <button 
        className={`${styles.navButton} ${styles.prevButton}`}
        onClick={() => scroll('prev')}
        aria-label="Previous"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className={styles.carousel} ref={carouselRef}>
        <AnimatePresence mode="wait">
          {currentItems.map((item, index) => (
            <ProductCard 
              key={`${item.title}-${index}`}
              item={item}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      <button 
        className={`${styles.navButton} ${styles.nextButton}`}
        onClick={() => scroll('next')}
        aria-label="Next"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}