import Image from "next/image";
import UploadFile from "./src/components/upload_file";

export default function Home() {
  return (
    <div>
      <UploadFile text="Upload Label" />
    </div>
  );
}
