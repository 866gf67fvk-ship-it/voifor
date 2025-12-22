// Supabase設定
const SUPABASE_URL = 'https://gqtqaoxcuvkkquroathe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxdHFhb3hjdXZra3F1cm9hdGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTc5ODksImV4cCI6MjA3OTgzMzk4OX0.a8-x6oz_r8Pa-5Of89tvZeL1f40leEaNOZ3jEuSVsf8';

// SDKを先に取得（上書き前に！）
const supabaseSDK = window.supabase;

// Supabaseクライアント初期化
var supabase = null;
if (supabaseSDK && supabaseSDK.createClient) {
    supabase = supabaseSDK.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase接続準備完了');
} else {
    alert('Supabase SDKが読み込まれていません');
}