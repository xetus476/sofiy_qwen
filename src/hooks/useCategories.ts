import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Category } from '../types';

// Default categories for demo/offline mode
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Жильё', icon: '🏠', color: '#6366F1', sort_order: 1 },
  { id: '2', name: 'ЖКХ', icon: '💡', color: '#F59E0B', sort_order: 2 },
  { id: '3', name: 'Продукты', icon: '🛒', color: '#10B981', sort_order: 3 },
  { id: '4', name: 'Кафе и доставка', icon: '🍔', color: '#EF4444', sort_order: 4 },
  { id: '5', name: 'Косметика', icon: '💄', color: '#EC4899', sort_order: 5 },
  { id: '6', name: 'Транспорт', icon: '🚌', color: '#3B82F6', sort_order: 6 },
  { id: '7', name: 'Маркетплейсы', icon: '📦', color: '#8B5CF6', sort_order: 7 },
];

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      if (data && data.length > 0) {
        setCategories(data);
      }
    } catch (err) {
      // Use default categories
      console.log('Using default categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading };
}
