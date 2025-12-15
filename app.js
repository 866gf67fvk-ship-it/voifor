// ========== BGM管理 ==========
const bgmTracks = [
    'the-lights-of-the-village-190674.mp3',
    'the-wishing-well-228532.mp3',
    'the-crystal-cave-198981.mp3',
    'the-land-of-wonder-159583.mp3',
    'lullaby-serenity-dreamy-ballad-for-kids-355908.mp3',
    'rainy-day-chill-lo-fi-276666.mp3',
    'knock-knock-clap-clap-holiday-mix-428327.mp3',
    'lofi-218275.mp3'
];
let bgmAudio = null;
let bgmEnabled = true;

function playRandomBGM() {
    if (!bgmEnabled) return;
    const randomTrack = bgmTracks[Math.floor(Math.random() * bgmTracks.length)];
    bgmAudio = new Audio(randomTrack);
    bgmAudio.volume = 0.3;
    bgmAudio.play().then(() => {
        console.log('🎵 BGM再生:', randomTrack);
    }).catch(e => {
        console.log('BGM再生待機中');
    });
    bgmAudio.onended = () => playRandomBGM();
}

function stopBGM() {
    if (bgmAudio) {
        bgmAudio.pause();
        console.log('🔇 BGM停止');
    }
}

function resumeBGM() {
    if (bgmAudio && bgmEnabled) {
        bgmAudio.play().catch(() => {});
        console.log('🎵 BGM再開');
    }
}
// 画面が非表示になったらBGM停止、表示されたら再開
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 画面が非表示（バックグラウンド）
        stopBGM();
    } else {
        // 画面が表示（フォアグラウンド）
        resumeBGM();
    }
});

// 最初のタップでBGM開始
document.addEventListener('click', function startBGMOnce() {
    playRandomBGM();
    document.removeEventListener('click', startBGMOnce);
}, { once: true });

// ========================================
// VOIFOR -声占い- メインアプリ
// ========================================

// 録音用変数
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let audioContext;
let analyser;
let recordingStream;

// キャラクターデータ
const characterTemplates = {
    devilMale: {
        defaultName: '鬼術師',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764268818/u4834658121_A_cute_chibi_demon_fortune_teller_character_small_b8d8bc81-26e3-4456-a478-b2a609fc70fe_3_s14cdn.png',
        emoji: '🍀',
        speech: '占ってやるぜ！'
    },
    devilFemale: {
        defaultName: '鬼巫女',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269013/u4834658121_A_cute_chibi_demon_fortune_teller_character_small_b8d8bc81-26e3-4456-a478-b2a609fc70fe_2_eileck.png',
        emoji: '🍀',
        speech: '占ってあげるわよ💕'
    },
    angelMale: {
        defaultName: 'エンジェル♂',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269049/u4834658121_A_cute_chibi_angel_fortune_teller_character_white_6469a933-2db5-40bf-af2f-7a4757fab116_3_nqhd7q.png',
        emoji: '🍀',
        speech: '一緒に占いましょう✨'
    },
    angelFemale: {
        defaultName: 'エンジェル♀',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269392/u4834658121_A_cute_chibi_angel_fortune_teller_character_white_dfe8d8c8-cff0-447d-8c3c-7d8b417105b4_1_e5ddvi.png',
        emoji: '🍀',
        speech: '占わせてくださいね💕'
    },
    jesterMale: {
        defaultName: 'ピエロ♂',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269038/u4834658121_A_cute_chibi_jester_fortune_teller_character_colo_70f0ae95-dfef-4686-9415-3e3dca5130a2_0_o74bse.png',
        emoji: '🍀',
        speech: '占っちゃうよん！✨'
    },
    jesterFemale: {
        defaultName: 'ピエロ♀',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269038/u4834658121_A_cute_chibi_jester_fortune_teller_character_colo_70f0ae95-dfef-4686-9415-3e3dca5130a2_3_rhnwuu.png',
        emoji: '🍀',
        speech: '占うよ〜！💕'
    },
    elfMale: {
        defaultName: 'エルフ♂',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269024/u4834658121_____--v_7_dc3fac00-dc89-440c-b28e-9fe33ff8b3a8_0_1_uabcje.png',
        emoji: '🍀',
        speech: '未来を見せてあげよう✨'
    },
    elfFemale: {
        defaultName: 'エルフ♀',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269094/u4834658121_____--v_7_1a2a511d-936c-447f-9525-f2358094ae5c_0_zinx1g.png',
        emoji: '🍀',
        speech: '占わせていただきますわ💕'
    },
    fairy: {
        defaultName: 'フェアリー',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269036/u4834658121_A_cute_chibi_fairy_fortune_teller_character_trans_a96b325e-fc10-43ed-aec5-dadff09ae0db_2_npiwaf.png',
        emoji: '🍀',
        speech: '占うの！楽しみだね！✨'
    },
    cat: {
        defaultName: 'クロネコ',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269055/u4834658121_A_cute_black_cat_fortune_teller_sitting_on_mystic_b1566c70-0a16-4513-aea5-6bc94f8b8f98_2_uvkr3s.png',
        emoji: '🍀',
        speech: '別に...占ってあげるにゃ✨'
    }
};

// Lottieアニメーション一覧
const lottieAnimations = [
    'https://lottie.host/8a9e206d-521d-4a4a-b719-db95db316d30/i6C7DWBTd4.lottie',
    'https://lottie.host/bd0a93f7-d7f6-461f-a17f-cc2cc9264f2e/iTNx1sb5n5.lottie'
];

function showRandomLottie() {
    const container = document.getElementById('lottieContainer');
    if (!container) return;
    
    const randomUrl = lottieAnimations[Math.floor(Math.random() * lottieAnimations.length)];
    
    container.innerHTML = `
        <dotlottie-player 
            src="${randomUrl}"
            background="transparent"
            speed="1"
            style="width: 250px; height: 250px;"
            loop
            autoplay>
        </dotlottie-player>
    `;
}

// 共通ローディング表示
function showGlobalLoading(messages) {
    const modal = document.getElementById('globalLoading');
    modal.style.display = 'flex';
    
    // ランダムLottie
    const container = document.getElementById('globalLottieContainer');
    const randomUrl = lottieAnimations[Math.floor(Math.random() * lottieAnimations.length)];
    container.innerHTML = `
        <dotlottie-player 
            src="${randomUrl}"
            background="transparent"
            speed="1"
            style="width: 250px; height: 250px;"
            loop
            autoplay>
        </dotlottie-player>
    `;
    
    // メッセージ変化
    if (messages && messages.length > 0) {
        let msgIndex = 0;
        document.getElementById('globalLoadingText').textContent = messages[0];
        
        window.globalMsgInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % messages.length;
            document.getElementById('globalLoadingText').textContent = messages[msgIndex];
        }, 4000);
    }
}

function hideGlobalLoading() {
    document.getElementById('globalLoading').style.display = 'none';
    if (window.globalMsgInterval) {
        clearInterval(window.globalMsgInterval);
        window.globalMsgInterval = null;
    }
}

// ========================================
// カスタム alert / confirm モーダル
// ========================================

// カスタムalert（OKボタンのみ）
function showCustomAlert(message, icon = '💬') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.id = 'customAlertModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a4e 30%, #2d1b69 50%, #1a1a4e 70%, #0f0f23 100%); padding: 30px; border-radius: 25px; max-width: 400px; width: 100%; box-shadow: 0 15px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255, 105, 180, 0.5), 0 0 60px rgba(255, 105, 180, 0.3); border: 3px solid #FFB6C1; text-align: center;">
                <div style="font-size: 3em; margin-bottom: 15px;">${icon}</div>
                <p style="font-size: 1.1em; color: white; line-height: 1.6; margin-bottom: 25px; white-space: pre-line;">${message}</p>
                <button onclick="this.closest('#customAlertModal').remove(); window.customAlertResolve && window.customAlertResolve();" style="background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; padding: 15px 50px; border-radius: 25px; font-size: 1.1em; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);">
                    OK
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        window.customAlertResolve = resolve;
    });
}

// カスタムconfirm（はい/いいえボタン）
function showCustomConfirm(message, icon = '🤔', yesText = 'はい', noText = 'いいえ') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.id = 'customConfirmModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a4e 30%, #2d1b69 50%, #1a1a4e 70%, #0f0f23 100%); padding: 30px; border-radius: 25px; max-width: 400px; width: 100%; box-shadow: 0 15px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255, 105, 180, 0.5), 0 0 60px rgba(255, 105, 180, 0.3); border: 3px solid #FFB6C1; text-align: center;">
                <div style="font-size: 3em; margin-bottom: 15px;">${icon}</div>
                <p style="font-size: 1.1em; color: white; line-height: 1.6; margin-bottom: 25px; white-space: pre-line;">${message}</p>
                <div style="display: flex; gap: 15px;">
                    <button onclick="this.closest('#customConfirmModal').remove(); window.customConfirmResolve && window.customConfirmResolve(false);" style="flex: 1; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); color: white; padding: 15px; border-radius: 25px; font-size: 1em; cursor: pointer;">
                        ${noText}
                    </button>
                    <button onclick="this.closest('#customConfirmModal').remove(); window.customConfirmResolve && window.customConfirmResolve(true);" style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; padding: 15px; border-radius: 25px; font-size: 1em; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);">
                        ${yesText}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        window.customConfirmResolve = resolve;
    });
}

// カレンダー月移動用
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
// ユーザーデータ
let userData = {
    oduu: null,
    freeTickets: 3,      // 無料配布クローバー（上限5枚）
    earnedTickets: 0,    // 獲得クローバー（無制限）
    streak: 0,
    totalReadings: 0,
    checkedDates: [],
    selectedCharacter: 'devilMale',
    dailyFortuneCount: 0,
    lastFortuneDate: null,
    referralCode: '',        // 自分の紹介コード
    referredBy: '',          // 誰から紹介されたか
    hasUsedOnce: false,      // 初回占い済みか（紹介検証用）
    snsShareThisWeek: false, // 今週SNS投稿したか
    name: '',                // ユーザー名
    birth: '',               // 生年月日
    bloodType: '',           // 血液型
    isRegistered: false,     // 登録済みか
    characterName: '',       // キャラクター名
    // プレミアム関連
    isPremium: false,        // プレミアム会員か
    premiumExpiry: null,     // プレミアム有効期限
    premiumDailyCount: 0,    // 今日のプレミアム使用回数
    premiumLastDate: null    // 最後にプレミアム使用した日
};

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌟 VOIFOR 起動中...');
    
    // ユーザーデータ読み込み
    await loadUserData();
    
// 決済成功後の処理
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        const amount = parseInt(urlParams.get('amount')) || 0;
        
        if (amount === 0) {
            // プレミアム購入成功
            userData.isPremium = true;
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + 1);
            userData.premiumExpiry = expiry.toISOString();
            userData.premiumDailyCount = 0;
            userData.premiumLastDate = null;
            await saveUserData();
            await showCustomAlert(`🎉 プレミアム登録完了！\n\n👑 1日20回まで占い放題！\n有効期限: ${expiry.toLocaleDateString('ja-JP')}`, '✅');
        } else if (amount > 0) {
            userData.earnedTickets += amount;
            await saveUserData();
            await showCustomAlert(`🎉 購入完了！\n🍀 ${amount}クローバーを獲得しました！`, '✅');
        }
        // URLパラメータをクリア（リロードで重複付与を防ぐ）
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (urlParams.get('canceled') === 'true') {
        await showCustomAlert('購入がキャンセルされました', '❌');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

 // カレンダー表示
    renderCalendar();
    
    // UI更新
    updateUI();
    
// 初回判定
    checkFirstTime();
    
    // キラキラエフェクト生成
    createSparkles();
    
    console.log('✅ VOIFOR 準備完了！');
});

// キラキラエフェクト生成
function createSparkles() {
    const sparkleCount = 40;
    const colors = [
        'rgba(255, 255, 255, 1)',
        'rgba(255, 200, 255, 1)',
        'rgba(200, 200, 255, 1)',
        'rgba(255, 220, 180, 1)'
    ];
    for (let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        sparkle.style.animationDelay = Math.random() * 6 + 's';
        sparkle.style.animationDuration = (Math.random() * 3 + 4) + 's';
        // ランダムな色
        const color = colors[Math.floor(Math.random() * colors.length)];
        sparkle.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
        // ランダムなサイズ
        const size = Math.random() * 6 + 4;
        sparkle.style.width = size + 'px';
        sparkle.style.height = size + 'px';
        document.body.appendChild(sparkle);
    }
}

// UI更新
function updateUI() {
// クローバー数
document.getElementById('freeTicketCount').textContent = userData.freeTickets;
document.getElementById('earnedTicketCount').textContent = userData.earnedTickets; 

// プレミアム表示（超豪華版）
applyPremiumStyle();

// 連続日数・合計
    document.getElementById('streakCount').textContent = userData.streak;
    document.getElementById('totalCount').textContent = userData.totalReadings;
     
// プロフィール表示（入力があるものだけ表示）
const profileItems = [];

// 名前を一番最初に
if (userData.name) {
    profileItems.push(userData.name);
}

// 性別（絵文字で表示）
if (userData.gender) {
    const genderEmoji = { male: '♂️', female: '♀️', other: '🌈' };
    profileItems.push(genderEmoji[userData.gender] || '');
}

// 干支
if (userData.birth) {
    const eto = getEtoSign(userData.birth);
    if (eto) profileItems.push(eto);
}

// 血液型
if (userData.bloodType) {
    profileItems.push(`${userData.bloodType}型`);
}

// 誕生日（月/日）
if (userData.birth) {
    const birthDate = new Date(userData.birth);
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    profileItems.push(`${month}/${day}`);
}

// 星座
if (userData.birth) {
    const zodiac = getZodiacSign(userData.birth);
    if (zodiac) profileItems.push(zodiac);
}

// プロフィール行に表示
const profileLine = document.querySelector('.user-stats .profile-line');
if (profileLine) {
    if (profileItems.length > 0) {
        profileLine.innerHTML = profileItems.join(' <span class="profile-sep">|</span> ');
    } else {
        profileLine.innerHTML = '<span style="opacity: 0.5;">タップして設定</span>';
    }
}
    
    // キャラ画像表示
    updateCharacterDisplay();
    
    // 今日の占い結果を吹き出しに表示
    updateSpeechBubble();
}
// 吹き出し更新
function updateSpeechBubble() {
    const saved = localStorage.getItem('voifor_today_fortune');
    const today = new Date().toISOString().split('T')[0];
    const character = characterTemplates[userData.selectedCharacter] || characterTemplates.devilMale;
    
    if (saved) {
        const data = JSON.parse(saved);
        if (data.date === today) {
            // 今日の占い済み
            document.getElementById('speechBubble').textContent = data.summary;
            return;
        }
    }
    
    // 未占い
    document.getElementById('speechBubble').textContent = character.speech;
}

// キャラ画像表示
function updateCharacterDisplay() {
    const character = characterTemplates[userData.selectedCharacter] || characterTemplates.devilMale;
    
    // キャラ画像
    const charImage = document.getElementById('characterImage');
    if (charImage) {
        charImage.style.backgroundImage = `url('${character.image}')`;
    }
    
    // キャラ名表示
    const charNameDisplay = document.getElementById('characterNameDisplay');
    if (charNameDisplay) {
        charNameDisplay.textContent = userData.characterName || character.defaultName;
    }
    
    // 吹き出し
    const speechBubble = document.getElementById('speechBubble');
    if (speechBubble) {
        speechBubble.textContent = character.speech;
    }
}

// 画面履歴
let screenHistory = ['mainScreen'];

// 画面切り替え
function showScreen(screenId) {
    // 全画面非表示
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 指定画面表示
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        // スクロールを一番上に
        target.scrollTop = 0;
    }
    
    // ページ全体も一番上に
    window.scrollTo(0, 0);
    
    // 履歴に追加（同じ画面でなければ）
    if (screenHistory[screenHistory.length - 1] !== screenId) {
        screenHistory.push(screenId);
    }
}

// 前の画面に戻る
function goBack() {
    if (screenHistory.length > 1) {
        screenHistory.pop(); // 現在の画面を削除
        const prevScreen = screenHistory[screenHistory.length - 1];
        
        // 全画面非表示
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // 前の画面表示
        const target = document.getElementById(prevScreen);
        if (target) {
            target.classList.add('active');
            target.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    } else {
        showMainScreen();
    }
}

// メイン画面に戻る
function showMainScreen() {
    showScreen('mainScreen');
}
// ========================================
// データ読み込み・保存
// ========================================

// デバイスID取得・生成
function getDeviceId() {
    let deviceId = localStorage.getItem('voifor_device_id');
    if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('voifor_device_id', deviceId);
    }
    return deviceId;
}

// ユーザーデータ読み込み
async function loadUserData() {
    const deviceId = getDeviceId();
    
    try {
        // Supabaseから取得
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('device_id', deviceId)
            .single();
        
        if (error && error.code === 'PGRST116') {
            // ユーザーが存在しない→新規作成
            console.log('🆕 新規ユーザー作成');
            await createNewUser(deviceId);
} else if (data) {
            // 既存ユーザー
            userData.freeTickets = data.free_tickets;
            userData.earnedTickets = data.earned_tickets;
            userData.streak = data.streak;
            userData.totalReadings = data.total_readings;
            userData.checkedDates = data.checked_dates ? JSON.parse(data.checked_dates) : [];
            userData.selectedCharacter = data.selected_character;
            userData.referralCode = data.referral_code || '';
            userData.referredBy = data.referred_by || '';
            userData.hasUsedOnce = data.has_used_once || false;
            userData.name = data.name || '';
            userData.birth = data.birth || '';
            userData.bloodType = data.blood_type || '';
            userData.isRegistered = data.is_registered || false;
            userData.oduu = data.id;
            // プレミアム関連
            userData.isPremium = data.is_premium || false;
            userData.premiumExpiry = data.premium_expiry || null;
            userData.premiumDailyCount = data.premium_daily_count || 0;
            userData.premiumLastDate = data.premium_last_date || null;
            console.log('📁 ユーザーデータ読み込み完了');
        }
    } catch (err) {
        console.error('❌ データ読み込みエラー:', err);
    }
}

