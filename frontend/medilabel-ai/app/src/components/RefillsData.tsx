import styles from "../styles/RefillsData.module.css";

export default function RefillsData() {
  const refills = [
    { name: "Aspirin", dosesLeft: 2 },
    { name: "Metformin", dosesLeft: 1 },
    { name: "Aspirin", dosesLeft: 2 },
    { name: "Metformin", dosesLeft: 1 },
    { name: "Aspirin", dosesLeft: 2 },
    { name: "Metformin", dosesLeft: 1 },
  ];

  return (
    <div className={styles.refillsWrapper}>
      <div className={styles.refillCount}>{refills.length}</div>
      <ul className={styles.refillList}>
        {refills.map((r, index) => (
          <li key={index} className={styles.refillItem}>
            <span className={styles.medicineName}>{r.name}</span>
            <span className={styles.dosesLeft}>{r.dosesLeft} left</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
