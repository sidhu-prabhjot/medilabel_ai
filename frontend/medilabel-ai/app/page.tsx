//components
import Card from "./src/components/Card";
import CompletionData from "./src/components/CompletionData";
import RefillsData from "./src/components/RefillsData";
import SymptomsLogged from "./src/components/SymptomsLogged";

//styling
import styles from "./src/styles/Dashboard.module.css";

export default function Home() {
  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardGrid}>
        {/* Row 1: Key Metrics (4 Cards) */}
        <Card
          title="Adherence Today"
          value={<CompletionData />}
          status="🔥 On Track"
          size="small"
        />
        <Card
          title="Next Dose"
          value="10:00 AM"
          status="Aspirin"
          size="small"
        />
        <Card
          title="Refills Needed"
          value={<RefillsData />}
          status="High Priority"
          size="small"
        />
        <Card
          title="Symptoms Logged"
          value={<SymptomsLogged />}
          status="Mild Headache"
          size="small"
        />

        {/* Row 2: Charts/Logs (2-3 Cards) */}
        <Card
          title="Weekly Adherence Trend"
          value="Visual Placeholder"
          status="Line Chart"
          size="medium"
        />
        <Card
          title="Medication Inventory"
          value="Visual Placeholder"
          status="Pill Count Breakdown"
          size="medium"
        />

        {/* Row 3: Detail/Table (1 Full-Width Card) */}
        <Card
          title="Dose History & Vitals Log"
          value="Table Placeholder"
          status="Recent Activity"
          size="large"
        />
      </div>
    </div>
  );
}