// 新規ユーザー作成
async function createNewUser(deviceId) {
    const { data, error } = await supabase
        .from('users')
        .insert([{ device_id: deviceId }])
        .select()
        .single();
    
    if (data) {
        userData.oduu = data.id;
        console.log('✅ 新規ユーザー作成完了');
    }
}

// ユーザーデータ保存
async function saveUserData() {
    const deviceId = getDeviceId();
    
    try {
const { error } = await supabase
            .from('users')
            .update({
                free_tickets: userData.freeTickets,
                earned_tickets: userData.earnedTickets,
                streak: userData.streak,
                total_readings: userData.totalReadings,
                checked_dates: JSON.stringify(userData.checkedDates),
                selected_character: userData.selectedCharacter,
                referral_code: userData.referralCode,
                referred_by: userData.referredBy,
                has_used_once: userData.hasUsedOnce,
                name: userData.name,
                birth: userData.birth,
                blood_type: userData.bloodType,
                is_registered: userData.isRegistered,
                // プレミアム関連
                is_premium: userData.isPremium,
                premium_expiry: userData.premiumExpiry,
                premium_daily_count: userData.premiumDailyCount,
                premium_last_date: userData.premiumLastDate
            })
            .eq('device_id', deviceId);
        
        if (error) throw error;
        console.log('💾 ユーザーデータ保存完了');
    } catch (err) {
        console.error('❌ データ保存エラー:', err);
    }
}

// ========================================
// カレンダー
// ========================================

function renderCalendar() {
    const container = document.getElementById('calendarDisplay');
    if (!container) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
    // 月の最初の日と最後の日
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    // ヘッダー
    let html = `
        <div class="calendar-header">
            <span>${year}年${month + 1}月</span>
        </div>
        <div class="calendar-grid">
            <span class="weekday">日</span>
            <span class="weekday">月</span>
            <span class="weekday">火</span>
            <span class="weekday">水</span>
            <span class="weekday">木</span>
            <span class="weekday">金</span>
            <span class="weekday">土</span>
    `;
    
    // 空白
    for (let i = 0; i < firstDay; i++) {
        html += '<span class="day empty"></span>';
    }
    
// 日付
    for (let d = 1; d <= lastDate; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = (d === now.getDate() && month === now.getMonth() && year === now.getFullYear());
        const isChecked = userData.checkedDates.includes(dateStr);
        const dayOfWeek = new Date(year, month, d).getDay();
               
        let classes = 'day';
        if (isToday) classes += ' today';
        if (isChecked) classes += ' checked';
        if (dayOfWeek === 0) classes += ' sunday';
        if (dayOfWeek === 6) classes += ' saturday';
        
        html += `<span class="${classes}" onclick="showDayHistory('${dateStr}')">${d}</span>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}
// ========================================
// 画面表示関数
// ========================================

// キャラ選択画面
function showCharacterSelect() {
    showScreen('characterSelectScreen');
    renderCharacterGrid();
}

// キャラ一覧を表示
function renderCharacterGrid() {
    const grid = document.getElementById('characterGrid');
    if (!grid) return;
    
    let html = '';
    for (const [id, char] of Object.entries(characterTemplates)) {
        const isSelected = userData.selectedCharacter === id;
        html += `
            <div class="character-select-card ${isSelected ? 'selected' : ''}" onclick="selectCharacter('${id}')">
                <img src="${char.image}" alt="${char.defaultName}">
            <div class="name">${char.defaultName}</div>
            </div>
        `;
    }
    grid.innerHTML = html;
}

// キャラ選択
let pendingCharacterId = null;

function selectCharacter(characterId) {
    const character = characterTemplates[characterId];
    pendingCharacterId = characterId;
    
    document.getElementById('characterConfirmText').textContent = 
        `${character.defaultName}を選びますか？`;
    document.getElementById('characterNameInput').value = userData.characterName || character.defaultName;
    document.getElementById('characterNameInput').placeholder = character.defaultName;
    document.getElementById('characterConfirmModal').classList.add('active');
}

function closeCharacterConfirm(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('characterConfirmModal').classList.remove('active');
    pendingCharacterId = null;
}

async function confirmCharacterSelect() {
    if (pendingCharacterId) {
        const character = characterTemplates[pendingCharacterId];
        const inputName = document.getElementById('characterNameInput').value.trim();
        
        userData.selectedCharacter = pendingCharacterId;
        userData.characterName = inputName || character.defaultName;
        await saveUserData();
        updateUI();
        closeCharacterConfirm();
        showMainScreen();
    }
}

// 設定画面
function showSettingsScreen() {
    showScreen('settingsScreen');
}

// 履歴画面
function showHistoryScreen() {
    showScreen('historyScreen');
    renderHistoryList();
}

// 購入画面
function showPurchaseScreen() {
    showScreen('purchaseScreen');
const totalTickets = userData.freeTickets + userData.earnedTickets;
    document.getElementById('currentTickets').textContent = totalTickets;
}

// ========================================
// 招待機能
// ========================================

// 週を特定するキー（例: "2025-W01"）
function getWeekKey() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// 紹介コード生成
function generateReferralCode() {
    if (!userData.referralCode) {
        userData.referralCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
        saveUserData();
    }
    return userData.referralCode;
}

// 招待画面表示
function showReferralScreen() {
    // 紹介コードがなければ生成
    if (!userData.referralCode) {
        userData.referralCode = generateReferralCode();
        saveUserData();
    }
    
    const code = userData.referralCode;
    const currentWeek = getWeekKey();
    
    // 今週の紹介数を取得
    const referralData = JSON.parse(localStorage.getItem('voifor_referral_data') || '{}');
    let weeklyCount = 0;
    
    if (referralData[code] && referralData[code].week === currentWeek) {
        weeklyCount = referralData[code].count || 0;
    }
    
    const remaining = Math.max(0, 3 - weeklyCount);
    
    const modal = document.createElement('div');
    modal.id = 'referralModal';
modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        z-index: 10000;
        padding: 30px 20px;
        overflow-y: auto;
    `;
    
modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a4e 30%, #2d1b69 50%, #1a1a4e 70%, #0f0f23 100%); padding: 30px; border-radius: 25px; max-width: 420px; width: 100%; box-shadow: 0 15px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255, 105, 180, 0.5), 0 0 60px rgba(255, 105, 180, 0.3); border: 3px solid #FFB6C1;">
            <h2 style="margin: 0 0 20px 0; font-size: 1.6em; color: white; text-align: center;">🌸友達を招待🌸</h2>
            
            <div style="background: rgba(255,215,0,0.2); padding: 20px; border-radius: 15px; margin-bottom: 20px; border: 2px solid rgba(255,215,0,0.4);">
                <div style="color: white; font-size: 0.95em; margin-bottom: 10px; text-align: center;">あなたの紹介コード</div>
                <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 10px; text-align: center; font-size: 1.8em; font-weight: bold; color: #FFD700; letter-spacing: 3px; font-family: monospace;">${code}</div>
            </div>
            
            <div style="background: rgba(102, 126, 234, 0.2); padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                <div style="color: white; font-size: 0.9em; line-height: 1.7;">
                    ✨ <strong>紹介特典</strong><br>
                    • SNSでシェア → <strong style="color: #4ade80;">🍀+1</strong><br>
                    • 友達がコード使用 → <strong style="color: #4ade80;">🍀+1</strong><br>
                    • 友達も → <strong style="color: #FFD700;">🍀+1</strong><br>
                    <br>
                    📊 <strong>今週の実績</strong>: <strong style="color: #FFD700;">${weeklyCount}人</strong> / 週3人まで<br>
                    <strong style="color: #4ade80;">残り${remaining}人</strong>招待可能
                </div>
            </div>
            
<div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button onclick="shareToLine('${code}')" style="flex: 1; background: #06C755; border: none; color: white; padding: 15px; border-radius: 12px; font-size: 1em; font-weight: bold; cursor: pointer;">
                    📱 LINE
                </button>
                <button onclick="shareToX('${code}')" style="flex: 1; background: #000000; border: none; color: white; padding: 15px; border-radius: 12px; font-size: 1em; font-weight: bold; cursor: pointer;">
                    𝕏 ポスト
                </button>
            </div>
            
            <button onclick="copyReferralCode('${code}')" style="width: 100%; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); color: white; padding: 15px; border-radius: 12px; font-size: 1em; font-weight: bold; cursor: pointer; margin-bottom: 15px;">
                📋 コードをコピー
            </button>
            
            <button onclick="closeReferralModal()" style="width: 100%; background: transparent; border: none; color: rgba(255,255,255,0.5); padding: 12px; font-size: 0.95em; cursor: pointer;">
                閉じる
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeReferralModal();
        }
    });
}

// モーダルを閉じる
function closeReferralModal() {
    const modal = document.getElementById('referralModal');
    if (modal) {
        modal.remove();
    }
}

// コードをコピー
function copyReferralCode(code) {
navigator.clipboard.writeText(code).then(async () => {
        await showCustomAlert(`紹介コード「${code}」をコピーしました！\n\n友達に送ってあげてください！`, '✅');
    }).catch(async () => {
        await showCustomAlert('コピーに失敗しました', '❌');
    });
}

// LINEでシェア
async function shareToLine(code) {
    const text = `🔮 VOIFOR（声占い）に招待します！\n\n声で今日の運勢を占える楽しいアプリです✨\n\n紹介コード: ${code}\n\n登録時に入力すると、お互いにボーナスクローバーがもらえます！\n\nhttps://voifor.vercel.app`;
    const url = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    
    // 戻ってきたら確認
    setTimeout(async () => {
        if (confirm('📱 LINEでシェアしましたか？\n\nシェアした場合、ボーナスを受け取れます！')) {
            await giveShareBonus('line');
        }
    }, 1000);
}

// Xでシェア
async function shareToX(code) {
    const text = `🔮 VOIFOR（声占い）\n\n声で占える超当たる占いアプリ！\n\n紹介コード: ${code}\n\n#VOIFOR #声占い`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://voifor.vercel.app')}`;
    window.open(url, '_blank');
    
    // 戻ってきたら確認
    setTimeout(async () => {
        if (confirm('𝕏 でポストしましたか？\n\nポストした場合、ボーナスを受け取れます！')) {
            await giveShareBonus('x');
        }
    }, 1000);
}

// SNSシェアボーナス付与（LINE/Twitter別々）
async function giveShareBonus(platform) {
    const currentWeek = getWeekKey();
    const shareData = JSON.parse(localStorage.getItem('voifor_share_data') || '{}');
    
    // 週が変わったらリセット
    if (shareData.week !== currentWeek) {
        shareData.week = currentWeek;
        shareData.line = false;
        shareData.twitter = false;
    }
    
// 今週既にこのプラットフォームでボーナスをもらったか確認
    if (shareData[platform]) {
        const platformName = platform === 'line' ? 'LINE' : '𝕏';
        alert(`📱 ${platformName}シェアありがとう！\n\n（今週の${platformName}ボーナスは受け取り済みです）`);
        return;
    }
    
    // ボーナス付与
    userData.earnedTickets++;
    await saveUserData();
    updateUI();
    
    // このプラットフォームをシェア済みに
    shareData[platform] = true;
    localStorage.setItem('voifor_share_data', JSON.stringify(shareData));
    
const platformName = platform === 'line' ? 'LINE' : '𝕏';
    const otherPlatform = platform === 'line' ? '𝕏' : 'LINE';
    const otherDone = shareData[platform === 'line' ? 'x' : 'line'];
       
    let message = `🎉 ${platformName}シェアありがとう！\n🍀+1クローバーを獲得しました！`;
    if (!otherDone) {
        message += `\n\n💡 ${otherPlatform}でもシェアすると更に🍀+1！`;
    }
 message += `\n\n現在の保有:\n☘️ 無料: ${userData.freeTickets}枚\n🍀 獲得: ${userData.earnedTickets}枚`;
    
    alert(message);
}

// 紹介コード処理（新規ユーザーがコード入力時）
async function processReferralCode(code) {
    if (!code) return;
    
    code = code.trim().toUpperCase();
    
    // 自分の紹介コードは使えない
    if (userData.referralCode && code === userData.referralCode) {
        alert('⚠️ 自分の紹介コードは使用できません');
        return;
    }
    
    // 既に紹介済みか確認
    if (userData.referredBy) {
        alert('⚠️ 既に紹介コードを使用済みです');
        return;
    }
    
    // 紹介者をSupabaseで検索
    const { data: referrer, error } = await supabase
        .from('users')
        .select('*')
        .eq('referral_code', code)
        .single();
    
    if (error || !referrer) {
        alert('⚠️ 紹介コードが見つかりません');
        return;
    }
    
    // 紹介コードを保存
    userData.referredBy = code;
    
    // 被紹介者に🍀+1
    if (userData.freeTickets < 5) {
        userData.freeTickets++;
    }
    
    await saveUserData();
    updateUI();
    
    alert(`🎉 紹介コード適用！\n🍀 無料クローバー+1を獲得しました！\n\n初回占いを完了すると、紹介者にもボーナスが届きます！`);
}

// 初回占い完了時に紹介者にボーナス付与
async function awardReferrerBonus() {
    if (!userData.referredBy) return;
    if (userData.hasUsedOnce) return;
    
    // 紹介者をSupabaseで検索
    const { data: referrer, error } = await supabase
        .from('users')
        .select('*')
        .eq('referral_code', userData.referredBy)
        .single();
    
    if (error || !referrer) {
        console.log('紹介者が見つかりません');
        return;
    }
    
    // 紹介者に🍀+1
    const { error: updateError } = await supabase
        .from('users')
        .update({ earned_tickets: referrer.earned_tickets + 1 })
        .eq('id', referrer.id);
    
    if (!updateError) {
        console.log(`✅ 紹介者にボーナス付与完了`);
    }
    
    // 自分を初回済みに
    userData.hasUsedOnce = true;
    await saveUserData();
}

// 相性占い画面
function showCompatibilityScreen() {
    showScreen('compatibilityScreen');
    resetCompatibility();
}

// タロット画面
function showTarotScreen() {
    showScreen('tarotScreen');
    resetTarot();
}

// ========================================
// 占い機能
// ========================================
  
// 声占い開始（画面表示）
async function startVoiceFortune() {
    const today = new Date().toDateString();
    
    // 日付が変わったらリセット
    if (userData.lastFortuneDate !== today) {
        userData.dailyFortuneCount = 0;
        userData.lastFortuneDate = today;
        await saveUserData();
    }
    
    // プレミアム会員の場合
    if (isPremiumActive()) {
        if (!canUsePremiumToday()) {
            await showCustomAlert('👑 本日の占い回数（20回）に達しました\n\n明日またお楽しみください！', '⚠️');
            return;
        }
        
        const remaining = getPremiumRemaining();
        const confirmed = await showCustomConfirm(`👑 プレミアム占い\n\n本日残り: ${remaining}回`, '🔮', '占う！', 'やめる');
        if (!confirmed) return;
        
        userData.premiumDailyCount++;
        await saveUserData();
        
        proceedToFortuneScreen();
        return;
    }
    
    const totalTickets = userData.freeTickets + userData.earnedTickets;
    const isFirstToday = !userData.dailyFortuneCount || userData.dailyFortuneCount === 0;

    // パターン①: 1日1回無料がある場合
    if (isFirstToday) {
        const confirmed = await showTicketConfirmModal(0, '今日の占い');
        if (!confirmed) return;
        
        userData.dailyFortuneCount = 1;
        await saveUserData();
        
        proceedToFortuneScreen();
        return;
    }
    
    // パターン②: 無料なし、クローバーあり
    if (totalTickets > 0) {
        const confirmed = await showTicketConfirmModal(1, '声占い');
        if (!confirmed) return;
        
        if (userData.freeTickets > 0) {
            userData.freeTickets--;
} else if (userData.earnedTickets > 0) {
            userData.earnedTickets--;
        }
        userData.dailyFortuneCount++;
        await saveUserData();
        updateUI();
        
        proceedToFortuneScreen();
        return;
    }
    
    // パターン③: クローバーなし
    showTicketShortageModal();
}

// 占い画面へ進む
function proceedToFortuneScreen() {
    // 占い画面表示
    showScreen('fortuneScreen');
    
    // 画面リセット
    document.getElementById('recordingArea').style.display = 'block';
    document.getElementById('fortuneLoading').style.display = 'none';
    document.getElementById('fortuneResult').style.display = 'none';
    document.getElementById('countdown').textContent = '';
    
    // キャラ画像セット
    const character = characterTemplates[userData.selectedCharacter] || characterTemplates.devilMale;
    document.getElementById('fortuneCharImage').style.backgroundImage = `url('${character.image}')`;
    document.getElementById('fortuneCharSpeech').textContent = '3秒間、声を聞かせて！';
    
    // 録音ボタンリセット
    const btn = document.getElementById('recordBtn');
    btn.textContent = '🎤 録音開始';
    btn.classList.remove('recording');
    btn.disabled = false;
}

// 録音開始
async function startRecording() {
    const btn = document.getElementById('recordBtn');
    btn.disabled = true;
    
    console.log('🎤 録音開始');
    
    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(recordingStream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        mediaRecorder = new MediaRecorder(recordingStream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
mediaRecorder.onstop = async () => {
            resumeBGM(); // ← 追加
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await analyzeVoice(audioBlob);
            recordingStream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        stopBGM();
        
        btn.textContent = '🔴 録音中...';
        btn.classList.add('recording');
        
        document.getElementById('voiceMeter').style.display = 'block';
        visualizeVoice();
        
        // カウントダウン
        let count = 3;
        document.getElementById('countdown').textContent = count;
        
        const countInterval = setInterval(() => {
            count--;
            if (count > 0) {
                document.getElementById('countdown').textContent = count;
            } else {
                document.getElementById('countdown').textContent = '';
                clearInterval(countInterval);
                stopRecording();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ マイクアクセスエラー:', error);
        btn.disabled = false;
await showCustomAlert('マイクへのアクセスが必要です', '🎤');
    }
}

// 録音停止
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        document.getElementById('voiceMeter').style.display = 'none';
        console.log('✅ 録音完了');
    }
}

// 音量可視化
function visualizeVoice() {
    if (!isRecording || !analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
    }
    const average = sum / bufferLength;
    const percentage = Math.min(100, (average / 128) * 100);
    
    document.getElementById('voiceLevel').style.width = percentage + '%';
    
    if (isRecording) {
        requestAnimationFrame(visualizeVoice);
    }
}

// 音声解析・占い
async function analyzeVoice(audioBlob) {
    const character = characterTemplates[userData.selectedCharacter] || characterTemplates.devilMale;
    
 // ローディング表示
    document.getElementById('recordingArea').style.display = 'none';
    showGlobalLoading([
        '声を分析しています...',
        'あなたの運命を読み取っています...',
        '星々の導きを感じています...',
        '答えが見えてきました...'
    ]);

    try {
        // 音声をBase64に変換
        const reader = new FileReader();
        const base64Audio = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(audioBlob);
        });
        
        console.log('🌐 APIリクエスト送信');
        
        const response = await fetch('https://voifor-server.onrender.com/analyze-voice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                audioBase64: base64Audio,
                characterName: character.defaultName,
                characterPersonality: character.speech
            })
        });
        
        if (!response.ok) {
            throw new Error('サーバーエラー');
        }
        
