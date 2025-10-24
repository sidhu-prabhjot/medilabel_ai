//components
import { PieChart } from "@mui/x-charts/PieChart";

//styling
import styles from "../styles/PieChartDiagram.module.css";

export default function PieChartDiagram() {
  return (
    <div className={styles.chartWrapper}>
      <PieChart
        series={[
          {
            data: [
              { id: 0, value: 75, label: "Completed", color: "#4f772d" },
              { id: 1, value: 25, label: "Remaining", color: "#ecf39e" },
            ],
          },
        ]}
        width={140}
        height={140}
        hideLegend
      />
    </div>
  );
}
