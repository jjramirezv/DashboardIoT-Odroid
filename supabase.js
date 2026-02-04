import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://svmxkwlhwtykgrzcuwuj.supabase.co' 
const supabaseKey = 'sb_publishable_FBjgRNH9XElgye9QPnX7bA_edV8KoS6'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, 
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})