const data = await response.json();
        console.log('✅ 占い結果取得');
        
// 占い回数更新
        userData.totalReadings++;
        
        // 初回占い完了で紹介者にボーナス
        await awardReferrerBonus();
        
        // 今日の日付をチェック済みに
        const today = new Date().toISOString().split('T')[0];
        if (!userData.checkedDates.includes(today)) {
            userData.checkedDates.push(today);
            userData.streak++;
        }
        
        // 保存
        await saveUserData();
        updateUI();
        renderCalendar();
        
        // 結果表示
        showFortuneResult(data.fortune);
        
 } catch (error) {
        console.error('❌ 占いエラー:', error);
        hideGlobalLoading();
        document.getElementById('fortuneResult').style.display = 'block';
        document.getElementById('fortuneText').textContent = 'エラーが発生しました。もう一度お試しください。';
    }
}

// 占い結果表示
function showFortuneResult(fortune) {
    hideGlobalLoading();
    document.getElementById('fortuneResult').style.display = 'block';
    
    document.getElementById('fortuneText').textContent = fortune || '今日のあなたは運気上昇中！';
    
    const luckyItems = ['四つ葉のクローバー', 'キラキラペン', 'お気に入りの音楽', '温かい飲み物', 'ふわふわクッション'];
    const luckyColors = ['ゴールド', 'スカイブルー', 'ピンク', 'グリーン', 'パープル'];
    
    const luckyItem = luckyItems[Math.floor(Math.random() * luckyItems.length)];
    const luckyColor = luckyColors[Math.floor(Math.random() * luckyColors.length)];
    const luckyNumber = Math.floor(Math.random() * 9) + 1;
    
    document.getElementById('luckyItem').textContent = luckyItem;
    document.getElementById('luckyColor').textContent = luckyColor;
    document.getElementById('luckyNumber').textContent = luckyNumber;
    
    const character = characterTemplates[userData.selectedCharacter] || characterTemplates.devilMale;
    document.getElementById('fortuneCharSpeech').textContent = character.speech;
    
// メイン画面の吹き出しに要約を保存
    const summary = `🍀${luckyItem} 🎨${luckyColor} 🔢${luckyNumber}`;
    const today = new Date().toISOString().split('T')[0];
    
    localStorage.setItem('voifor_today_fortune', JSON.stringify({
        date: today,
        summary: summary
    }));
    
// 履歴に保存
    saveFortuneHistory(today, fortune, summary, 'voice');
}

// もう一度占う
function retryFortune() {
    startVoiceFortune();
}
// ========================================
// カレンダーモーダル
// ========================================

// モーダルを開く
function openCalendarModal() {
    currentCalendarMonth = new Date().getMonth();
    currentCalendarYear = new Date().getFullYear();
    document.getElementById('calendarModal').classList.add('active');
    renderModalCalendar();
}

// モーダルを閉じる
function closeCalendarModal(event) {
    if (!event || event.target.id === 'calendarModal') {
        document.getElementById('calendarModal').classList.remove('active');
    }
}

function changeMonth(delta) {
    currentCalendarMonth += delta;
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    } else if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }
    renderModalCalendar();
}

// モーダル用カレンダー描画
function renderModalCalendar() {
    const container = document.getElementById('modalCalendarGrid');
    if (!container) return;
    
    const year = currentCalendarYear;
    const month = currentCalendarMonth;
    const now = new Date();
    
    // タイトル更新
    document.getElementById('modalMonthTitle').textContent = `${year}年${month + 1}月`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    let html = `
        <span class="weekday">日</span>
        <span class="weekday">月</span>
        <span class="weekday">火</span>
        <span class="weekday">水</span>
        <span class="weekday">木</span>
        <span class="weekday">金</span>
        <span class="weekday">土</span>
    `;
    
    // 空白
    for (let i = 0; i < firstDay; i++) {
        html += '<span class="day empty"></span>';
    }
    
// 日付
    for (let d = 1; d <= lastDate; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = (d === now.getDate() && month === now.getMonth() && year === now.getFullYear());
        const isChecked = userData.checkedDates.includes(dateStr);
               
        let classes = 'day';
        if (isToday) classes += ' today';
        if (isChecked) classes += ' checked';
        
        html += `<span class="${classes}" onclick="showDayHistory('${dateStr}')">${d}</span>`;
    }
    
    container.innerHTML = html;
    
    // 履歴エリアリセット
    document.getElementById('modalHistoryArea').innerHTML = '<p class="history-placeholder">日付をタップして履歴を見る</p>';
}

