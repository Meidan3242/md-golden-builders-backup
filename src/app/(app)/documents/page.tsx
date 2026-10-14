import { redirect } from "next/navigation";

export default function DocumentsIndex() {
  redirect("/documents/new");
}
