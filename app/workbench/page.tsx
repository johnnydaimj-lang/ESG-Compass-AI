import { getAllContents } from "@/lib/esg-data";
import WorkbenchShell from "@/components/WorkbenchShell";

export default function WorkbenchPage() {
  return <WorkbenchShell contents={getAllContents()} />;
}