// 日付の履歴を表示
function showDayHistory(dateStr) {
    const historyArea = document.getElementById('modalHistoryArea');
    
    // 選択状態を更新
    document.querySelectorAll('.modal-calendar-grid .day').forEach(el => {
        el.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // 履歴を取得
    const history = getFortuneHistory(dateStr);
    
    if (history) {
        historyArea.innerHTML = `
            <div class="history-content">
                <div class="history-date">📅 ${formatDate(dateStr)}</div>
                <div class="history-fortune">${history.fortune || '占い結果なし'}</div>
                <div class="history-lucky">${history.summary || ''}</div>
            </div>
        `;
    } else {
        historyArea.innerHTML = `
            <div class="history-content">
                <div class="history-date">📅 ${formatDate(dateStr)}</div>
                <p style="opacity: 0.6;">この日の占い記録はありません</p>
            </div>
        `;
    }
}

// 日付フォーマット
function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${year}年${parseInt(month)}月${parseInt(day)}日`;
}

// 履歴を取得
function getFortuneHistory(dateStr) {
    const history = JSON.parse(localStorage.getItem('voifor_fortune_history') || '{}');
    return history[dateStr];
}

// 履歴を保存
function saveFortuneHistory(dateStr, fortune, summary, type = 'voice') {
    const history = JSON.parse(localStorage.getItem('voifor_fortune_history') || '{}');
    history[dateStr] = {
        fortune: fortune,
        summary: summary,
        type: type,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('voifor_fortune_history', JSON.stringify(history));
}
// ========================================
// クローバー購入（PAY.JP）
// ========================================

// PAY.JP公開キー
const payjpPublicKey = 'pk_test_85dfd6fab5061d365785d049';
let payjpInstance = null;

function getPayjp() {
    if (!payjpInstance) {
        payjpInstance = Payjp(payjpPublicKey);
    }
    return payjpInstance;
}

// クローバー購入
async function purchaseTickets(tickets, price) {
    showCustomAlert('💳 決済機能は準備中です！\n\nもうしばらくお待ちください✨', '🚧');
}

// 決済処理
async function processPurchase(token, tickets, price) {
    try {
        const deviceId = getDeviceId();
        
        const response = await fetch('https://voifor-server.onrender.com/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                amount: price,
                tickets: tickets,
                deviceId: deviceId
            })
        });
        
        const result = await response.json();
        
if (result.success) {
            userData.earnedTickets = (userData.earnedTickets || 0) + tickets;
            await saveUserData();
            updateUI();
            await showCustomAlert(`✅ 購入完了！\n${tickets}クローバーを追加しました`, '🎉');
        } else {
            await showCustomAlert('❌ 決済に失敗しました: ' + (result.error || ''), '❌');
        }
        
    } catch (error) {
        console.error('決済エラー:', error);
        await showCustomAlert('決済処理中にエラーが発生しました', '❌');
    }
}

// 決済モーダル表示
function showPaymentModal(tickets, price, type) {
    const modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    const title = type === 'premium' ? 'プレミアム登録' : `クローバー${tickets}枚購入`;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e, #2d1b69); padding: 30px; border-radius: 20px; max-width: 400px; width: 100%; border: 2px solid rgba(255,255,255,0.2);">
            <h2 style="text-align: center; margin-bottom: 20px; color: white;">💳 ${title}</h2>
            <p style="text-align: center; color: #FFD700; font-size: 1.3em; margin-bottom: 20px;">¥${price.toLocaleString()}</p>
            
<div style="margin-bottom: 20px;">
                <div id="payjp-card-number" style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 10px; min-height: 50px;"></div>
                <div style="display: flex; gap: 10px;">
                    <div id="payjp-card-expiry" style="flex: 1; background: white; padding: 15px; border-radius: 10px; min-height: 50px;"></div>
                    <div id="payjp-card-cvc" style="flex: 1; background: white; padding: 15px; border-radius: 10px; min-height: 50px;"></div>
                </div>
            </div>
            <div id="card-errors" style="color: #ff6b6b; font-size: 0.9em; margin-bottom: 15px; text-align: center;"></div>
            
            <button id="payBtn" onclick="submitPaymentElements(${tickets}, ${price}, '${type}')" 
                style="width: 100%; padding: 15px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 12px; color: white; font-size: 1.1em; font-weight: bold; cursor: pointer; margin-bottom: 10px;">
                支払う
            </button>
            
            <button onclick="closePaymentModal()" 
                style="width: 100%; padding: 12px; background: transparent; border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; color: rgba(255,255,255,0.7); font-size: 1em; cursor: pointer;">
                キャンセル
            </button>
            
            <p style="text-align: center; margin-top: 15px; font-size: 0.8em; color: rgba(255,255,255,0.5);">🔒 PAY.JPによる安全な決済</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // PAY.JP Elements マウント
setTimeout(() => {
        try {
            const payjp = getPayjp();
            const elements = payjp.elements();
            const cardStyle = {
                base: {
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#333',
                    '::placeholder': {
                        color: '#aaa'
                    }
                },
                invalid: {
                    color: '#e25950'
                }
            };
            window.cardNumberElement = elements.create('cardNumber', { style: cardStyle, placeholder: 'カード番号' });
            window.cardExpiryElement = elements.create('cardExpiry', { style: cardStyle, placeholder: '有効期限' });
            window.cardCvcElement = elements.create('cardCvc', { style: cardStyle, placeholder: 'CVC' });
            window.cardNumberElement.mount('#payjp-card-number');
            window.cardExpiryElement.mount('#payjp-card-expiry');
            window.cardCvcElement.mount('#payjp-card-cvc');         
const handleError = function(event) {
                const displayError = document.getElementById('card-errors');
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            };
            window.cardNumberElement.on('change', handleError);
            window.cardExpiryElement.on('change', handleError);
            window.cardCvcElement.on('change', handleError);
        } catch (e) {
            console.error('Elements初期化エラー:', e);
        }
    }, 100);
}
// 決済モーダルを閉じる
function closePaymentModal() {
    document.getElementById('paymentModal')?.remove();
}

// 決済送信（Elements版）
async function submitPaymentElements(tickets, price, type) {
    const title = type === 'premium' ? 'プレミアム登録' : `クローバー${tickets}枚`;
    const confirmed = await showCustomConfirm(
        `${title}\n¥${price.toLocaleString()}を決済しますか？`,
        '💳',
        '決済する',
        'キャンセル'
    );
    
    if (!confirmed) {
        return;
    }
    
    const btn = document.getElementById('payBtn');
    btn.textContent = '処理中...';
    btn.disabled = true;
    
    try {
        const payjp = getPayjp();
        const result = await payjp.createToken(window.cardNumberElement);
        
        if (result.error) {
            document.getElementById('card-errors').textContent = result.error.message;
            btn.textContent = '支払う';
            btn.disabled = false;
            return;
        }
        
        closePaymentModal();
        
        if (type === 'premium') {
            await processSubscription(result.id);
        } else {
            await processPurchase(result.id, tickets, price);
        }
        
    } catch (error) {
        console.error('決済エラー:', error);
        btn.textContent = '支払う';
        btn.disabled = false;
        await showCustomAlert('決済処理中にエラーが発生しました', '❌');
    }
}

// ========================================
// プレミアム判定関数
// ========================================

// プレミアム有効判定
function isPremiumActive() {
    if (!userData.isPremium) return false;
    if (!userData.premiumExpiry) return false;
    
    const now = new Date();
    const expiry = new Date(userData.premiumExpiry);
    return now < expiry;
}

// 今日のプレミアム使用可能判定
function canUsePremiumToday() {
    if (!isPremiumActive()) return false;
    
    const today = new Date().toDateString();
    
    // 日付が変わったらリセット
    if (userData.premiumLastDate !== today) {
        userData.premiumDailyCount = 0;
        userData.premiumLastDate = today;
    }
    
    return userData.premiumDailyCount < 20;
}

// プレミアム残り回数
function getPremiumRemaining() {
    if (!isPremiumActive()) return 0;
    
    const today = new Date().toDateString();
    if (userData.premiumLastDate !== today) {
        return 20;
    }
    
    return Math.max(0, 20 - userData.premiumDailyCount);
}

// ========================================
// プレミアム・無料獲得
// ========================================

// プレミアム購入
async function purchasePremium() {
    showCustomAlert('👑 プレミアム登録は準備中です！\n\nもうしばらくお待ちください✨', '🚧');
}

// サブスク処理
async function processSubscription(token) {
    try {
        const deviceId = getDeviceId();
        
        const response = await fetch('https://voifor-server.onrender.com/create-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                deviceId: deviceId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            userData.isPremium = true;
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + 1);
            userData.premiumExpiry = expiry.toISOString();
            await saveUserData();
            updateUI();
            await showCustomAlert('✅ プレミアム登録完了！\n毎日20回まで占い放題です', '👑');
        } else {
            await showCustomAlert('❌ 登録に失敗しました: ' + (result.error || ''), '❌');
        }
        
    } catch (error) {
        console.error('サブスク登録エラー:', error);
        await showCustomAlert('登録処理中にエラーが発生しました', '❌');
    }
}

// ========================================
// 動画広告システム
// ========================================

const MAX_DAILY_ADS = 3;

// 動画視聴可能かチェック
function canWatchAd() {
    const today = new Date().toDateString();
    const adData = JSON.parse(localStorage.getItem('voifor_ad_data') || '{}');
    const todayCount = adData[today] || 0;
    return todayCount < MAX_DAILY_ADS;
}

// 視聴回数を増やす
function incrementAdCount() {
    const today = new Date().toDateString();
    const adData = JSON.parse(localStorage.getItem('voifor_ad_data') || '{}');
    adData[today] = (adData[today] || 0) + 1;
    localStorage.setItem('voifor_ad_data', JSON.stringify(adData));
}

// 動画広告でクローバー獲得
function watchAdForTicket() {
    if (!canWatchAd()) {
        showAdLimitModal();
        return;
    }
    
    const today = new Date().toDateString();
    const adData = JSON.parse(localStorage.getItem('voifor_ad_data') || '{}');
    const remaining = MAX_DAILY_ADS - (adData[today] || 0);
    
    showAdConfirmModal(remaining);
}

// 上限到達モーダル
function showAdLimitModal() {
    const modal = document.createElement('div');
    modal.id = 'adLimitModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a4e 30%, #2d1b69 50%, #1a1a4e 70%, #0f0f23 100%); padding: 30px; border-radius: 25px; max-width: 400px; width: 100%; box-shadow: 0 15px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255, 105, 180, 0.5), 0 0 60px rgba(255, 105, 180, 0.3); border: 3px solid #FFB6C1; text-align: center;">
            <div style="font-size: 3em; margin-bottom: 15px;">⚠️</div>
            <h2 style="font-size: 1.3em; margin-bottom: 15px; color: white;">本日の上限に達しました</h2>
            <p style="font-size: 1em; opacity: 0.8; color: white; margin-bottom: 25px;">動画視聴は1日3回までです<br>明日また見てね！</p>
            <button onclick="this.closest('#adLimitModal').remove()" style="background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; padding: 15px 40px; border-radius: 25px; font-size: 1em; font-weight: bold; cursor: pointer;">
                OK
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// 視聴確認モーダル
function showAdConfirmModal(remaining) {
    const modal = document.createElement('div');
    modal.id = 'adConfirmModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a4e 30%, #2d1b69 50%, #1a1a4e 70%, #0f0f23 100%); padding: 30px; border-radius: 25px; max-width: 400px; width: 100%; box-shadow: 0 15px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255, 105, 180, 0.5), 0 0 60px rgba(255, 105, 180, 0.3); border: 3px solid #FFB6C1; text-align: center;">
            <div style="font-size: 3em; margin-bottom: 15px;">🎥</div>
            <h2 style="font-size: 1.3em; margin-bottom: 15px; color: white;">動画を見てクローバーGET！</h2>
            <p style="font-size: 1em; color: white; margin-bottom: 10px;">30秒の動画を見ると<br><span style="color: #4ade80; font-weight: bold;">☘️+1クローバー</span>GET！</p>
            <p style="font-size: 0.9em; opacity: 0.7; color: white; margin-bottom: 25px;">残り視聴可能回数: <span style="color: #FFD700; font-weight: bold;">${remaining}回</span></p>
            <div style="display: flex; gap: 15px;">
                <button onclick="this.closest('#adConfirmModal').remove()" style="flex: 1; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); color: white; padding: 15px; border-radius: 25px; font-size: 1em; cursor: pointer;">
                    やめる
                </button>
                <button onclick="this.closest('#adConfirmModal').remove(); showVideoAd();" style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; padding: 15px; border-radius: 25px; font-size: 1em; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);">
                    見る！
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// ========================================
// Unity Ads 動画広告
// ========================================

// 動画広告表示
function showVideoAd() {
    // BGM停止
    stopBGM();
    
    // 1日の視聴制限チェック
    const today = new Date().toDateString();
    const adData = JSON.parse(localStorage.getItem('voifor_ad_data') || '{}');
    const todayCount = adData[today] || 0;
    
    if (todayCount >= MAX_DAILY_ADS) {
        showCustomAlert('本日の動画視聴は上限に達しました\nまた明日お越しください！', '📺');
        return;
    }
    
    // 動画モーダル表示
    const videoModal = document.createElement('div');
    videoModal.id = 'videoAdModal';
    videoModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    videoModal.innerHTML = `
        <div style="width: 100%; max-width: 350px; text-align: center;">
            <p style="color: white; margin-bottom: 15px; font-size: 1.1em;">🎬 動画を最後まで見てクローバーGET！</p>
            <div style="position: relative; width: 100%; padding-bottom: 177.78%; background: #000; border-radius: 15px; overflow: hidden;">
                <iframe 
                    id="ytPlayer"
                    src="https://www.youtube.com/embed/Ocw0YTRA3xU?enablejsapi=1&autoplay=1&rel=0&playsinline=1" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                    allow="autoplay; encrypted-media"
                    allowfullscreen>
                </iframe>
            </div>
            <button onclick="closeVideoAd(false)" style="margin-top: 20px; background: rgba(255,255,255,0.2); border: none; color: white; padding: 12px 30px; border-radius: 25px; font-size: 1em; cursor: pointer;">
                ✕ 閉じる
            </button>
            <button onclick="closeVideoAd(true)" id="claimRewardBtn" style="margin-top: 10px; background: linear-gradient(135deg, #FFD700, #FFA500); border: none; color: #333; padding: 12px 30px; border-radius: 25px; font-size: 1em; cursor: pointer; display: none; font-weight: bold;">
                🍀 クローバーを受け取る
            </button>
        </div>
    `;
    
    document.body.appendChild(videoModal);
    
    // 30秒後に報酬ボタン表示
    setTimeout(() => {
        const claimBtn = document.getElementById('claimRewardBtn');
        if (claimBtn) {
            claimBtn.style.display = 'inline-block';
        }
    }, 5000);
}

// 動画広告を閉じる
function closeVideoAd(claimReward) {
    const modal = document.getElementById('videoAdModal');
    if (modal) {
        modal.remove();
    }
    
    // BGM再開
    resumeBGM();
    
    if (claimReward) {
        giveAdReward();
    }
}
  

// 広告報酬付与
async function giveAdReward() {
    incrementAdCount();
    
    let success = false;
    if (userData.freeTickets < 5) {
        userData.freeTickets++;
        success = true;
        await saveUserData();
        updateUI();
    }
    
    const today = new Date().toDateString();
    const adData = JSON.parse(localStorage.getItem('voifor_ad_data') || '{}');
    const remaining = MAX_DAILY_ADS - (adData[today] || 0);
    
    if (success) {
        await showCustomAlert(`🎉 ☘️+1を獲得しました！\n\n現在の保有:\n☘️ 無料: ${userData.freeTickets}枚\n🍀 獲得: ${userData.earnedTickets}枚\n\n本日の残り視聴可能回数: ${remaining}回`, '🎉');
    } else {
        await showCustomAlert(`⚠️ ☘️無料クローバーは上限(5枚)に達しています\n\n無料クローバーを使ってからまた受け取れます！`, '⚠️');
    }
}


// SNSシェア
async function shareToSNS() {
    const text = '声で占う新感覚アプリ「VOIFOR」で今日の運勢を占ったよ！🔮✨';
    const url = 'https://voifor.vercel.app';
    
    if (navigator.share) {
        navigator.share({
            title: 'VOIFOR -声占い-',
            text: text,
            url: url
}).then(async () => {
            // シェア成功したらクローバー付与
            userData.earnedTickets++;
            saveUserData();
            updateUI();
            await showCustomAlert('シェアありがとう！\n🍀 1クローバー獲得！', '🎉');
        }).catch((error) => {
            console.log('シェアキャンセル');
        });
    } else {
        // Web Share API非対応の場合
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
    }
}
// ========================================
// プロフィール編集
// ========================================

// 編集画面表示
function showEditScreen() {
    showScreen('editScreen');
    
    // 現在の値をセット
    document.getElementById('editName').value = userData.name || '';
    document.getElementById('editBirth').value = userData.birth || '';
    document.getElementById('editBloodType').value = userData.bloodType || '';
    document.getElementById('editGender').value = userData.gender || '';
}

// プロフィール保存
async function saveProfile() {
    userData.name = document.getElementById('editName').value;
    userData.birth = document.getElementById('editBirth').value;
    userData.bloodType = document.getElementById('editBloodType').value;
    userData.gender = document.getElementById('editGender').value;
    
await saveUserData();
    updateUI();
    await showCustomAlert('保存しました！', '✅');
    goBack();
}

// データリセット確認
async function confirmReset() {
    const first = await showCustomConfirm('本当にすべてのデータをリセットしますか？\n\nこの操作は取り消せません。', '⚠️', 'リセット', 'やめる');
    if (first) {
        const second = await showCustomConfirm('最終確認です。\n本当にリセットしますか？', '🗑️', 'リセットする', 'やめる');
        if (second) {
            resetAllData();
        }
    }
}

// データリセット実行
async function resetAllData() {
    // ローカルストレージクリア
    localStorage.removeItem('voifor_device_id');
    localStorage.removeItem('voifor_today_fortune');
    localStorage.removeItem('voifor_fortune_history');
    
await showCustomAlert('データをリセットしました。\nアプリを再読み込みします。', '✅');
    location.reload();
}

// ========================================
// 履歴画面
// ========================================

let currentHistoryFilter = 'all';

// 履歴リスト表示
function renderHistoryList() {
    const container = document.getElementById('historyList');
    if (!container) return;
    
    const history = JSON.parse(localStorage.getItem('voifor_fortune_history') || '{}');
    const entries = Object.entries(history);
    
    // 日付の新しい順にソート
    entries.sort((a, b) => new Date(b[0]) - new Date(a[0]));
    
// フィルタリング
    const filtered = entries.filter(([date, data]) => {
        if (currentHistoryFilter === 'all') return true;
        // typeがない古いデータは声占いとして扱う
        const dataType = data.type || 'voice';
        return dataType === currentHistoryFilter;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="history-empty">
                <p>📭</p>
                <p>履歴がありません</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    filtered.forEach(([date, data]) => {
        const typeIcon = getTypeIcon(data.type || 'voice');
        const shortFortune = (data.fortune || '').substring(0, 50) + '...';
        
        html += `
            <div class="history-item" onclick="showHistoryDetail('${date}')">
                <div class="history-item-header">
                    <span class="history-item-type">${typeIcon}</span>
                    <span class="history-item-date">${formatDate(date)}</span>
                </div>
                <div class="history-item-summary">${data.summary || shortFortune}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// タイプ別アイコン取得
function getTypeIcon(type) {
    const icons = {
        'voice': '🎤',
        'tarot': '🃏',
        'compatibility': '💕',
        'dream': '💭'
    };
    return icons[type] || '🔮';
}

// フィルター切り替え
function filterHistory(type) {
    currentHistoryFilter = type;
    
    // タブのアクティブ状態更新
    document.querySelectorAll('.history-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
const tabId = {
        'all': 'tabAll',
        'voice': 'tabVoice',
        'tarot': 'tabTarot',
        'compatibility': 'tabCompat',
        'dream': 'tabDream',
        'soul': 'tabSoul'
    };
    
    document.getElementById(tabId[type]).classList.add('active');
    
    renderHistoryList();
}

// 履歴詳細表示
async function showHistoryDetail(date) {
    const history = JSON.parse(localStorage.getItem('voifor_fortune_history') || '{}');
    const data = history[date];
    
    if (data) {
        await showCustomAlert(`📅 ${formatDate(date)}\n\n${data.fortune || '詳細なし'}\n\n${data.summary || ''}`, '🔮');
    }
}
// ========================================
// タロット占い
// ========================================

// タロットカードデータ
const tarotCardData = [
    { name: "愚者", meaning: "新しい始まり、自由、冒険" },
    { name: "魔術師", meaning: "創造力、技術、意志" },
    { name: "女教皇", meaning: "直感、秘密、知恵" },
    { name: "女帝", meaning: "豊穣、母性、愛情" },
    { name: "皇帝", meaning: "権威、安定、父性" },
    { name: "法王", meaning: "伝統、教え、精神性" },
    { name: "恋人", meaning: "愛、選択、調和" },
    { name: "戦車", meaning: "勝利、意志、前進" },
    { name: "力", meaning: "勇気、忍耐、内なる強さ" },
    { name: "隠者", meaning: "内省、孤独、真理の探求" },
    { name: "運命の輪", meaning: "変化、運命、転機" },
    { name: "正義", meaning: "公平、真実、因果" },
    { name: "吊るされた男", meaning: "犠牲、視点の転換、忍耐" },
    { name: "死神", meaning: "終わりと始まり、変容、再生" },
    { name: "節制", meaning: "バランス、調和、自制" },
    { name: "悪魔", meaning: "誘惑、束縛、物質主義" },
    { name: "塔", meaning: "破壊、突然の変化、解放" },
    { name: "星", meaning: "希望、インスピレーション、癒し" },
    { name: "月", meaning: "不安、幻想、潜在意識" },
    { name: "太陽", meaning: "成功、喜び、明瞭さ" },
    { name: "審判", meaning: "復活、判断、新生" },
    { name: "世界", meaning: "完成、達成、統合" }
];

// タロット状態
let tarotState = {
    spread: 1,
    category: '',
    selectedCards: [],
    ticketCost: 1,
    ticketUsed: false
};

// タロットリセット
function resetTarot() {
    tarotState = {
        spread: 1,
        category: '',
        selectedCards: [],
        ticketCost: 1,
        ticketUsed: false
    };
    
    // テキスト入力をクリア
    const questionInput = document.getElementById('tarotQuestionInput');
    if (questionInput) questionInput.value = '';
    
    document.getElementById('tarotStep1').style.display = 'block';
    document.getElementById('tarotStep2').style.display = 'none';
    document.getElementById('tarotStep3').style.display = 'none';
    document.getElementById('tarotLoading').style.display = 'none';
    document.getElementById('tarotResult').style.display = 'none';
    
    document.querySelectorAll('.spread-option').forEach(el => el.classList.remove('selected'));
}

// スプレッド選択
async function selectSpread(num) {
    tarotState.spread = num;
    tarotState.ticketCost = num === 1 ? 1 : 2;
    
    // プレミアム会員はチケット不要
    if (isPremiumActive()) {
        if (!canUsePremiumToday()) {
            await showCustomAlert('👑 本日の占い回数（20回）に達しました\n\n明日またお楽しみください！', '⚠️');
            return;
        }
        document.getElementById('tarotStep1').style.display = 'none';
        document.getElementById('tarotStep2').style.display = 'block';
        return;
    }
    
    // クローバー確認
    const totalTickets = userData.freeTickets + userData.earnedTickets;
    if (totalTickets < tarotState.ticketCost) {
        showTicketShortageModal();
        return;
    }
    
    document.getElementById('tarotStep1').style.display = 'none';
    document.getElementById('tarotStep2').style.display = 'block';
}

// カテゴリ選択
function selectTarotCategory(category) {
    tarotState.category = category;
    
    document.querySelectorAll('.category-btn').forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');
    
    // Step3へ
    document.getElementById('tarotStep2').style.display = 'none';
    document.getElementById('tarotStep3').style.display = 'block';
    
    document.getElementById('cardCount').textContent = tarotState.spread;
    document.getElementById('maxCards').textContent = tarotState.spread;
    document.getElementById('selectedCount').textContent = '0';
    
    renderTarotCards();
}
// Step3の戻る
async function confirmTarotStep3Back() {
    if (tarotState.ticketUsed) {
        // クローバー消費済み → 戻れない
   await showCustomAlert('クローバーを消費したため、戻れません', '⚠️');
    } else {
        // カテゴリ選択 → Step2へ戻れる
        document.getElementById('tarotStep3').style.display = 'none';
        document.getElementById('tarotStep2').style.display = 'block';
    }
}

// テキストで質問
async function submitTarotTextQuestion() {
    const question = document.getElementById('tarotQuestionInput').value.trim();
    
if (!question) {
        await showCustomAlert('質問を入力してください', '✏️');
        return;
    }
    
    // クローバー確認
    const totalTickets = userData.freeTickets + userData.earnedTickets;
 if (totalTickets < tarotState.ticketCost) {
        showTicketShortageModal();
        return;
    }
    
    // 確認モーダル表示
    showTarotTextConfirmModal(question);
}

// タロットテキスト質問確認モーダル
function showTarotTextConfirmModal(question) {
    // プレミアム会員かどうかで表示を変える
    let costText = '';
    if (isPremiumActive()) {
        const remaining = getPremiumRemaining();
        costText = `👑 プレミアム（本日残り: ${remaining}回）`;
    } else {
        costText = `🍀 ${tarotState.ticketCost}クローバー使用します`;
    }
    
    const modal = document.createElement('div');
    modal.id = 'tarotTextConfirmModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a4e 30%, #2d1b69 50%, #1a1a4e 70%, #0f0f23 100%); padding: 30px; border-radius: 25px; max-width: 400px; width: 100%; box-shadow: 0 15px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255, 105, 180, 0.5), 0 0 60px rgba(255, 105, 180, 0.3); border: 3px solid #FFB6C1; text-align: center;">
            <div style="font-size: 3em; margin-bottom: 15px;">🃏</div>
            <h2 style="font-size: 1.3em; margin-bottom: 15px; color: white;">タロット占い</h2>
            <p style="font-size: 1em; color: white; margin-bottom: 10px;">この質問で占いますか？</p>
            <p style="font-size: 0.95em; color: #FFD700; margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 10px;">「${question}」</p>
        <p style="font-size: 0.9em; opacity: 0.8; color: white; margin-bottom: 20px;">${costText}</p>
            <div style="display: flex; gap: 15px;">
                <button onclick="this.closest('#tarotTextConfirmModal').remove()" style="flex: 1; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); color: white; padding: 15px; border-radius: 25px; font-size: 1em; cursor: pointer;">
                    やめる
                </button>
                <button onclick="confirmTarotTextQuestion('${question.replace(/'/g, "\\'")}')" style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; padding: 15px; border-radius: 25px; font-size: 1em; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);">
                    占う！
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// タロットテキスト質問確定
async function confirmTarotTextQuestion(question) {
    document.getElementById('tarotTextConfirmModal')?.remove();
    
    // プレミアム会員の場合
    if (isPremiumActive()) {
        userData.premiumDailyCount++;
        tarotState.ticketUsed = true;
        await saveUserData();
    } else {
        // 通常ユーザー：クローバー消費
        for (let i = 0; i < tarotState.ticketCost; i++) {
            if (userData.freeTickets > 0) {
                userData.freeTickets--;
            } else if (userData.earnedTickets > 0) {
                userData.earnedTickets--;
            }
        }
        tarotState.ticketUsed = true;
        await saveUserData();
        updateUI();
    }
    
    // 質問をカテゴリとして保存
    tarotState.category = question;
    
    // Step3へ
    document.getElementById('tarotStep2').style.display = 'none';
    document.getElementById('tarotStep3').style.display = 'block';
    
    document.getElementById('cardCount').textContent = tarotState.spread;
    document.getElementById('maxCards').textContent = tarotState.spread;
    document.getElementById('selectedCount').textContent = '0';
    
    renderTarotCards();
}

// タロットカード表示
function renderTarotCards() {
    const container = document.getElementById('tarotCards');
    tarotState.selectedCards = [];
    
    let html = '';
    for (let i = 0; i < 12; i++) {
        html += `<div class="tarot-card" onclick="toggleTarotCard(${i})" data-index="${i}">🃏</div>`;
    }
    container.innerHTML = html;
    
    document.getElementById('revealBtn').disabled = true;
}

// カード選択トグル
function toggleTarotCard(index) {
    const card = document.querySelector(`.tarot-card[data-index="${index}"]`);
    
    if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        tarotState.selectedCards = tarotState.selectedCards.filter(i => i !== index);
    } else {
        if (tarotState.selectedCards.length >= tarotState.spread) {
            return;
        }
        card.classList.add('selected');
        tarotState.selectedCards.push(index);
    }
    
    document.getElementById('selectedCount').textContent = tarotState.selectedCards.length;
    document.getElementById('revealBtn').disabled = tarotState.selectedCards.length !== tarotState.spread;
}

// カードをめくる
async function revealCards() {
    // 声で質問の場合は既にクローバー消費済み
    if (!tarotState.ticketUsed) {
        // プレミアム会員の場合
        if (isPremiumActive()) {
            if (!canUsePremiumToday()) {
                await showCustomAlert('👑 本日の占い回数（20回）に達しました\n\n明日またお楽しみください！', '⚠️');
                return;
            }
            const remaining = getPremiumRemaining();
            const confirmed = await showCustomConfirm(`👑 プレミアム占い\n\n本日残り: ${remaining}回`, '🔮', '占う！', 'やめる');
            if (!confirmed) return;
            
            userData.premiumDailyCount++;
            tarotState.ticketUsed = true;
            await saveUserData();
        } else {
            // 通常ユーザー
            const totalTickets = userData.freeTickets + userData.earnedTickets;
            if (totalTickets < tarotState.ticketCost) {
                showTicketShortageModal();
                return;
            }
            
            const confirmed = await showCustomConfirm(`🍀 ${tarotState.ticketCost}枚使用しますか？`, '🔮', '占う！', 'やめる');
            if (!confirmed) {
                return;
            }
            
            // クローバー消費
            for (let i = 0; i < tarotState.ticketCost; i++) {
                if (userData.freeTickets > 0) {
                    userData.freeTickets--;
                } else if (userData.earnedTickets > 0) {
                    userData.earnedTickets--;
                }
            }
            tarotState.ticketUsed = true;
            await saveUserData();
            updateUI();
        }
    }
    
document.getElementById('tarotStep3').style.display = 'none';
    document.getElementById('tarotLoading').style.display = 'block';
    
    // ランダムLottie表示
    showRandomLottie();
    
    // メッセージを段階的に変化
    const messages = [
        'カードが語りかけています...',
        'あなたの運命を読み取っています...',
        '星々の導きを感じています...',
        '答えが見えてきました...'
    ];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % messages.length;
        const textEl = document.getElementById('tarotLoadingText');
        if (textEl) textEl.textContent = messages[msgIndex];
    }, 4000);
    
window.tarotMsgInterval = msgInterval;
    
    // ランダムLottie表示
    showRandomLottie();
    
    // ランダムにカードを選ぶ
    const shuffled = [...tarotCardData].sort(() => Math.random() - 0.5);
    const drawnCards = shuffled.slice(0, tarotState.spread);
    
    const character = characterTemplates[userData.selectedCharacter] || characterTemplates.devilMale;
    
    try {
        const response = await fetch('https://voifor-server.onrender.com/tarot-fortune', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cards: drawnCards,
                category: tarotState.category,
                characterName: character.defaultName,
                characterPersonality: character.speech
            })
        });
        
        if (!response.ok) {
            throw new Error('サーバーエラー');
        }
        
        const data = await response.json();
        
