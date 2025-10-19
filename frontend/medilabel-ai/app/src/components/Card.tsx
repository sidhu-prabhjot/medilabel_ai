import styles from "../styles/Card.module.css";

// Define the interface for the Card component's props
interface CardProps {
  title: string;
  value: string | number | React.ReactNode;
  status: string;
  size: "small" | "medium" | "large";
}

export default function Card({ title, value, status, size }: CardProps) {
  let cardClass = styles.card;
  let valueClass = styles.cardValue;

  // Apply grid-span classes based on the 'size' prop for responsiveness
  if (size === "medium") {
    cardClass = `${cardClass} ${styles.cardMedium}`;
  } else if (size === "large") {
    cardClass = `${cardClass} ${styles.cardLarge}`;
  }

  return (
    <div className={cardClass}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={valueClass}>{value}</div>
      <p className={styles.cardStatus}>{status}</p>
    </div>
  );
}
