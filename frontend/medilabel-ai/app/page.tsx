"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

//components
import BarChartDiagram from "./src/components/BarChartDiagram";
import Card from "./src/components/Card";
import DataTable from "./src/components/DataTable";
import PieChartDiagram from "./src/components/PieChartDiagram";
import RefillsData from "./src/components/RefillsData";
import SymptomsLogged from "./src/components/SymptomsLogged";

//styling
import styles from "./Dashboard.module.css";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("isLoggedIn")) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardGrid}>
        <Card
          title="Adherence Today"
          value={<PieChartDiagram />}
          status="🔥 On Track"
          size="small"
          href="./dashboard/adherence"
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
          href="./dashboard/refills"
        />
        <Card
          title="Symptoms Logged"
          value={<SymptomsLogged />}
          status="Mild Headache"
          size="small"
          href="./dashboard/symptoms"
        />

        <Card
          title="Weekly Adherence Trend"
          value={<BarChartDiagram />}
          status="Line Chart"
          size="medium"
          href="./dashboard/adherence"
        />

        <Card
          title="Medication Inventory"
          value={<DataTable />}
          status="Pill Count Breakdown"
          size="medium"
          href="./dashboard/inventory"
        />

        <Card
          title="Dose History & Vitals Log"
          value={<DataTable />}
          status="Recent Activity"
          size="large"
          href="./dashboard/history"
        />
      </div>
    </div>
  );
}