userData.totalReadings++;
        await saveUserData();
        updateUI();
        
        // 履歴保存
        const today = new Date().toISOString().split('T')[0];
        const cardNames = drawnCards.map(c => c.name).join(', ');
saveFortuneHistory(today + '_tarot_' + Date.now(), data.fortune, `🃏 ${cardNames}`, 'tarot');
        
        // メッセージ変化を停止
        if (window.tarotMsgInterval) {
            clearInterval(window.tarotMsgInterval);
        }
        
        showTarotResult(drawnCards, data.fortune);

} catch (error) {
        console.error('タロットエラー:', error);
        document.getElementById('tarotLoading').style.display = 'none';
        document.getElementById('tarotResult').style.display = 'block';
        document.getElementById('tarotFortuneText').textContent = 'エラーが発生しました。クローバーは消費されていません。';
        // エラー時はクローバー消費なし
        tarotState.ticketUsed = false;
    }
}

// タロット結果表示
function showTarotResult(cards, fortune) {
    document.getElementById('tarotLoading').style.display = 'none';
    document.getElementById('tarotResult').style.display = 'block';
    
    // カード表示
    let cardsHtml = '';
    cards.forEach(card => {
        cardsHtml += `
            <div class="result-tarot-card">
                <div class="card-name">${card.name}</div>
                <div class="card-meaning">${card.meaning}</div>
            </div>
        `;
    });
    document.getElementById('resultCards').innerHTML = cardsHtml;
    
    document.getElementById('tarotFortuneText').textContent = fortune || 'カードがあなたの運命を示しています。';
}

// もう一度占う
function retryTarot() {
    resetTarot();
}

// 戻るボタン
function backToTarotStep1() {
    document.getElementById('tarotStep2').style.display = 'none';
    document.getElementById('tarotStep1').style.display = 'block';
}

function backToTarotStep2() {
    document.getElementById('tarotStep3').style.display = 'none';
    document.getElementById('tarotStep2').style.display = 'block';
}

// 戻る確認
async function confirmTarotBack() {
    if (tarotState.ticketUsed) {
    const confirmed = await showCustomConfirm('戻るとクローバーは\n戻りません。よろしいですか？', '⚠️', '戻る', 'やめる');
        if (confirmed) {
            goBack();
        }
    } else {
        // 現在のステップに応じて戻る
        const step1 = document.getElementById('tarotStep1');
        const step2 = document.getElementById('tarotStep2');
        const step3 = document.getElementById('tarotStep3');
        const result = document.getElementById('tarotResult');
        
        if (result.style.display !== 'none') {
            // 結果 → メイン
            goBack();
        } else if (step3.style.display !== 'none') {
            // Step3 → Step2
            step3.style.display = 'none';
            step2.style.display = 'block';
        } else if (step2.style.display !== 'none') {
            // Step2 → Step1
            step2.style.display = 'none';
            step1.style.display = 'block';
        } else {
            // Step1 → メイン
            goBack();
        }
    }
}

// 声で質問
let tarotVoiceInterval = null;

async function startTarotVoiceQuestion() {
    // チケット確認
    const totalTickets = userData.freeTickets + userData.earnedTickets;
if (totalTickets < tarotState.ticketCost) {
        showTicketShortageModal();
        return;
    }
    
const confirmed = await showCustomConfirm(`🍀 ${tarotState.ticketCost}枚使用しますか？`, '🎤', '録音', 'やめる');
    if (!confirmed) {
        return;
    }
    
    // チケット消費
    for (let i = 0; i < tarotState.ticketCost; i++) {
        if (userData.freeTickets > 0) {
            userData.freeTickets--;
        } else if (userData.earnedTickets > 0) {
            userData.earnedTickets--;
        }
    }
    tarotState.ticketUsed = true;
    await saveUserData();
    updateUI();
    
    // 録音モーダル表示
    showTarotVoiceRecordingModal();
}

// タロット声録音モーダル
function showTarotVoiceRecordingModal() {
    const modal = document.createElement('div');
    modal.id = 'tarotVoiceModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a4e 30%, #2d1b69 50%, #1a1a4e 70%, #0f0f23 100%); padding: 30px; border-radius: 25px; max-width: 400px; width: 100%; box-shadow: 0 15px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255, 105, 180, 0.5), 0 0 60px rgba(255, 105, 180, 0.3); border: 3px solid #FFB6C1; text-align: center;">
            <h2 style="font-size: 1.3em; margin-bottom: 15px; color: white;">🎤 質問を話してください</h2>
            <div style="font-size: 4em; margin: 20px 0; color: #ff6b6b; font-weight: bold;" id="tarotVoiceCountdown">10</div>
            <div style="height: 20px; background: rgba(255,255,255,0.2); border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
                <div id="tarotVoiceLevel" style="height: 100%; width: 0%; background: linear-gradient(90deg, #4ade80, #22c55e); border-radius: 10px; transition: width 0.1s;"></div>
            </div>
            <button onclick="stopTarotVoiceRecording()" style="background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; padding: 15px 40px; border-radius: 25px; font-size: 1.1em; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);">
                ✅ 録音終了
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 録音開始
    startTarotVoiceRecording();
}

// タロット声録音開始
async function startTarotVoiceRecording() {
    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(recordingStream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        mediaRecorder = new MediaRecorder(recordingStream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            resumeBGM(); // ← 追加
            recordingStream.getTracks().forEach(track => track.stop());
            document.getElementById('tarotVoiceModal')?.remove();
            
            // 録音完了 → カード選択へ
            tarotState.category = '声で質問';
            document.getElementById('tarotStep2').style.display = 'none';
            document.getElementById('tarotStep3').style.display = 'block';
            document.getElementById('cardCount').textContent = tarotState.spread;
            document.getElementById('maxCards').textContent = tarotState.spread;
            document.getElementById('selectedCount').textContent = '0';
            renderTarotCards();
        };
        
        mediaRecorder.start();
        isRecording = true;
        stopBGM();
        
        // 音量可視化
        visualizeTarotVoice();
        
        // カウントダウン
        let count = 10;
        const countdownEl = document.getElementById('tarotVoiceCountdown');
        
        tarotVoiceInterval = setInterval(() => {
            count--;
            if (countdownEl) countdownEl.textContent = count;
            
            if (count <= 0) {
                stopTarotVoiceRecording();
            }
        }, 1000);
        
    } catch (error) {
        console.error('マイクエラー:', error);
        document.getElementById('tarotVoiceModal')?.remove();
await showCustomAlert('マイクへのアクセスが必要です', '🎤');
    }
}

// タロット声録音の音量可視化
function visualizeTarotVoice() {
    if (!isRecording || !analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
    }
    const average = sum / bufferLength;
    const percentage = Math.min(100, (average / 128) * 100);
    
    const levelEl = document.getElementById('tarotVoiceLevel');
    if (levelEl) levelEl.style.width = percentage + '%';
    
    if (isRecording) {
        requestAnimationFrame(visualizeTarotVoice);
    }
}

// タロット声録音停止
function stopTarotVoiceRecording() {
    if (tarotVoiceInterval) {
        clearInterval(tarotVoiceInterval);
        tarotVoiceInterval = null;
    }
    
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
    }
}
// ========================================
// 相性占い
// ========================================

let compatState = {
    ticketUsed: false
};

// 星座計算
function getZodiacSign(birthday) {
    if (!birthday) return '';
    
    const date = new Date(birthday);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '牡羊座';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '牡牛座';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return '双子座';
    if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return '蟹座';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '獅子座';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '乙女座';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return '天秤座';
    if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return '蠍座';
    if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return '射手座';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '山羊座';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '水瓶座';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return '魚座';
    
    return '';
}

// 干支計算
function getEtoSign(birthday) {
    if (!birthday) return '';
    const year = new Date(birthday).getFullYear();
    const etoEmoji = ['🐭', '🐮', '🐯', '🐰', '🐲', '🐍', '🐴', '🐏', '🐵', '🐔', '🐶', '🐗'];
    const index = (year - 4) % 12;
    return etoEmoji[index];
}

// 星座を表示（旧互換）
function showZodiac(personNum) {
    showZodiacAndEto(personNum);
}

// 星座＆干支を表示
function showZodiacAndEto(personNum) {
    const birthday = document.getElementById(`compat${personNum}Birthday`).value;
    const zodiacDisplay = document.getElementById(`compat${personNum}Zodiac`);
    const etoDisplay = document.getElementById(`compat${personNum}Eto`);
    
    if (birthday) {
        // 星座
        const zodiac = getZodiacSign(birthday);
        const zodiacEmoji = {
            '牡羊座': '♈', '牡牛座': '♉', '双子座': '♊', '蟹座': '♋',
            '獅子座': '♌', '乙女座': '♍', '天秤座': '♎', '蠍座': '♏',
            '射手座': '♐', '山羊座': '♑', '水瓶座': '♒', '魚座': '♓'
        };
        zodiacDisplay.textContent = `${zodiacEmoji[zodiac] || '🍀'} ${zodiac}`;
        
        // 干支
        if (etoDisplay) {
            etoDisplay.textContent = getEtoSign(birthday);
        }
    } else {
        zodiacDisplay.textContent = '';
        if (etoDisplay) etoDisplay.textContent = '';
    }
}



// 相性占い用の録音データ
let compatVoice1 = null;
let compatVoice2 = null;

// 相性占い用録音
async function recordCompatVoice(personNum) {
    // プレミアム会員の場合
    if (isPremiumActive()) {
        if (!canUsePremiumToday()) {
            await showCustomAlert('👑 本日の占い回数（20回）に達しました\n\n明日またお楽しみください！', '⚠️');
            return;
        }
        const remaining = getPremiumRemaining();
        const confirmed = await showCustomConfirm(`👑 プレミアム録音\n\n本日残り: ${remaining}回`, '🎤', '録音', 'やめる');
        if (!confirmed) return;
        
        userData.premiumDailyCount++;
        await saveUserData();
    } else {
        // 通常ユーザー
        const totalTickets = userData.freeTickets + userData.earnedTickets;
        if (totalTickets < 1) {
            showTicketShortageModal();
            return;
        }
        const confirmed = await showCustomConfirm('🍀 1枚消費します\n（録音後は戻れません）', '🎤', '録音', 'やめる');
        if (!confirmed) {
            return;
        }
        // クローバー消費
        if (userData.freeTickets > 0) {
            userData.freeTickets--;
        } else if (userData.earnedTickets > 0) {
            userData.earnedTickets--;
        }
        await saveUserData();
        updateUI();
    }
    
    const btn = document.getElementById(`compat${personNum}VoiceBtn`);
    const status = document.getElementById(`compat${personNum}VoiceStatus`);
    
    btn.disabled = true;
    btn.textContent = '🔴 録音中... 3秒';
    status.textContent = '';
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        
        stopBGM(); // ← 追加
        
        recorder.ondataavailable = (e) => {
            chunks.push(e.data);
        };
        
        recorder.onstop = () => {
            resumeBGM(); // ← 追加
            stream.getTracks().forEach(track => track.stop());
            const blob = new Blob(chunks, { type: 'audio/webm' });
            
            if (personNum === 1) {
                compatVoice1 = blob;
            } else {
                compatVoice2 = blob;
            }
            
            btn.textContent = '✅ 録音完了';
            btn.classList.add('recorded');
            status.textContent = '録音しました！';
            btn.disabled = true;
            
            // 録音したら戻るボタンを非表示
            hideCompatBackBtns();
        };
        
        recorder.start();
        
        // カウントダウン
        let count = 3;
        const countdown = setInterval(() => {
            count--;
            if (count > 0) {
                btn.textContent = `🔴 録音中... ${count}秒`;
            } else {
                clearInterval(countdown);
                recorder.stop();
            }
        }, 1000);
        
    } catch (error) {
        console.error('マイクエラー:', error);
        btn.disabled = false;
        btn.textContent = '🎤 録音する';
await showCustomAlert('マイクへのアクセスが必要です', '🎤');
    }
}

// リセット
function resetCompatibility() {
    compatState.ticketUsed = false;
    compatVoice1 = null;
    compatVoice2 = null;
    
    // 録音ボタンリセット
    const btn1 = document.getElementById('compat1VoiceBtn');
    const btn2 = document.getElementById('compat2VoiceBtn');
    if (btn1) {
        btn1.textContent = '🎤 録音する';
        btn1.classList.remove('recorded');
        btn1.disabled = false;
    }
    if (btn2) {
        btn2.textContent = '🎤 録音する';
        btn2.classList.remove('recorded');
        btn2.disabled = false;
    }
    document.getElementById('compat1VoiceStatus').textContent = '';
    document.getElementById('compat2VoiceStatus').textContent = '';
    
    // 戻るボタンも表示に戻す
    const backBtn1 = document.querySelector('#compatStep1 .compat-back-btn');
    const backBtn2 = document.getElementById('compatStep2BackBtn');
    if (backBtn1) backBtn1.style.display = 'block';
    if (backBtn2) backBtn2.style.display = 'block';
    
    document.getElementById('compatStep1').style.display = 'block';
    document.getElementById('compatStep2').style.display = 'none';
    document.getElementById('compatLoading').style.display = 'none';
    document.getElementById('compatResult').style.display = 'none';
    
    // フォームクリア
    document.getElementById('compat1Name').value = '';
    document.getElementById('compat1Birthday').value = '';
    document.getElementById('compat1Blood').value = '';
    document.getElementById('compat2Name').value = '';
    document.getElementById('compat2Birthday').value = '';
    document.getElementById('compat2Blood').value = '';
}

// Step2へ
async function goToCompatStep2() {
    const name1 = document.getElementById('compat1Name').value.trim();
    const birthday1 = document.getElementById('compat1Birthday').value;
    const blood1 = document.getElementById('compat1Blood').value;
    const gender1 = document.getElementById('compat1Gender').value;
    
    if (!name1) {
await showCustomAlert('名前を入力してください', '✏️');
        return;
    }
    
    // 名前以外に最低1つ必要
    if (!birthday1 && !blood1 && !gender1 && !compatVoice1) {
await showCustomAlert('生年月日・血液型・性別・音声のうち\n最低1つ入力してください', '📝');
        return;
    }
    
    document.getElementById('compatStep1').style.display = 'none';
    document.getElementById('compatStep2').style.display = 'block';
}

// 相性占い開始
async function startCompatibilityFortune() {
    const name1 = document.getElementById('compat1Name').value.trim();
    const name2 = document.getElementById('compat2Name').value.trim();
    const birthday2 = document.getElementById('compat2Birthday').value;
    const blood2 = document.getElementById('compat2Blood').value;
    const gender2 = document.getElementById('compat2Gender').value;
    
    if (!name2) {
await showCustomAlert('名前を入力してください', '✏️');
        return;
    }
    
    // 名前以外に最低1つ必要
    if (!birthday2 && !blood2 && !gender2 && !compatVoice2) {
await showCustomAlert('生年月日・血液型・性別・音声のうち\n最低1つ入力してください', '📝');
        return;
    }
    
 // クローバー確認（録音していない場合のみ）
    if (!compatVoice1 && !compatVoice2) {
        // プレミアム会員の場合
        if (isPremiumActive()) {
            if (!canUsePremiumToday()) {
                await showCustomAlert('👑 本日の占い回数（20回）に達しました\n\n明日またお楽しみください！', '⚠️');
                return;
            }
            const remaining = getPremiumRemaining();
            const confirmed = await showCustomConfirm(`👑 プレミアム占い\n\n本日残り: ${remaining}回`, '💕', '占う！', 'やめる');
            if (!confirmed) return;
            
            userData.premiumDailyCount++;
            compatState.ticketUsed = true;
            await saveUserData();
        } else {
            // 通常ユーザー
            const totalTickets = userData.freeTickets + userData.earnedTickets;
            if (totalTickets < 1) {
                showTicketShortageModal();
                return;
            }
            
            const confirmed = await showCustomConfirm('🍀 1枚使用しますか？', '💕', '占う！', 'やめる');
            if (!confirmed) {
                return;
            }
            
            // クローバー消費（☘️無料 → 🍀獲得 の順）
            if (userData.freeTickets > 0) {
                userData.freeTickets--;
            } else if (userData.earnedTickets > 0) {
                userData.earnedTickets--;
            }
            compatState.ticketUsed = true;
            await saveUserData();
            updateUI();
        }
    }
    
// ローディング表示
    document.getElementById('compatStep2').style.display = 'none';
    showGlobalLoading([
        '相性を占っています...',
        'お二人の運命を読み取っています...',
        '星々の導きを感じています...',
        '答えが見えてきました...'
    ]);
    
    const birthday1 = document.getElementById('compat1Birthday').value;
    const blood1 = document.getElementById('compat1Blood').value;
    const gender1 = document.getElementById('compat1Gender').value;
    const relation = document.getElementById('compatRelation').value;
    
 // 星座・干支計算
    const zodiac1 = getZodiacSign(birthday1);
    const zodiac2 = getZodiacSign(birthday2);
    const eto1 = getEtoSign(birthday1);
    const eto2 = getEtoSign(birthday2);
    
    const character = characterTemplates[userData.selectedCharacter] || characterTemplates.devilMale;
    
    try {
        const response = await fetch('https://voifor-server.onrender.com/compatibility-fortune', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                person1: { name: name1, birthday: birthday1, blood: blood1, gender: gender1, zodiac: zodiac1, eto: eto1 },
                person2: { name: name2, birthday: birthday2, blood: blood2, gender: gender2, zodiac: zodiac2, eto: eto2 },
                relation: relation,
                characterName: character.defaultName,
                characterPersonality: character.speech
            })
        });
        
        if (!response.ok) {
            throw new Error('サーバーエラー');
        }
        
        const data = await response.json();
        
        userData.totalReadings++;
        await saveUserData();
        updateUI();
        
        // 履歴保存
        const today = new Date().toISOString().split('T')[0];
        saveFortuneHistory(today + '_compat_' + Date.now(), data.fortune, `💕 ${name1} & ${name2}`, 'compatibility');
        
        showCompatResult(data.score || Math.floor(Math.random() * 40) + 60, data.fortune);
        
    } catch (error) {
        console.error('相性占いエラー:', error);
        const randomScore = Math.floor(Math.random() * 40) + 60;
        showCompatResult(randomScore, `${name1}さんと${name2}さんの相性を占いました。\n\n二人の間には特別な縁があるようです。お互いを理解し合うことで、より良い関係を築けるでしょう。`);
    }
}

