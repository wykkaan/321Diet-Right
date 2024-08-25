import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    const { weight } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ weight })
      .eq('id', user.id);

    if (error) throw error;

    res.status(200).json({ message: 'Weight updated successfully' });
  } catch (error) {
    console.error('Error updating weight:', error);
    res.status(500).json({ message: 'Failed to update weight' });
  }
}