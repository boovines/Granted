import { supabase } from "../config/supabaseClient";

export async function saveToBackend(fileId: string, content: string) {
  const { data, error } = await supabase
    .from("documents")
    .upsert([
      {
        id: fileId,
        content,
        updated_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) {
    console.error("Error saving document:", error);
    throw error;
  }

  return { success: true, timestamp: new Date().toISOString(), data };
}