// 結果表示
function showCompatResult(score, fortune) {
    hideGlobalLoading();
    document.getElementById('compatResult').style.display = 'block';
    
    document.getElementById('compatScore').textContent = score;
    document.getElementById('compatFortuneText').textContent = fortune;
}

// もう一度占う
function retryCompatibility() {
    resetCompatibility();
}

// Step1の戻る
async function confirmCompatStep1Back() {
    if (compatVoice1) {
     const confirmed = await showCustomConfirm('戻りますか？\n（クローバーは戻りません）', '⚠️', '戻る', 'やめる');
        if (confirmed) {
            goBack();
        }
    } else {
        goBack();
    }
}

// Step2の戻る
function confirmCompatStep2Back() {
    document.getElementById('compatStep2').style.display = 'none';
    document.getElementById('compatStep1').style.display = 'block';
}

// Step1の戻るボタンだけ非表示（録音したらStep1からは戻れない）
function hideCompatBackBtns() {
    const btn1 = document.querySelector('#compatStep1 .compat-back-btn');
    if (btn1) btn1.style.display = 'none';
}
console.log('📱 app.js 読み込み完了');

// ========================================
// 夢占い
// ========================================

let dreamState = {
    type: 'simple', // simple or detailed
    inputMethod: '',
    content: '',
    ticketCost: 1,
    ticketUsed: false
};

let dreamVoiceBlob = null;

// 占い方法選択
function selectDreamType(type) {
    dreamState.type = type;
    dreamState.ticketCost = type === 'simple' ? 1 : 2;
    
    document.getElementById('dreamStep1').style.display = 'none';
    document.getElementById('dreamStep2').style.display = 'block';
}

// 入力方法選択
function selectDreamInput(method) {
    dreamState.inputMethod = method;
    
    // ボタンの選択状態
    document.querySelectorAll('#dreamStep2 .category-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    if (method === 'text') {
        document.getElementById('dreamTextInput').style.display = 'block';
        document.getElementById('dreamVoiceInput').style.display = 'none';
    } else {
        document.getElementById('dreamTextInput').style.display = 'none';
        document.getElementById('dreamVoiceInput').style.display = 'block';
    }
}

// 夢占い録音用
let dreamRecorder = null;
let dreamCountdown = null;
let dreamRecordDone = false;

// 音声録音
async function recordDreamVoice() {
    // 録音完了後にボタン押した場合 → 再録音確認
    if (dreamVoiceBlob && !dreamRecordDone) {
        const retry = await showCustomConfirm('1度だけ再録音できます。\nしますか？', '🎤', 'はい', 'いいえ');
        if (retry) {
            const start = await showCustomConfirm('再録音します', '🎤', '再録音', '戻る');
            if (start) {
                dreamRecordDone = true;
                startDreamRecording();
            }
        }
        return;
    }
    
// 再録音済みなら何もしない
    if (dreamRecordDone && dreamVoiceBlob) {
        return;
    }
    
    // プレミアム会員の場合
    if (isPremiumActive()) {
        if (!canUsePremiumToday()) {
            await showCustomAlert('👑 本日の占い回数（20回）に達しました\n\n明日またお楽しみください！', '⚠️');
            return;
        }
        const remaining = getPremiumRemaining();
        const confirmed = await showCustomConfirm(`👑 プレミアム録音\n\n本日残り: ${remaining}回`, '🎤', '録音', 'やめる');
        if (!confirmed) return;
        
        userData.premiumDailyCount++;
        dreamState.ticketUsed = true;
        await saveUserData();
        
        startDreamRecording();
        return;
    }
    
    // 通常ユーザー：クローバー確認
    const totalTickets = userData.freeTickets + userData.earnedTickets;
    if (totalTickets < dreamState.ticketCost) {
        showTicketShortageModal();
        return;
    }
    
    const confirmed = await showCustomConfirm(`🍀 ${dreamState.ticketCost}枚使用しますか？`, '🎤', '録音', 'やめる');
    if (!confirmed) {
        return;
    }
    
    // クローバー消費
    for (let i = 0; i < dreamState.ticketCost; i++) {
        if (userData.freeTickets > 0) {
            userData.freeTickets--;
        } else if (userData.earnedTickets > 0) {
            userData.earnedTickets--;
        }
    }
    dreamState.ticketUsed = true;
    await saveUserData();
    updateUI();
    
    startDreamRecording();
}

// 実際の録音処理
async function startDreamRecording() {
    const btn = document.getElementById('dreamVoiceBtn');
    const stopBtn = document.getElementById('dreamVoiceStopBtn');
    const status = document.getElementById('dreamVoiceStatus');
    const backBtn = document.querySelector('#dreamVoiceInput .compat-back-btn');
    
    btn.style.display = 'none';
    stopBtn.style.display = 'block';
    status.textContent = '';
    if (backBtn) backBtn.style.display = 'none';
    document.getElementById('dreamVoiceNext').style.display = 'none';
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        dreamRecorder = new MediaRecorder(stream);
        const chunks = [];
        
        dreamRecorder.ondataavailable = (e) => chunks.push(e.data);
        
        dreamRecorder.onstop = () => {
            resumeBGM(); // ← 追加
            stream.getTracks().forEach(track => track.stop());
            dreamVoiceBlob = new Blob(chunks, { type: 'audio/webm' });
            
            btn.style.display = 'block';
            stopBtn.style.display = 'none';
            
            if (dreamRecordDone) {
                btn.textContent = '✅ 録音完了';
                btn.disabled = true;
            } else {
                btn.textContent = '✅ 録音完了（タップで再録音）';
                btn.disabled = false;
            }
            btn.classList.add('recorded');
            status.textContent = '録音しました！';
            
            document.getElementById('dreamVoiceNext').style.display = 'block';
        };
        
        dreamRecorder.start();
        stopBGM();
        
        let count = 15;
        stopBtn.textContent = `⏹️ 録音停止（${count}秒）`;
        
        dreamCountdown = setInterval(() => {
            count--;
            if (count > 0) {
                stopBtn.textContent = `⏹️ 録音停止（${count}秒）`;
            } else {
                clearInterval(dreamCountdown);
                dreamCountdown = null;
                if (dreamRecorder && dreamRecorder.state === 'recording') {
                    dreamRecorder.stop();
                }
            }
        }, 1000);
        
    } catch (error) {
        console.error('マイクエラー:', error);
        btn.style.display = 'block';
        btn.disabled = false;
        btn.textContent = '🎤 録音する';
        stopBtn.style.display = 'none';
        if (backBtn) backBtn.style.display = 'block';
        
        // 初回エラー時のみクローバー返却
        if (!dreamRecordDone && dreamState.ticketUsed) {
            for (let i = 0; i < dreamState.ticketCost; i++) {
                userData.freeTickets++;
            }
            dreamState.ticketUsed = false;
            await saveUserData();
            updateUI();
        }
        await showCustomAlert('マイクへのアクセスが必要です', '🎤');
    }
}

// 夢占い録音停止
function stopDreamVoice() {
    if (dreamCountdown) {
        clearInterval(dreamCountdown);
        dreamCountdown = null;
    }
    if (dreamRecorder && dreamRecorder.state === 'recording') {
        dreamRecorder.stop();
    }
}

// 夢の内容を送信して次へ
async function submitDreamContent() {
    if (dreamState.inputMethod === 'text') {
        const text = document.getElementById('dreamText').value.trim();
        if (!text) {
await showCustomAlert('夢の内容を入力してください', '✏️');
            return;
        }
        dreamState.content = text;
    } else {
        if (!dreamVoiceBlob) {
await showCustomAlert('夢の内容を録音してください', '🎤');
            return;
        }
        dreamState.content = '[音声入力]';
    }
    
    if (dreamState.type === 'simple') {
        // シンプルはそのまま占う
        submitDreamFortune();
    } else {
        // 詳しくは詳細入力へ
        document.getElementById('dreamStep2').style.display = 'none';
        document.getElementById('dreamStep3').style.display = 'block';
    }
}

// 夢占い実行
async function submitDreamFortune() {
    // 音声で既にクローバー消費済みの場合はスキップ
    if (!dreamState.ticketUsed) {
        // プレミアム会員の場合
        if (isPremiumActive()) {
            if (!canUsePremiumToday()) {
                await showCustomAlert('👑 本日の占い回数（20回）に達しました\n\n明日またお楽しみください！', '⚠️');
                return;
            }
            const remaining = getPremiumRemaining();
            const confirmed = await showCustomConfirm(`👑 プレミアム占い\n\n本日残り: ${remaining}回`, '🌙', '占う！', 'やめる');
            if (!confirmed) return;
            
            userData.premiumDailyCount++;
            dreamState.ticketUsed = true;
            await saveUserData();
        } else {
            // 通常ユーザー：クローバー確認
            const confirmed = await showCustomConfirm(`🍀 ${dreamState.ticketCost}枚使用しますか？`, '🌙', '占う！', 'やめる');
            if (!confirmed) {
                return;
            }
            
            // クローバーチェック
            const totalTickets = userData.freeTickets + userData.earnedTickets;
            if (totalTickets < dreamState.ticketCost) {
                showTicketShortageModal();
                return;
            }
            
            // クローバー消費
            for (let i = 0; i < dreamState.ticketCost; i++) {
                if (userData.freeTickets > 0) {
                    userData.freeTickets--;
                } else if (userData.earnedTickets > 0) {
                    userData.earnedTickets--;
                }
            }
            await saveUserData();
            updateUI();
            dreamState.ticketUsed = true;
        }
    }
    
    // ローディング表示
    document.getElementById('dreamStep1').style.display = 'none';
    document.getElementById('dreamStep2').style.display = 'none';
    document.getElementById('dreamStep3').style.display = 'none';
showGlobalLoading([
        '夢を解析しています...',
        '深層心理を読み取っています...',
        '星々の導きを感じています...',
        '答えが見えてきました...'
    ]);
    
    try {
        const character = characterTemplates[userData.selectedCharacter] || characterTemplates.devilMale;
        
        // 詳細情報を収集
        let details = {};
        if (dreamState.type === 'detailed') {
            details = {
                when: document.getElementById('dreamWhen').value,
                emotion: document.getElementById('dreamEmotion').value,
                impression: document.getElementById('dreamImpression').value,
                color: document.getElementById('dreamColor').value,
                wakeup: document.getElementById('dreamWakeup').value
            };
        }
        
        const response = await fetch('https://voifor-server.onrender.com/dream-fortune', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                dreamContent: dreamState.content,
                type: dreamState.type,
                details: details,
                characterName: character.defaultName,
                characterPersonality: character.speech
            })
        });
        
        if (!response.ok) {
            throw new Error('API Error');
        }
        
        const data = await response.json();
        showDreamResult(data.fortune);
        
    } catch (error) {
        console.error('夢占いエラー:', error);
    await showCustomAlert('占いに失敗しました。\nクローバーは消費されていません。', '😢');
    userData.earnedTickets += dreamState.ticketCost;
        await saveUserData();
        updateUI();
        dreamState.ticketUsed = false;
        
hideGlobalLoading();
        document.getElementById('dreamStep1').style.display = 'block';
    }
}

// 結果表示
function showDreamResult(fortune) {
    hideGlobalLoading();
    document.getElementById('dreamResult').style.display = 'block';
    document.getElementById('dreamFortuneText').innerHTML = fortune.replace(/\n/g, '<br>');
    
    // 履歴に保存
    const today = new Date().toISOString().split('T')[0];
    saveFortuneHistory(today + '_dream_' + Date.now(), fortune, '🌙 夢占い', 'dream');
}

// もう一度占う
function retryDream() {
    resetDream();
}

// リセット
function resetDream() {
    dreamState = {
        type: 'simple',
        inputMethod: '',
        content: '',
        ticketCost: 1,
        ticketUsed: false
    };
    dreamVoiceBlob = null;
    dreamRecordDone = false;
    
    // フォームリセット
    const dreamText = document.getElementById('dreamText');
    if (dreamText) dreamText.value = '';
    
    const dreamWhen = document.getElementById('dreamWhen');
    if (dreamWhen) dreamWhen.value = '';
    
    const dreamEmotion = document.getElementById('dreamEmotion');
    if (dreamEmotion) dreamEmotion.value = '';
    
    const dreamImpression = document.getElementById('dreamImpression');
    if (dreamImpression) dreamImpression.value = '';
    
    const dreamColor = document.getElementById('dreamColor');
    if (dreamColor) dreamColor.value = '';
    
    const dreamWakeup = document.getElementById('dreamWakeup');
    if (dreamWakeup) dreamWakeup.value = '';
    
// 録音ボタンリセット
    const voiceBtn = document.getElementById('dreamVoiceBtn');
    if (voiceBtn) {
        voiceBtn.textContent = '🎤 録音する';
        voiceBtn.classList.remove('recorded');
        voiceBtn.disabled = false;
        voiceBtn.style.display = 'block';
    }
    
    const voiceStopBtn = document.getElementById('dreamVoiceStopBtn');
    if (voiceStopBtn) {
        voiceStopBtn.style.display = 'none';
    }
    
    const voiceStatus = document.getElementById('dreamVoiceStatus');
    if (voiceStatus) voiceStatus.textContent = '';
    
    const voiceNext = document.getElementById('dreamVoiceNext');
    if (voiceNext) voiceNext.style.display = 'none';
    
    // 画面リセット
    document.getElementById('dreamStep1').style.display = 'block';
    document.getElementById('dreamStep2').style.display = 'none';
    document.getElementById('dreamStep3').style.display = 'none';
    document.getElementById('dreamLoading').style.display = 'none';
    document.getElementById('dreamResult').style.display = 'none';
    document.getElementById('dreamTextInput').style.display = 'none';
    document.getElementById('dreamVoiceInput').style.display = 'none';
    
    // カテゴリボタンリセット
    document.querySelectorAll('#dreamStep2 .category-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

// 戻る確認
async function confirmDreamBack() {
    if (dreamState.ticketUsed) {
     const confirmed = await showCustomConfirm('戻りますか？\n（クローバーは戻りません）', '⚠️', '戻る', 'やめる');
        if (confirmed) {
            resetDream();
            goBack();
        }
    } else {
        const step1 = document.getElementById('dreamStep1');
        const step2 = document.getElementById('dreamStep2');
        const step3 = document.getElementById('dreamStep3');
        const result = document.getElementById('dreamResult');
        
        if (result.style.display !== 'none') {
            resetDream();
            goBack();
        } else if (step3.style.display !== 'none') {
            step3.style.display = 'none';
            step2.style.display = 'block';
        } else if (step2.style.display !== 'none') {
            step2.style.display = 'none';
            step1.style.display = 'block';
            document.getElementById('dreamTextInput').style.display = 'none';
            document.getElementById('dreamVoiceInput').style.display = 'none';
        } else {
            goBack();
        }
    }
}

// 夢占い画面表示
function showDreamScreen() {
    resetDream();
    showScreen('dreamScreen');
}
// Step1へ戻る
function backToDreamStep1() {
    document.getElementById('dreamStep2').style.display = 'none';
    document.getElementById('dreamStep1').style.display = 'block';
    document.getElementById('dreamTextInput').style.display = 'none';
    document.getElementById('dreamVoiceInput').style.display = 'none';
}

// Step2へ戻る
function backToDreamStep2() {
    document.getElementById('dreamStep3').style.display = 'none';
    document.getElementById('dreamStep2').style.display = 'block';
}
// ========================================
// クローバー確認モーダル
// ========================================

function showTicketConfirmModal(requiredTickets, fortuneType) {
    return new Promise((resolve) => {
     const totalTickets = userData.freeTickets + userData.earnedTickets;
    const ticketType = requiredTickets === 0 ? '🎁 無料' : (userData.freeTickets > 0 ? '☘️ 無料クローバー' : '🍀 獲得クローバー');
        
        const modal = document.createElement('div');
        modal.id = 'ticketConfirmModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        const message = requiredTickets === 0 
            ? `<strong style="color: #4CAF50;">1日1回無料</strong>で<br><strong>${fortuneType}</strong>をしますか？`
            : `<strong style="color: #FFD700;">${requiredTickets}${ticketType}</strong>を使用して<br><strong>${fortuneType}</strong>をしますか？`;
        
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(40, 40, 60, 0.95), rgba(30, 30, 50, 0.95)); padding: 35px; border-radius: 25px; max-width: 420px; width: 100%; backdrop-filter: blur(15px); box-shadow: 0 15px 50px rgba(0,0,0,0.5), 0 0 30px rgba(102, 126, 234, 0.6); text-align: center; border: 2px solid rgba(255,255,255,0.3);">
                <div style="font-size: 3em; margin-bottom: 15px;">🔮</div>
                <h2 style="margin: 0 0 20px 0; font-size: 1.5em; color: white;">${fortuneType}</h2>
                
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                    <div style="color: white; font-size: 1.1em; line-height: 1.6;">
                        ${message}
                    </div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.9em; margin-top: 15px;">
                        残り: <strong style="color: #FFD700;">${totalTickets}クローバー</strong>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button id="modalCancel" style="flex: 1; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.3); color: white; padding: 15px; border-radius: 12px; font-size: 1.1em; font-weight: bold; cursor: pointer;">
                        キャンセル
                    </button>
                    <button id="modalConfirm" style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; padding: 15px; border-radius: 12px; font-size: 1.1em; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);">
                        占う！
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('modalCancel').onclick = () => {
            modal.remove();
            resolve(false);
        };
        
        document.getElementById('modalConfirm').onclick = () => {
            modal.remove();
            resolve(true);
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        };
    });
}

