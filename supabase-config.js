const SUPABASE_URL = 'https://xzkbbgbsnkocirthyuei.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'sb_publishable_0tlWXIs6RqoyUcnAZ_UtXQ_WWoD4T2c'; // Replace with your anon key

let supabaseClient = null;

if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase client initialized successfully.");
} else {
    console.warn("Supabase credentials not configured or SDK missing. URL:", SUPABASE_URL, "SDK defined:", typeof supabase !== 'undefined');
}
