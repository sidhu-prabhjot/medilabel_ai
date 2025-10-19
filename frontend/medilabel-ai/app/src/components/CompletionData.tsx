//components
import { PieChart } from "@mui/x-charts/PieChart";

const data1 = [
  { value: 75, label: "Completed" },
  { value: 25, label: "Remaining" },
];

//styling
import styles from "../styles/CompletionData.module.css";

type PiePoint = {
  value: number;
  label?: string;
  [key: string]: any; // for any extra properties MUI may attach
};

export default function CompletionData() {
  return (
    <div>
      <PieChart
        series={[
          {
            data: [{ value: 70, label: "Completed" }],
            innerRadius: 0,
            outerRadius: 100,
            color: "green",
          },
          {
            data: [{ value: 30, label: "Remaining" }],
            innerRadius: 0,
            outerRadius: 100,
            color: "red",
          },
        ]}
        hideLegend
      />
    </div>
  );
}
