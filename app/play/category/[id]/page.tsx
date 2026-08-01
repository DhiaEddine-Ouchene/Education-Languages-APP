import { FolderCategory } from "@/components/folder/FolderCategory";

export const metadata = { title: "Games — Category" };

export default function PlayCategoryPage({ params }: { params: { id: string } }) {
  return <FolderCategory id={params.id} />;
}
