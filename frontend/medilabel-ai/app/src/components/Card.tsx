"use client";
import Link from "next/link";
import styles from "../styles/Card.module.css";

interface CardProps {
  title: string;
  value: React.ReactNode;
  status?: string;
  size: "small" | "medium" | "large";
  href?: string;
}

export default function Card({ title, value, status, size, href }: CardProps) {
  const cardContent = (
    <div className={styles.cardInner}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.cardValue}>{value}</div>
      {status && <p className={styles.cardStatus}>{status}</p>}
    </div>
  );

  return (
    <div
      className={`${styles.card} ${
        size === "medium"
          ? styles.cardMedium
          : size === "large"
          ? styles.cardLarge
          : ""
      }`}
    >
      {href ? (
        <Link href={href} className={styles.linkWrapper}>
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </div>
  );
}
