import * as React from 'react';
import { supabase } from '../config/supabaseClient';
import type { ExplorerFile } from '../components/Explorer';

type Category = 'Documents' | 'Sources' | 'Context';

function categoryFromPath(file_path: string): Category {
  const parts = String(file_path || '').split('/');
  const cat = parts[1] as Category | undefined;
  return cat ?? 'Sources';
}

function typeFromCategory(cat: Category): ExplorerFile['type'] {
  if (cat === 'Documents') return 'document';
  if (cat === 'Context') return 'context';
  return 'source';
}

export function useSupabaseExplorerFiles(userId: string) {
  const [files, setFiles] = React.useState<ExplorerFile[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const mapRow = (row: any): ExplorerFile => {
    const category = categoryFromPath(row.file_path);
    return {
      id: String(row.id),
      name: row.file_name,
      type: typeFromCategory(category),
      category,
      content: undefined,
      lastModified: new Date(row.uploaded_time ?? row.created_at ?? Date.now()),
      path: row.file_path,
      extension: row.file_type ?? undefined,
    };
  };

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_time', { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setFiles((data ?? []).map(mapRow));
    setLoading(false);
  }, [userId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    const channel = supabase
      .channel('sources-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sources', filter: `user_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, refresh]);

  return { files, loading, error, refresh };
}
