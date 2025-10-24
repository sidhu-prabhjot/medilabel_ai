import { BarChart } from "@mui/x-charts/BarChart";
import styles from "../styles/BarChartDiagram.module.css";

export default function BarChartDiagram() {
  const days = ["Su", "M", "T", "W", "Th", "F", "Sa"];

  const completed = [4, 3, 5, 2, 6, 4, 1];
  const missed = [1, 2, 2, 3, 1, 1, 0];

  return (
    <div className={styles.chartContainer}>
      <BarChart
        xAxis={[
          {
            data: days,
            scaleType: "band",
          },
        ]}
        series={[
          { data: completed, label: "Completed", color: "#7CFC00" }, // Light green
          { data: missed, label: "Missed", color: "#FFD54F" }, // Soft yellow
        ]}
        sx={{
          backgroundColor: "transparent",
          "& .MuiChartsAxis-line": { stroke: "#888 !important" },
          "& .MuiChartsAxis-tickLabel": {
            fill: "#eee !important",
            fontSize: "0.8rem",
          },
          "& .MuiChartsLegend-label": {
            fill: "#eee !important",
            fontSize: "0.8rem",
          },
          "& .MuiChartsAxis-tick": { stroke: "#aaa !important" },
        }}
        hideLegend
      />
    </div>
  );
}
