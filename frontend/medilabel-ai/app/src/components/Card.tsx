import styles from "../styles/Card.module.css";

interface CardProps {
  title: string;
  value: string | number | React.ReactNode;
  status: string;
  size: "small" | "medium" | "large";
}

export default function Card({ title, value, status, size }: CardProps) {
  let cardClass = styles.card;

  if (size === "medium") {
    cardClass = `${cardClass} ${styles.cardMedium}`;
  } else if (size === "large") {
    cardClass = `${cardClass} ${styles.cardLarge}`;
  }

  return (
    <div className={cardClass}>
      <h3 className={styles.cardTitle}>{title}</h3>

      {/* Centered if small, scrolls if overflow */}
      <div className={styles.cardContent}>
        <div className={styles.cardValue}>{value}</div>
      </div>

      <p className={styles.cardStatus}>{status}</p>
    </div>
  );
}
