import { supabase } from "./supabase";

export async function uploadItemPhoto(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("item-photos").upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage.from("item-photos").getPublicUrl(path);
  return data.publicUrl;
}
