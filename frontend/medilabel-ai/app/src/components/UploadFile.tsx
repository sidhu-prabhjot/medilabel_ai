"use client";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface InputFileUploadProps {
  text?: string;
}

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const handleFileUpload = (file: File) => {
  console.log("uploaded filed: ", file);
};

export default function InputFileUpload({ text }: InputFileUploadProps) {
  return (
    <Button
      component="label"
      role={undefined}
      variant="contained"
      tabIndex={-1}
      startIcon={<CloudUploadIcon />}
    >
      {text || "Upload File"}
      <VisuallyHiddenInput
        type="file"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            handleFileUpload(event.target.files[0]);
          }
        }}
        multiple
      />
    </Button>
  );
}
