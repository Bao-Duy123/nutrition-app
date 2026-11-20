import { supabase } from './supabase';
import { Food } from '../types/database';

export const getFoodsForMealSuggestion = async (): Promise<Food[]> => {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .not('serving_size', 'ilike', '%100g%')
    .order('id', { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data as Food[]) || [];
};