// クローバー不足モーダル
function showTicketShortageModal() {
const totalTickets = userData.freeTickets + userData.earnedTickets;
    
    const modal = document.createElement('div');
    modal.id = 'ticketShortageModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(40, 40, 60, 0.98), rgba(30, 30, 50, 0.98)); padding: 35px; border-radius: 25px; max-width: 420px; width: 100%; backdrop-filter: blur(20px); box-shadow: 0 20px 60px rgba(0,0,0,0.7); text-align: center;">
            <div style="font-size: 3em; margin-bottom: 15px;">⚠️</div>
            <h2 style="margin: 0 0 20px 0; font-size: 1.5em; color: #ff6b6b;">クローバーが足りません</h2>
            
            <div style="background: rgba(255,107,107,0.15); padding: 20px; border-radius: 15px; margin-bottom: 25px; border: 2px solid rgba(255,107,107,0.3);">
                <p style="color: white; margin: 0;">
                    1日1回の無料占いは使用済みです<br>
                    現在のクローバー: <strong style="color: #FFD700;">${totalTickets}枚</strong>
                </p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="this.closest('#ticketShortageModal').remove(); showPurchaseScreen();" style="width: 100%; background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; padding: 18px; border-radius: 15px; font-size: 1.2em; font-weight: bold; cursor: pointer;">
                    💰 クローバーを購入
                </button>
                <button onclick="this.closest('#ticketShortageModal').remove(); watchAdForTicket();" style="width: 100%; background: rgba(255,255,255,0.12); border: 2px solid rgba(255,255,255,0.25); color: white; padding: 15px; border-radius: 12px; font-size: 1em; font-weight: bold; cursor: pointer;">
                    🎥 動画でクローバー獲得
                </button>
                <button onclick="this.closest('#ticketShortageModal').remove();" style="width: 100%; background: transparent; border: none; color: rgba(255,255,255,0.5); padding: 12px; font-size: 0.95em; cursor: pointer;">
                    キャンセル
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}
// 初回登録完了処理
async function completeRegistration() {
    const name = document.getElementById('regName').value.trim();
    const birth = document.getElementById('regBirth').value;
    const bloodType = document.getElementById('regBloodType').value;
    const gender = document.getElementById('regGender').value;
    const referralCode = document.getElementById('referralCodeInput').value.trim().toUpperCase();
    
if (!name) {
        await showCustomAlert('お名前を入力してください', '✏️');
        return;
    }
    
// ユーザーデータに保存
    userData.name = name;
    userData.birth = birth || '';
    userData.bloodType = bloodType || '';
    userData.gender = gender || '';
    userData.isRegistered = true;
    
    // 紹介コード処理
    if (referralCode) {
        await processReferralCode(referralCode);
    }
    
    await saveUserData();
    
    // 登録画面を隠してメイン画面へ
    document.getElementById('registrationScreen').classList.remove('active');
    document.getElementById('mainScreen').classList.add('active');
    
    updateUI();
}

// 初回判定（loadUserData内で呼ばれる）
function checkFirstTime() {
    if (!userData.isRegistered) {
        // 初回ユーザー
        document.getElementById('mainScreen').classList.remove('active');
        document.getElementById('registrationScreen').classList.add('active');
    }
}

// ========================================
// 法的情報
// ========================================

function showLegalScreen() {
    showScreen('legalScreen');
}

function showLegalModal(type) {
    let title = '';
    let content = '';
    
    if (type === 'terms') {
      title = '利用規約';
        content = `
<p>この利用規約（以下「本規約」）は、VOIFOR運営事務局（以下「当事務局」）が提供する「VOIFOR -声占い-」（以下「本アプリ」）の利用条件を定めるものです。</p>

<h4>第1条（適用）</h4>
<p>本規約は、ユーザーと当事務局との間の本アプリの利用に関わる一切の関係に適用されます。</p>

<h4>第2条（占いサービスについて）</h4>
<p>本アプリで提供する占いは娯楽を目的としたものであり、その結果について当事務局は一切の責任を負いません。人生の重要な判断は、ご自身の責任において行ってください。</p>

<h4>第3条（クローバー）</h4>
<p>1. クローバーは本アプリ内で占いを利用するためのポイントです。<br>
2. 購入したクローバーの返金・換金はできません。<br>
3. クローバーは他のユーザーへ譲渡できません。<br>
4. サービス終了時、未使用クローバーの返金は行いません。</p>

<h4>第4条（禁止事項）</h4>
<p>ユーザーは以下の行為をしてはなりません。<br>
・法令または公序良俗に違反する行為<br>
・不正アクセス、システムへの攻撃<br>
・他のユーザーへの迷惑行為<br>
・本アプリの運営を妨害する行為<br>
・その他、当事務局が不適切と判断する行為</p>

<h4>第5条（サービスの変更・停止）</h4>
<p>当事務局は、事前の通知なくサービス内容の変更、または提供の停止をすることができます。</p>

<h4>第6条（免責事項）</h4>
<p>1. 当事務局は、本アプリの内容の正確性・完全性を保証しません。<br>
2. ユーザーが本アプリを利用したことによる損害について、当事務局は責任を負いません。<br>
3. 占い結果に基づく判断・行動は、すべてユーザー自身の責任となります。</p>

<h4>第7条（知的財産権）</h4>
<p>本アプリに関する著作権その他の知的財産権は、当事務局または正当な権利者に帰属します。</p>

<h4>第8条（規約の変更）</h4>
<p>当事務局は、必要に応じて本規約を変更できます。変更後の規約は、本アプリ内に表示した時点で効力を生じます。</p>

<h4>第9条（準拠法・管轄）</h4>
<p>本規約の解釈は日本法に準拠し、紛争が生じた場合は当事務局所在地を管轄する裁判所を専属的合意管轄とします。</p>

<p style="margin-top: 20px;"><strong>お問い合わせ:</strong> takeappstudio@gmail.com</p>
<p><strong>制定日:</strong> 2024年12月11日</p>
        `;
    } else if (type === 'privacy') {
        title = 'プライバシーポリシー';
        content = `
<p>VOIFOR運営事務局（以下「当事務局」）は、本アプリ「VOIFOR -声占い-」（以下「本アプリ」）における個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。</p>

<h4>収集する情報</h4>
<p>・ニックネーム、生年月日、血液型<br>
・音声データ（占い実行時のみ使用）<br>
・占い履歴<br>
・決済情報（Stripe社を通じて処理）</p>

<h4>利用目的</h4>
<p>・占いサービスの提供<br>
・サービスの改善・開発<br>
・お問い合わせへの対応</p>

<h4>音声データの取り扱い</h4>
<p>音声データは占い結果の生成にのみ使用し、生成完了後はサーバーに保存しません。</p>

<h4>第三者提供</h4>
<p>以下の場合を除き、個人情報を第三者に提供しません。<br>
・ご本人の同意がある場合<br>
・法令に基づく場合<br>
・決済処理に必要な場合（Stripe社）</p>

<h4>外部サービス</h4>
<p>本アプリは以下の外部サービスを利用しています。<br>
・Supabase（データ保存）<br>
・Stripe（決済処理）<br>
・Anthropic Claude API（AI占い生成）</p>

<h4>セキュリティ</h4>
<p>個人情報の漏洩防止のため、適切なセキュリティ対策を実施しています。</p>

<h4>改定</h4>
<p>本ポリシーは予告なく変更する場合があります。</p>

<p style="margin-top: 20px;"><strong>お問い合わせ:</strong> takeappstudio@gmail.com</p>
<p><strong>制定日:</strong> 2024年12月11日</p>
        `;
    } else if (type === 'tokushoho') {
        title = '特定商取引法に基づく表記';
        content = `
<h4>販売業者</h4>
<p>VOIFOR運営事務局</p>

<h4>運営責任者</h4>
<p>請求があった場合、遅滞なく開示いたします</p>

<h4>所在地</h4>
<p>請求があった場合、遅滞なく開示いたします</p>

<h4>連絡先</h4>
<p>メール: takeappstudio@gmail.com<br>
※お問い合わせはメールにてお願いいたします<br>
電話番号: 請求があった場合、遅滞なく開示いたします</p>

<h4>販売価格</h4>
<p>アプリ内に表示された価格（税込）</p>

<h4>支払方法</h4>
<p>クレジットカード決済（Stripe）</p>

<h4>商品引渡し時期</h4>
<p>決済完了後、即時</p>

<h4>返品・キャンセルについて</h4>
<p>デジタルコンテンツの性質上、購入後の返金・キャンセルはお受けできません。<br>
ただし、システム障害等によりサービスが正常に提供されなかった場合は、個別に対応いたしますのでメールにてご連絡ください。</p>

<h4>動作環境</h4>
<p>iOS/Android対応のモダンブラウザ</p>
        `;
    }
    
    const modal = document.createElement('div');
    modal.id = 'legalModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; justify-content: center; align-items: flex-start; padding: 20px; overflow-y: auto;';
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e, #2d1b69); padding: 30px; border-radius: 20px; max-width: 500px; width: 100%; margin: 20px 0; border: 2px solid rgba(255,255,255,0.2);">
            <h2 style="margin: 0 0 20px 0; font-size: 1.4em; color: white; text-align: center;">${title}</h2>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.9em; line-height: 1.8;">
                ${content}
            </div>
            <button onclick="closeLegalModal()" style="width: 100%; margin-top: 25px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; padding: 15px; border-radius: 12px; font-size: 1.1em; font-weight: bold; cursor: pointer;">
                閉じる
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeLegalModal() {
    const modal = document.getElementById('legalModal');
    if (modal) modal.remove();
}
// ========================================
// スプラッシュ画面
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const splashScreen = document.getElementById('splashScreen');
    
    if (splashScreen) {
        // 2秒後にフェードアウト
        setTimeout(() => {
            splashScreen.style.opacity = '0';
            splashScreen.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 500);
        }, 2000);
    }
});

// ========================================
// 魂の暴露占い
// ========================================

// 質問データ
const soulQuestions = [
    // 🧒 ルーツ・過去（4問）
    { category: '🧒 ルーツ・過去', q: '親との関係はどうだった？', deep: 'それが今の自分にどう影響してると思う？', skip: false },
    { category: '🧒 ルーツ・過去', q: '子供の頃、一番辛かった記憶は？', deep: 'その経験から何を学んだ？', skip: true },
    { category: '🧒 ルーツ・過去', q: '親や先生に言われて今も残ってる言葉は？', deep: 'その言葉を今も信じてる？', skip: true },
    { category: '🧒 ルーツ・過去', q: '子供の頃の夢は何だった？', deep: '今はどうなってる？諦めたならなぜ？まだ追ってるなら何が足りない？', skip: true },
    
    // 🧠 自己認識（4問）
    { category: '🧠 自己認識', q: '自分のことをどう思ってる？', deep: 'それはいつからそう思ってる？', skip: false },
    { category: '🧠 自己認識', q: '自分の一番嫌いなところは？', deep: 'それで困った経験は？', skip: false },
    { category: '🧠 自己認識', q: '自分の好きなところは？', deep: 'それを周りは認めてくれてる？', skip: true },
    { category: '🧠 自己認識', q: '"本当の自分"と"見せてる自分"の違いは？', deep: 'なぜ本当の自分を隠してる？', skip: true },
    
    // 💔 傷・闇（4問）
    { category: '💔 傷・闇', q: '人生で一番傷ついた経験は？', deep: 'その傷は癒えた？まだ痛む？', skip: true },
    { category: '💔 傷・闇', q: '許せない人はいる？', deep: '許したら自分はどうなると思う？', skip: true },
    { category: '💔 傷・闇', q: '誰にも言えない秘密や本音は？', deep: 'それを言えたら楽になる？', skip: true },
    { category: '💔 傷・闘', q: '自分を責めてしまうことはある？', deep: '何に対して自分を責めてる？', skip: true },
    
    // 👥 人間関係（4問）
    { category: '👥 人間関係', q: '人間関係で繰り返す失敗パターンは？', deep: 'それは自分のせい？相手のせい？', skip: true },
    { category: '👥 人間関係', q: '本当に信頼できる人は何人いる？', deep: 'もっと増やしたい？今ので十分？', skip: false },
    { category: '👥 人間関係', q: '人に嫌われるのが怖い？', deep: '嫌われないために何を我慢してる？', skip: false },
    { category: '👥 人間関係', q: '人に甘えることはできる？', deep: '甘えられないなら、なぜ？', skip: true },
    
    // 💼 仕事・お金（3問）
    { category: '💼 仕事・お金', q: '今の仕事や収入に満足してる？', deep: '不満なら、なぜ変えようとしない？満足してるならそのままでOK！', skip: true },
    { category: '💼 仕事・お金', q: 'お金に対してどんなイメージがある？', deep: 'それは誰から学んだ考え？', skip: false },
    { category: '💼 仕事・お金', q: '成功することに恐れはある？', deep: '成功したら何を失うと思う？', skip: true },
    
    // 🔄 パターン・習慣（3問）
    { category: '🔄 パターン・習慣', q: '"また同じことしてる"と思うことは？', deep: '分かってるのになぜ繰り返す？', skip: true },
    { category: '🔄 パターン・習慣', q: 'いつも途中で諦めてしまうことは？', deep: '諦める時、自分に何て言い訳してる？', skip: true },
    { category: '🔄 パターン・習慣', q: 'ストレスが溜まると何をする？', deep: 'それは逃げ？発散？', skip: false },
    
    // ✨ 強み・喜び（5問）
    { category: '✨ 強み・喜び', q: '人生で一番嬉しかった経験は？', deep: 'その時の自分は何が良かった？', skip: false },
    { category: '✨ 強み・喜び', q: '自分の強みは何だと思う？', deep: 'それを活かせてる？', skip: false },
    { category: '✨ 強み・喜び', q: '誇りに思っていることは？', deep: 'それを周りは知ってる？', skip: true },
    { category: '✨ 強み・喜び', q: '感謝している人は誰？', deep: 'ちゃんと伝えてる？', skip: false },
    { category: '✨ 強み・喜び', q: '幸せを感じる瞬間は？', deep: '最近それを感じた？', skip: false },
    
    // 🌟 願望・恐れ（3問）
    { category: '🌟 願望・恐れ', q: '本当はどんな自分になりたい？', deep: '今のままでいい？それとも何かが邪魔してる？', skip: false },
    { category: '🌟 願望・恐れ', q: '一番怖いことは何？', deep: 'それが現実になったらどうなる？', skip: false },
    { category: '🌟 願望・恐れ', q: '今の自分に点数をつけるなら何点？', deep: '120点の最高の自分になるには何が必要？', skip: false }
];

// 魂の暴露占い状態
let soulState = {
    currentIndex: 0,
    answers: [],
    deepAnswers: [],
    voiceData: null,
    isDeep: false
};

// 画面表示
function showSoulScreen() {
    resetSoul();
    showScreen('soulScreen');
}

// リセット
function resetSoul() {
    soulState = {
        currentIndex: 0,
        answers: [],
        deepAnswers: [],
        voiceData: null,
        isDeep: false
    };
    document.getElementById('soulStep1').style.display = 'block';
    document.getElementById('soulStep2').style.display = 'none';
    document.getElementById('soulStep3').style.display = 'none';
    document.getElementById('soulStep4').style.display = 'none';
    document.getElementById('soulLoading').style.display = 'none';
    document.getElementById('soulResult').style.display = 'none';
}

// 質問開始
function startSoulQuestions() {
    // チケット確認
    const totalTickets = userData.freeTickets + userData.earnedTickets + userData.paidTickets;
    if (totalTickets < 3) {
        showTicketShortageModal(3, totalTickets);
        return;
    }
    
    document.getElementById('soulStep1').style.display = 'none';
    document.getElementById('soulStep2').style.display = 'block';
    document.getElementById('soulQuestionTotal').textContent = soulQuestions.length;
    showSoulQuestion();
}

// 質問表示
function showSoulQuestion() {
    const q = soulQuestions[soulState.currentIndex];
    document.getElementById('soulQuestionNum').textContent = soulState.currentIndex + 1;
    document.getElementById('soulCategory').textContent = q.category;
    document.getElementById('soulQuestion').textContent = q.q;
    document.getElementById('soulAnswer').value = soulState.answers[soulState.currentIndex] || '';
    
    // 戻るボタン（最初の質問では非表示）
    document.getElementById('soulBackBtn').style.display = soulState.currentIndex === 0 ? 'none' : 'block';
    
    // スキップボタン
    document.getElementById('soulSkipBtn').style.display = q.skip ? 'block' : 'none';
}

// 次の質問へ
function nextSoulQuestion() {
    const answer = document.getElementById('soulAnswer').value.trim();
    
    if (!answer && !soulQuestions[soulState.currentIndex].skip) {
        showCustomAlert('この質問は回答が必要です');
        return;
    }
    
    // 回答を保存
    soulState.answers[soulState.currentIndex] = answer;
    
    // 深掘りへ
    if (answer) {
        showSoulDeep();
    } else {
        // スキップの場合は深掘りもスキップ
        soulState.deepAnswers[soulState.currentIndex] = '';
        goToNextSoulQuestion();
    }
}

// スキップ
function skipSoulQuestion() {
    soulState.answers[soulState.currentIndex] = '';
    soulState.deepAnswers[soulState.currentIndex] = '';
    goToNextSoulQuestion();
}

// 前の質問へ
function prevSoulQuestion() {
    if (soulState.currentIndex > 0) {
        soulState.currentIndex--;
        showSoulQuestion();
    }
}

// 深掘り表示
function showSoulDeep() {
    const q = soulQuestions[soulState.currentIndex];
    document.getElementById('soulStep2').style.display = 'none';
    document.getElementById('soulStep3').style.display = 'block';
    document.getElementById('soulDeepNum').textContent = soulState.currentIndex + 1;
    document.getElementById('soulDeepTotal').textContent = soulQuestions.length;
    document.getElementById('soulDeepQuestion').textContent = q.deep;
    document.getElementById('soulDeepAnswer').value = soulState.deepAnswers[soulState.currentIndex] || '';
}

// 深掘りから戻る
function backToSoulMain() {
    document.getElementById('soulStep3').style.display = 'none';
    document.getElementById('soulStep2').style.display = 'block';
}

