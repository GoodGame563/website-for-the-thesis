import { useRef } from 'react';
import styles from '../styles/Carousel.module.css';
import Button from './Button';

export default function Carousel({ items }) {
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    const item = carouselRef.current.querySelector(`.${styles.verticalItem}`);
    if (!item) return;
    const amount = (item.offsetWidth + 15) * direction;
    carouselRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carousel} ref={carouselRef}>
        {items.map((item, index) => (
          <div key={index} className={styles.verticalItem}>
            <div className={styles.imageWrapper}>
              <div className={styles.imageContainer}>
                <img
                  src={item.image}
                  className={styles.productImage}
                  alt={item.title}
                />
              </div>
            </div>
            <Button className={styles.small}>Подробнее</Button>
            <div className={styles.rating}>Рейтинг: {item.rating}</div>
            <h3>{item.title}</h3>
            <p className={styles.price}>{item.price}</p>
          </div>
        ))}
      </div>
      <Button className={`${styles.carouselBtn} ${styles.prev}`} onClick={() => scrollCarousel(-1)}>
        <svg viewBox="0 0 24 24">
          <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
        </svg>
      </Button>
      <Button className={`${styles.carouselBtn} ${styles.next}`} onClick={() => scrollCarousel(1)}>
        <svg viewBox="0 0 24 24">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
        </svg>
      </Button>
    </div>
  );
}