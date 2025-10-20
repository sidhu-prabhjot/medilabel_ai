import styles from "../styles/SymptomsLogged.module.css";

export default function SymptomsLogged() {
  const symptoms = [{ name: "Headache" }, { name: "Backpain" }];

  return (
    <div className={styles.symptomsWrapper}>
      <div className={styles.symptomCount}>{symptoms.length}</div>
      <ul className={styles.symptomList}>
        {symptoms.map((s, index) => (
          <li key={index} className={styles.symptomItem}>
            <span className={styles.symptomName}>{s.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