// 深掘り送信
function submitSoulDeep() {
    const answer = document.getElementById('soulDeepAnswer').value.trim();
    soulState.deepAnswers[soulState.currentIndex] = answer;
    goToNextSoulQuestion();
}

// 次の質問へ進む
function goToNextSoulQuestion() {
    soulState.currentIndex++;
    
    if (soulState.currentIndex >= soulQuestions.length) {
        // 全質問完了 → 音声へ
        showSoulVoice();
    } else {
        document.getElementById('soulStep3').style.display = 'none';
        document.getElementById('soulStep2').style.display = 'block';
        showSoulQuestion();
    }
}

// 音声画面表示
function showSoulVoice() {
    document.getElementById('soulStep2').style.display = 'none';
    document.getElementById('soulStep3').style.display = 'none';
    document.getElementById('soulStep4').style.display = 'block';
    document.getElementById('soulVoiceStatus').textContent = '';
    document.getElementById('soulSubmitBtn').style.display = 'none';
}

// 音声画面から戻る
function backToSoulQuestions() {
    soulState.currentIndex = soulQuestions.length - 1;
    document.getElementById('soulStep4').style.display = 'none';
    document.getElementById('soulStep2').style.display = 'block';
    showSoulQuestion();
}

// 音声録音
async function recordSoulVoice() {
    const btn = document.getElementById('soulVoiceBtn');
    const status = document.getElementById('soulVoiceStatus');
    
    if (isRecording) {
        // 録音停止
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (e) => {
            audioChunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
            resumeBGM(); // ← 追加
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            soulState.voiceData = audioBlob;
            stream.getTracks().forEach(track => track.stop());
            
            btn.textContent = '🎤 録音し直す';
            btn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            status.textContent = '✅ 録音完了！';
            document.getElementById('soulSubmitBtn').style.display = 'block';
            isRecording = false;
        };
        
        mediaRecorder.start();
        isRecording = true;
        stopBGM(); 
        btn.textContent = '⏹️ 録音停止';
        btn.style.background = '#ff6b6b';
        status.textContent = '🔴 録音中...';
        
        // 最大30秒で自動停止
        setTimeout(() => {
            if (isRecording && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        }, 30000);
        
    } catch (err) {
        console.error('マイクエラー:', err);
        showCustomAlert('マイクへのアクセスを許可してください');
    }
}

// 鑑定実行
async function submitSoulFortune() {
    // プレミアム会員の場合
    if (isPremiumActive()) {
        if (!canUsePremiumToday()) {
            await showCustomAlert('👑 本日の占い回数（20回）に達しました\n\n明日またお楽しみください！', '⚠️');
            return;
        }
        const remaining = getPremiumRemaining();
        const confirmed = await showCustomConfirm(`👑 プレミアム占い\n\n本日残り: ${remaining}回`, '🔮', '鑑定する！', 'やめる');
        if (!confirmed) return;
        
        userData.premiumDailyCount++;
        await saveUserData();
    } else {
        // 通常ユーザー：チケット消費
        const totalTickets = userData.freeTickets + userData.earnedTickets;
        if (totalTickets < 3) {
            showTicketShortageModal();
            return;
        }
        
        const confirmed = await showCustomConfirm('🍀 3枚使用しますか？', '🔮', '鑑定する！', 'やめる');
        if (!confirmed) return;
        
        // チケット消費処理
        let ticketsToUse = 3;
        if (userData.freeTickets >= ticketsToUse) {
            userData.freeTickets -= ticketsToUse;
        } else {
            ticketsToUse -= userData.freeTickets;
            userData.freeTickets = 0;
            userData.earnedTickets -= ticketsToUse;
        }
        
        await saveUserData();
        updateUI();
    }
    
    // ローディング表示
    document.getElementById('soulStep4').style.display = 'none';
    document.getElementById('soulLoading').style.display = 'block';
    
    try {
        // 回答データを整形
        let analysisText = '【魂の暴露占い - 回答データ】\n\n';
        
        for (let i = 0; i < soulQuestions.length; i++) {
            if (soulState.answers[i]) {
                analysisText += `Q${i+1}. ${soulQuestions[i].q}\n`;
                analysisText += `A: ${soulState.answers[i]}\n`;
                if (soulState.deepAnswers[i]) {
                    analysisText += `深掘り: ${soulQuestions[i].deep}\n`;
                    analysisText += `A: ${soulState.deepAnswers[i]}\n`;
                }
                analysisText += '\n';
            }
        }
        
        // 音声をテキスト化
        let voiceText = '';
        if (soulState.voiceData) {
            const formData = new FormData();
            formData.append('audio', soulState.voiceData, 'voice.webm');
            
            const transcribeRes = await fetch('https://voifor-server.onrender.com/transcribe', {
                method: 'POST',
                body: formData
            });
            
            if (transcribeRes.ok) {
                const transcribeData = await transcribeRes.json();
                voiceText = transcribeData.text || '';
            }
        }
        
        if (voiceText) {
            analysisText += `【最後の音声メッセージ】\n「今の自分に一言」: ${voiceText}\n`;
        }
        
        // AI鑑定
        const response = await fetch('https://voifor-server.onrender.com/soul-fortune', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                answers: analysisText,
                userName: userData.name || 'あなた'
            })
        });
        
        if (!response.ok) throw new Error('鑑定エラー');
        
        const data = await response.json();
        
        // 結果表示
        document.getElementById('soulLoading').style.display = 'none';
        document.getElementById('soulResult').style.display = 'block';
        document.getElementById('soulFortuneText').innerHTML = data.result.replace(/\n/g, '<br>');
        
    } catch (err) {
        console.error('鑑定エラー:', err);
        document.getElementById('soulLoading').style.display = 'none';
        showCustomAlert('鑑定中にエラーが発生しました。もう一度お試しください。');
        document.getElementById('soulStep4').style.display = 'block';
    }
}

// もう一度占う
function retrySoul() {
    resetSoul();
}
// ========================================
// プレミアム豪華演出
// ========================================

function applyPremiumStyle() {
    const isPremium = isPremiumActive();
    
    // 既存のプレミアム要素を削除
    document.getElementById('premiumBadge')?.remove();
    document.getElementById('premiumStyle')?.remove();
    
    if (!isPremium) return;
    
    const remaining = getPremiumRemaining();
    const expiry = new Date(userData.premiumExpiry);
    const expiryStr = `${expiry.getMonth() + 1}/${expiry.getDate()}`;
    
    // プレミアム専用スタイルを追加
    const style = document.createElement('style');
    style.id = 'premiumStyle';
    style.textContent = `
        /* プレミアム時のVOIFORタイトル */
        .app-header h1 {
            background: linear-gradient(135deg, #FFD700, #FFA500, #FFD700, #FFA500) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            text-shadow: none !important;
            filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 20px rgba(255, 165, 0, 0.6)) !important;
            animation: premiumTitleGlow 2s ease-in-out infinite !important;
        }
        
        @keyframes premiumTitleGlow {
            0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 20px rgba(255, 165, 0, 0.6)); }
            50% { filter: drop-shadow(0 0 20px rgba(255, 215, 0, 1)) drop-shadow(0 0 40px rgba(255, 165, 0, 0.8)); }
        }
        
        /* プレミアムバッジ */
        #premiumBadge {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FFD700 50%, #FFA500 75%, #FFD700 100%);
            background-size: 200% 200%;
            animation: premiumShine 3s linear infinite;
            border: 3px solid rgba(255, 255, 255, 0.7);
            box-shadow: 
                0 0 20px rgba(255, 215, 0, 0.8),
                0 0 40px rgba(255, 165, 0, 0.6),
                0 0 60px rgba(255, 215, 0, 0.4),
                inset 0 0 20px rgba(255, 255, 255, 0.4);
            border-radius: 25px;
            padding: 20px;
            margin: 20px auto;
            max-width: 350px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        #premiumBadge::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%);
            animation: premiumSweep 4s linear infinite;
        }
        
        @keyframes premiumShine {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }
        
        @keyframes premiumSweep {
            0% { transform: translateX(-100%) rotate(45deg); }
            100% { transform: translateX(100%) rotate(45deg); }
        }
        
        /* 今日の声占いボタンをゴールドに */
        .fortune-btn, .main-fortune-btn {
            background: linear-gradient(135deg, #FFD700, #FFA500, #FFD700) !important;
            background-size: 200% 200% !important;
            animation: premiumShine 3s linear infinite !important;
            border: 2px solid rgba(255, 255, 255, 0.5) !important;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 165, 0, 0.4) !important;
            color: #333 !important;
            font-weight: bold !important;
        }
        
        /* ゴールドの光パーティクル */
        .gold-particle {
            position: fixed;
            width: 6px;
            height: 6px;
            background: #FFD700;
            border-radius: 50%;
            pointer-events: none;
            z-index: 0;
            box-shadow: 0 0 10px #FFD700, 0 0 20px #FFA500;
            animation: floatUp 8s linear infinite;
        }
        
        @keyframes floatUp {
            0% { 
                transform: translateY(100vh) scale(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
                transform: translateY(90vh) scale(1);
            }
            90% {
                opacity: 1;
            }
            100% { 
                transform: translateY(-10vh) scale(0.5);
                opacity: 0;
            }
        }
        
        /* 画面全体にゴールドの縁取り */
        #mainScreen {
            border: 3px solid transparent;
            background-image: linear-gradient(#0f0f23, #0f0f23), 
                              linear-gradient(135deg, #FFD700, #FFA500, #FFD700, #FFA500);
            background-origin: border-box;
            background-clip: padding-box, border-box;
            animation: borderGlow 3s ease-in-out infinite;
        }
        
        @keyframes borderGlow {
            0%, 100% { box-shadow: inset 0 0 30px rgba(255, 215, 0, 0.2); }
            50% { box-shadow: inset 0 0 50px rgba(255, 215, 0, 0.4); }
        }
    `;
    document.head.appendChild(style);
    
    // プレミアムバッジを作成
    const badge = document.createElement('div');
    badge.id = 'premiumBadge';
    badge.innerHTML = `
        <div style="position: relative; z-index: 1;">
            <div style="font-size: 1.5em; margin-bottom: 8px; color: #333; text-shadow: 0 0 10px rgba(255,255,255,0.8);">
                👑 PREMIUM 👑
            </div>
            <div style="font-size: 1em; color: #333; font-weight: bold;">
                本日残り: <span style="font-size: 1.3em; color: #8B0000;">${remaining}回</span>
            </div>
            <div style="font-size: 0.85em; color: #555; margin-top: 5px;">
                有効期限: ${expiryStr}まで
            </div>
        </div>
    `;
    
    // メイン画面の上部に挿入
    const mainContent = document.querySelector('#mainScreen .container');
    const header = document.querySelector('#mainScreen .app-header');
    if (mainContent && header) {
        header.after(badge);
    } else {
        document.querySelector('#mainScreen')?.prepend(badge);
    }
    
    // ゴールドパーティクルを追加
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'gold-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (6 + Math.random() * 4) + 's';
        document.body.appendChild(particle);
    }
}
// ========================================
// 引き継ぎコード機能
// ========================================

// 引き継ぎ画面表示
function showTransferScreen() {
    showScreen('transferScreen');
    displayTransferCode();
}

// 引き継ぎコード表示
async function displayTransferCode() {
    const deviceId = localStorage.getItem('voifor_device_id');
    if (!deviceId) return;
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('transfer_code')
            .eq('device_id', deviceId)
            .single();
        
        if (data && data.transfer_code) {
            document.getElementById('transferCodeDisplay').textContent = data.transfer_code;
        } else {
            // コードがなければ生成
            const newCode = generateTransferCode();
            await saveTransferCode(newCode);
            document.getElementById('transferCodeDisplay').textContent = newCode;
        }
    } catch (err) {
        console.error('引き継ぎコード取得エラー:', err);
    }
}

// 引き継ぎコード生成（8文字）
function generateTransferCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// 引き継ぎコード保存
async function saveTransferCode(code) {
    const deviceId = localStorage.getItem('voifor_device_id');
    if (!deviceId) return;
    
    try {
        await supabase
            .from('users')
            .update({ transfer_code: code })
            .eq('device_id', deviceId);
        console.log('引き継ぎコード保存完了:', code);
    } catch (err) {
        console.error('引き継ぎコード保存エラー:', err);
    }
}

// 引き継ぎコードをコピー
function copyTransferCode() {
    const code = document.getElementById('transferCodeDisplay').textContent;
    if (code && code !== '--------') {
        navigator.clipboard.writeText(code).then(() => {
            alert('✅ コピーしました！\n\n' + code);
        }).catch(() => {
            alert('コード: ' + code + '\n\n手動でコピーしてください');
        });
    }
}

// 引き継ぎコードを適用
async function applyTransferCode() {
    const inputCode = document.getElementById('transferCodeInput').value.toUpperCase().trim();
    
    if (!inputCode || inputCode.length !== 8) {
        alert('⚠️ 8文字の引き継ぎコードを入力してください');
        return;
    }
    
    // 自分のコードかチェック
    const myCode = document.getElementById('transferCodeDisplay').textContent;
    if (inputCode === myCode) {
        alert('⚠️ これは現在のアカウントのコードです');
        return;
    }
    
    if (!confirm('⚠️ 現在のデータは上書きされます。\n本当に引き継ぎますか？')) {
        return;
    }
    
    try {
        // 入力されたコードのユーザーを検索
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('transfer_code', inputCode)
            .single();
        
        if (error || !data) {
            alert('❌ このコードは見つかりませんでした');
            return;
        }
        
        // 現在のdevice_idを新しいユーザーデータに紐付け
        const currentDeviceId = localStorage.getItem('voifor_device_id');
        
        // 古いデバイスIDを更新（このデバイスで引き継ぎ先のデータを使う）
        await supabase
            .from('users')
            .update({ device_id: currentDeviceId })
            .eq('transfer_code', inputCode);
        
        // ローカルデータを更新
        userData.freeTickets = data.free_tickets || 0;
        userData.earnedTickets = data.earned_tickets || 0;
        userData.paidTickets = data.paid_tickets || 0;
        userData.streak = data.streak || 0;
        userData.totalReadings = data.total_readings || 0;
        userData.selectedCharacter = data.selected_character || 'devilMale';
        userData.checkedDates = data.checked_dates ? JSON.parse(data.checked_dates) : [];
        
        updateUI();
        
        alert('✅ 引き継ぎ完了！\nデータを復元しました');
        showMainScreen();
        
    } catch (err) {
        console.error('引き継ぎエラー:', err);
        alert('❌ 引き継ぎに失敗しました');
    }
}
// 引き継ぎ入力画面表示（初回登録画面から）
function showTransferInput() {
    const modal = document.createElement('div');
    modal.id = 'transferInputModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a4e 30%, #2d1b69 50%, #1a1a4e 70%, #0f0f23 100%); padding: 30px; border-radius: 25px; max-width: 400px; width: 100%; box-shadow: 0 15px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255, 105, 180, 0.5), 0 0 60px rgba(255, 105, 180, 0.3); border: 3px solid #FFB6C1; text-align: center;">
            <div style="font-size: 2.5em; margin-bottom: 15px;">🔑</div>
            <h2 style="font-size: 1.3em; margin-bottom: 20px; color: white;">引き継ぎコードで復元</h2>
            <p style="font-size: 0.95em; color: rgba(255,255,255,0.8); margin-bottom: 20px;">以前のアカウントの引き継ぎコード（8文字）を入力してください</p>
            <input type="text" id="transferCodeInputModal" maxlength="8" placeholder="例: ABCD1234" 
                style="width: 100%; padding: 15px; font-size: 1.3em; text-align: center; border-radius: 12px; border: 2px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: white; letter-spacing: 3px; font-family: monospace; text-transform: uppercase; margin-bottom: 20px;">
            <div style="display: flex; gap: 15px;">
                <button onclick="document.getElementById('transferInputModal').remove()" 
                    style="flex: 1; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); color: white; padding: 15px; border-radius: 25px; font-size: 1em; cursor: pointer;">
                    キャンセル
                </button>
                <button onclick="submitTransferInputModal()" 
                    style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; padding: 15px; border-radius: 25px; font-size: 1em; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);">
                    復元する
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 入力欄にフォーカス
    setTimeout(() => {
        document.getElementById('transferCodeInputModal').focus();
    }, 100);
    
    // モーダル外クリックで閉じる
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// 引き継ぎモーダルの送信処理
async function submitTransferInputModal() {
    const input = document.getElementById('transferCodeInputModal');
    const inputCode = input.value.toUpperCase().trim();
    
    if (!inputCode || inputCode.length !== 8) {
        await showCustomAlert('8文字の引き継ぎコードを入力してください', '⚠️');
        return;
    }
    
    document.getElementById('transferInputModal').remove();
    applyTransferCodeFromRegistration(inputCode);
}

// 初回登録画面からの引き継ぎ適用
async function applyTransferCodeFromRegistration(inputCode) {
    try {
        // 入力されたコードのユーザーを検索
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('transfer_code', inputCode)
            .single();
        
        if (error || !data) {
            alert('❌ このコードは見つかりませんでした');
            return;
        }
        
        // 現在のdevice_idを更新
        const currentDeviceId = localStorage.getItem('voifor_device_id') || 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('voifor_device_id', currentDeviceId);
        
        // デバイスIDを新しいユーザーデータに紐付け
        await supabase
            .from('users')
            .update({ device_id: currentDeviceId })
            .eq('transfer_code', inputCode);
        
        // ローカルデータを更新
        userData.freeTickets = data.free_tickets || 0;
        userData.earnedTickets = data.earned_tickets || 0;
        userData.paidTickets = data.paid_tickets || 0;
        userData.streak = data.streak || 0;
        userData.totalReadings = data.total_readings || 0;
        userData.selectedCharacter = data.selected_character || 'devilMale';
        userData.checkedDates = data.checked_dates ? JSON.parse(data.checked_dates) : [];
        userData.name = data.name || '';
        userData.birth = data.birth || '';
        userData.bloodType = data.blood_type || '';
        userData.gender = data.gender || '';
        
        // 登録済みフラグを立てる
        localStorage.setItem('voifor_registered', 'true');
        
        updateUI();
        renderCalendar();
        
        alert('✅ 引き継ぎ完了！\nデータを復元しました');
        showScreen('mainScreen');
        
    } catch (err) {
        console.error('引き継ぎエラー:', err);
        alert('❌ 引き継ぎに失敗しました');
    }
}