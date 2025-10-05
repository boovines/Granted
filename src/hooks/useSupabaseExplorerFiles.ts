// src/hooks/useSupabaseExplorerFiles.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../config/supabaseClient";
import type { ExplorerFile } from "../components/Explorer";

type SourceRow = {
  id: number;
  created_at: string | null;
  uploaded_time: string | null;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null; // e.g. "pdf" "docx" "html" "txt"
};

const BUCKET = "documents";

async function toPublicUrl(path: string): Promise<string> {
  // first try public url
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (data?.publicUrl) return data.publicUrl;

  // fallback to short lived signed url
  const { data: signed, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error || !signed?.signedUrl) {
    throw error ?? new Error("Could not create signed url");
  }
  return signed.signedUrl;
}

function mapRowToExplorerFile(row: SourceRow): ExplorerFile {
  const ext = (row.file_type || row.file_name.split(".").pop() || "").toLowerCase();
  return {
    id: String(row.id),
    name: row.file_name,
    type: "source",
    category: "Sources",
    content: "",
    lastModified: new Date(row.uploaded_time || row.created_at || Date.now()),
    path: row.file_path,
    extension: ext,
    // publicUrl is filled in lazily by Explorer when you select a PDF
  };
}

export function useSupabaseExplorerFiles(userId: string) {
  const [files, setFiles] = useState<ExplorerFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      // fetch rows for this user
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .eq("user_id", userId)
        .order("uploaded_time", { ascending: false });

      if (error) throw error;
      const rows = (data ?? []) as SourceRow[];

      // map to ExplorerFile
      const mapped = rows.map(mapRowToExplorerFile);
      setFiles(mapped);

      // optional warm public urls for PDFs so first click is instant
      await Promise.all(
        mapped
          .filter(f => f.extension === "pdf")
          .slice(0, 5) // keep it light
          .map(async f => {
            try {
              const url = await toPublicUrl(f.path);
              f.publicUrl = url;
            } catch {
              /* ignore warmup failure */
            }
          })
      );
    } catch (e: any) {
      setErr(e?.message || "load failed");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // initial load
  useEffect(() => { load(); }, [load]);

  // realtime updates when table changes
  useEffect(() => {
    const channel = supabase
      .channel("realtime:sources")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sources",
          filter: `user_id=eq.${userId}`,
        },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, load]);

  // handy helper to resolve a url for any item
  const resolveUrl = useCallback(async (file: ExplorerFile) => {
    if (file.publicUrl) return file.publicUrl;
    const url = await toPublicUrl(file.path);
    return url;
  }, []);

  return useMemo(
    () => ({ files, loading, error: err, refresh: load, resolveUrl }),
    [files, loading, err, load, resolveUrl]
  );
}
