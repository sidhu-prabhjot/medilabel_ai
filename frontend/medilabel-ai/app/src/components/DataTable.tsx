"use client";
import Box from "@mui/material/Box";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { faker } from "@faker-js/faker";
import styles from "../styles/DataTable.module.css";

interface MedicationRow {
  id: number;
  medicationName: string;
  dosage: string;
  expirationDate: Date;
}

const generateMedicationRows = (count: number): MedicationRow[] => {
  const newRows: MedicationRow[] = [];
  for (let i = 0; i < count; i++) {
    newRows.push({
      id: i + 1,
      medicationName: faker.commerce.productName(),
      dosage: `${faker.number.int({ min: 1, max: 500 })}mg`,
      expirationDate: faker.date.future({ years: 5 }),
    });
  }
  return newRows;
};

const columns: GridColDef<MedicationRow>[] = [
  { field: "id", headerName: "ID", width: 70 },
  {
    field: "medicationName",
    headerName: "Medication Name",
    flex: 1,
    minWidth: 160,
    editable: true,
  },
  {
    field: "dosage",
    headerName: "Dosage",
    flex: 0.5,
    minWidth: 100,
    editable: true,
  },
  {
    field: "expirationDate",
    headerName: "Expiration Date",
    type: "date",
    flex: 0.6,
    minWidth: 140,
    editable: true,
  },
];

const rows: MedicationRow[] = generateMedicationRows(10);

export default function MedicationInventoryTable() {
  return (
    <Box className={styles.tableContainer}>
      <DataGrid
        rows={rows}
        columns={columns}
        disableColumnMenu
        pageSizeOptions={[5]}
        initialState={{
          pagination: { paginationModel: { pageSize: 5 } },
        }}
        autoHeight
        sx={{
          border: "none",
          backgroundColor: "transparent", // main grid
          color: "#f5f5f5",

          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: "transparent", // transparent rows
          },

          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "transparent", // transparent header
            color: "#90ee90",
            fontWeight: 600,
            borderBottom: "1px solid rgba(255,255,255,0.2)",
          },

          "& .MuiDataGrid-footerContainer": {
            backgroundColor: "transparent", // transparent footer
            borderTop: "1px solid rgba(255,255,255,0.2)",
          },

          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(144, 238, 144, 0.1)",
          },

          "& .MuiDataGrid-virtualScroller": {
            overflowX: "auto",
            backgroundColor: "transparent",
          },

          "& .MuiDataGrid-selectedRowCount": {
            color: "#90ee90",
          },
        }}
      />
    </Box>
  );
}
