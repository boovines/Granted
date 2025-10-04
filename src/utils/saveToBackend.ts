import { supabase } from '../config/supabaseClient'




export async function saveToBackend(fileId: string, content: string) {
  console.log(`Saving file ${fileId} to Supabase...`);

  const { data, error } = await supabase
    .from('documents')
    .upsert([
      {
        id: fileId,
        content,
        updated_at: new Date().toISOString()
      }
    ])
    .select();

  if (error) {
    console.error("Error saving document:", error);
    throw error;
  }

  console.log("✅ File saved to Supabase:", fileId);
  return { success: true, timestamp: new Date().toISOString(), data };
}
