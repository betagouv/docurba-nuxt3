import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://ixxbyuandbmplfnqtxyw.supabase.co', process.env.SUPABASE_ADMIN_KEY, {
  auth: { persistSession: false }
})
// DEV
// 'https://drncrjteathtblggsgxi.supabase.co'
// PROD
// 'https://ixxbyuandbmplfnqtxyw.supabase.co'
export default supabase
