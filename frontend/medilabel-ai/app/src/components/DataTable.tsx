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
          backgroundColor: "transparent",
          color: "#f5f5f5",

          "& .MuiDataGrid-root": {
            backgroundColor: "transparent",
          },

          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "transparent",
          },

          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#ecf39e !important",
            color: "#171717",
            fontWeight: 600,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          },

          "& .MuiDataGrid-columnHeader": {
            backgroundColor: "#ecf39e !important",
          },

          "& .MuiDataGrid-footerContainer": {
            backgrounColor: "transparent",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          },

          // remove hover background so nothing adds a background color
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "transparent",
          },

          "& .MuiDataGrid-virtualScroller": {
            overflowX: "auto",
            backgroundColor: "transparent",
          },

          "& .MuiDataGrid-selectedRowCount": {
            color: "#f5f5f5",
          },

          "& .MuiTablePagination-root": {
            color: "#f5f5f5",
          },

          "& .MuiTablePagination-displayedRows, & .MuiTablePagination-selectLabel":
            {
              color: "#f5f5f5",
            },

          "& .MuiIconButton-root": {
            color: "#f5f5f5",
          },

          "& .Mui-disabled": {
            color: "#f5f5f5 !important",
          },
        }}
      />
    </Box>
  );
}
