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
        emoji: '⭐',
        speech: '占ってやるぜ！'
    },
    devilFemale: {
        defaultName: '鬼巫女',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269013/u4834658121_A_cute_chibi_demon_fortune_teller_character_small_b8d8bc81-26e3-4456-a478-b2a609fc70fe_2_eileck.png',
        emoji: '⭐',
        speech: '占ってあげるわよ💕'
    },
    angelMale: {
        defaultName: 'エンジェル♂',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269049/u4834658121_A_cute_chibi_angel_fortune_teller_character_white_6469a933-2db5-40bf-af2f-7a4757fab116_3_nqhd7q.png',
        emoji: '⭐',
        speech: '一緒に占いましょう✨'
    },
    angelFemale: {
        defaultName: 'エンジェル♀',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269392/u4834658121_A_cute_chibi_angel_fortune_teller_character_white_dfe8d8c8-cff0-447d-8c3c-7d8b417105b4_1_e5ddvi.png',
        emoji: '⭐',
        speech: '占わせてくださいね💕'
    },
    jesterMale: {
        defaultName: 'ピエロ♂',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269038/u4834658121_A_cute_chibi_jester_fortune_teller_character_colo_70f0ae95-dfef-4686-9415-3e3dca5130a2_0_o74bse.png',
        emoji: '⭐',
        speech: '占っちゃうよん！✨'
    },
    jesterFemale: {
        defaultName: 'ピエロ♀',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269038/u4834658121_A_cute_chibi_jester_fortune_teller_character_colo_70f0ae95-dfef-4686-9415-3e3dca5130a2_3_rhnwuu.png',
        emoji: '⭐',
        speech: '占うよ〜！💕'
    },
    elfMale: {
        defaultName: 'エルフ♂',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269024/u4834658121_____--v_7_dc3fac00-dc89-440c-b28e-9fe33ff8b3a8_0_1_uabcje.png',
        emoji: '⭐',
        speech: '未来を見せてあげよう✨'
    },
    elfFemale: {
        defaultName: 'エルフ♀',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269094/u4834658121_____--v_7_1a2a511d-936c-447f-9525-f2358094ae5c_0_zinx1g.png',
        emoji: '⭐',
        speech: '占わせていただきますわ💕'
    },
    fairy: {
        defaultName: 'フェアリー',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269036/u4834658121_A_cute_chibi_fairy_fortune_teller_character_trans_a96b325e-fc10-43ed-aec5-dadff09ae0db_2_npiwaf.png',
        emoji: '⭐',
        speech: '占うの！楽しみだね！✨'
    },
    cat: {
        defaultName: 'クロネコ',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269055/u4834658121_A_cute_black_cat_fortune_teller_sitting_on_mystic_b1566c70-0a16-4513-aea5-6bc94f8b8f98_2_uvkr3s.png',
        emoji: '⭐',
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
    characterName: ''        // キャラクター名
};

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌟 VOIFOR 起動中...');
    
    // ユーザーデータ読み込み
    await loadUserData();
    
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
    }
    
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
        }
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
                is_registered: userData.isRegistered
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
                    • SNSでシェア → <strong style="color: #4ade80;">⭐+1</strong><br>
                    • 友達がコード使用 → <strong style="color: #4ade80;">⭐+1</strong><br>
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
       
    let message = `🎉 ${platformName}シェアありがとう！\n⭐+1クローバーを獲得しました！`;
    if (!otherDone) {
        message += `\n\n💡 ${otherPlatform}でもシェアすると更に⭐+1！`;
    }
    message += `\n\n現在の保有:\n🍀 ${userData.freeTickets}枚\n⭐ ${userData.earnedTickets}枚`;
    
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
    
    // 紹介者に⭐+1
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
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await analyzeVoice(audioBlob);
            recordingStream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        
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
// クローバー購入（Stripe）
// ========================================

// Stripe公開キー
const stripe = Stripe('pk_test_51SPaWsIpIpuVRpxZBE0LgYxH5Fn8nwzh7EYRQAK2GMvxiKYoZi1zT3RA36VNLZb9o7TMm5W3J7A3X5f7Cq0PEr0f00ThNZl8gn');

// クローバー購入
async function purchaseTickets(amount, price) {
    try {
        const deviceId = getDeviceId();
        
        const response = await fetch('https://voifor-server.onrender.com/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                price: price,
                type: 'ticket',
                userId: deviceId
            })
        });
        
        if (!response.ok) {
            throw new Error('決済エラー');
        }
        
        const session = await response.json();
        
        // Stripeの決済ページにリダイレクト
        const result = await stripe.redirectToCheckout({
            sessionId: session.id
        });
        
        if (result.error) {
await showCustomAlert(result.error.message, '❌');
        }
        
    } catch (error) {
        console.error('購入エラー:', error);
await showCustomAlert('購入処理中にエラーが発生しました', '❌');
    }
}
// ========================================
// プレミアム・無料獲得
// ========================================

// プレミアム購入
async function purchasePremium() {
    try {
        const deviceId = getDeviceId();
        
        const response = await fetch('https://voifor-server.onrender.com/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'premium',
                userId: deviceId
            })
        });
        
        if (!response.ok) {
            throw new Error('決済エラー');
        }
        
        const session = await response.json();
        
        const result = await stripe.redirectToCheckout({
            sessionId: session.id
        });
        
        if (result.error) {
         await showCustomAlert(result.error.message, '❌');
        }
        
    } catch (error) {
        console.error('購入エラー:', error);
   await showCustomAlert('購入処理中にエラーが発生しました', '❌');
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
            <p style="font-size: 1em; color: white; margin-bottom: 10px;">30秒の動画を見ると<br><span style="color: #4ade80; font-weight: bold;">🍀 +1クローバー</span>GET！</p>
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

// 動画広告モーダル表示
let adInterval = null;

function showVideoAd() {
    const adModal = document.createElement('div');
    adModal.id = 'videoAdModal';
    adModal.style.cssText = `
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
    
    adModal.innerHTML = `
        <div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a4e 30%, #2d1b69 50%, #1a1a4e 70%, #0f0f23 100%); padding: 30px; border-radius: 25px; max-width: 400px; width: 100%; box-shadow: 0 15px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255, 105, 180, 0.5), 0 0 60px rgba(255, 105, 180, 0.3); border: 3px solid #FFB6C1; text-align: center;">
            <h2 style="font-size: 1.5em; margin-bottom: 20px; color: white;🎥🎥 広告を再生中...</h2>
            <div style="font-size: 4em; margin: 30px 0; color: #FFD700; font-weight: bold;" id="adCountdown">30</div>
            <p style="font-size: 1em; opacity: 0.7; color: white; margin-bottom: 25px;">広告終了後にクローバーを獲得できます</p>
            <button onclick="cancelAdWatch()" style="background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); color: white; padding: 12px 30px; border-radius: 25px; font-size: 1em; cursor: pointer;">
                キャンセル
            </button>
        </div>
    `;
    
    document.body.appendChild(adModal);
    
    // カウントダウン
    let count = 30;
    const countdownEl = document.getElementById('adCountdown');
    
    adInterval = setInterval(() => {
        count--;
        countdownEl.textContent = count;
        
        if (count <= 0) {
            clearInterval(adInterval);
            adInterval = null;
            showAdCompleteScreen();
        }
    }, 1000);
}

// キャンセル
function cancelAdWatch() {
    if (adInterval) {
        clearInterval(adInterval);
        adInterval = null;
    }
    document.getElementById('videoAdModal')?.remove();
}

// 視聴完了画面
function showAdCompleteScreen() {
    const modal = document.getElementById('videoAdModal');
    if (!modal) return;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a4e 30%, #2d1b69 50%, #1a1a4e 70%, #0f0f23 100%); padding: 30px; border-radius: 25px; max-width: 400px; width: 100%; box-shadow: 0 15px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255, 105, 180, 0.5), 0 0 60px rgba(255, 105, 180, 0.3); border: 3px solid #FFB6C1; text-align: center;">
            <div style="font-size: 4em; margin-bottom: 20px;">🎉</div>
            <h2 style="font-size: 1.5em; margin-bottom: 15px; color: white;">視聴完了！</h2>
            <p style="font-size: 1.1em; color: #4ade80; margin-bottom: 25px;">🍀 +1 クローバーを獲得！</p>
            <button onclick="claimAdReward()" style="background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; padding: 15px 40px; border-radius: 25px; font-size: 1.1em; font-weight: bold; cursor: pointer; box-shadow: 0 5px 20px rgba(102, 126, 234, 0.5);">
                受け取る
            </button>
        </div>
    `;
}

// 報酬受け取り
async function claimAdReward() {
    document.getElementById('videoAdModal')?.remove();
    
    // 🍀クローバー付与（上限5枚）
    let success = false;
    if (userData.freeTickets < 5) {
        userData.freeTickets++;
        success = true;
        await saveUserData();
        updateUI();
    }
    
    incrementAdCount();
    
    const today = new Date().toDateString();
    const adData = JSON.parse(localStorage.getItem('voifor_ad_data') || '{}');
    const remaining = MAX_DAILY_ADS - (adData[today] || 0);
    
    if (success) {
        alert(`🎉 🍀+1を獲得しました！\n\n現在の保有:\n🍀 無料: ${userData.freeTickets}枚\n⭐ 獲得: ${userData.earnedTickets}枚\n\n本日の残り視聴可能回数: ${remaining}回`);
    } else {
        alert(`⚠️ 🍀無料クローバーは上限(5枚)に達しています\n\n現在の保有:\n🍀 無料: ${userData.freeTickets}枚（上限）\n⭐ 獲得: ${userData.earnedTickets}枚\n\n無料クローバーを使ってからまた受け取れます！`);
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
        'dream': 'tabDream'
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
    
    // クローバー確認
const totalTickets = userData.freeTickets + userData.earnedTickets;
    if (totalTickets < tarotState.ticketCost) {
await showCustomAlert('クローバーが足りません', '😢');
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
        alert('質問を入力してください');
        return;
    }
    
    // クローバー確認
    const totalTickets = userData.freeTickets + userData.earnedTickets;
    if (totalTickets < tarotState.ticketCost) {
await showCustomAlert('クローバーが足りません', '😢');
        return;
    }
    
    // 確認モーダル表示
    showTarotTextConfirmModal(question);
}

// タロットテキスト質問確認モーダル
function showTarotTextConfirmModal(question) {
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
            <p style="font-size: 0.9em; opacity: 0.8; color: white; margin-bottom: 20px;">🍀 ${tarotState.ticketCost}クローバー使用します</p>
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
function confirmTarotTextQuestion(question) {
    document.getElementById('tarotTextConfirmModal')?.remove();
    
    // クローバー消費
    for (let i = 0; i < tarotState.ticketCost; i++) {
        if (userData.freeTickets > 0) {
            userData.freeTickets--;
        } else if (userData.earnedTickets > 0) {
            userData.earnedTickets--;
        }
    }
    tarotState.ticketUsed = true;
    saveUserData();
    updateUI();
    
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
        // クローバー確認
const totalTickets = userData.freeTickets + userData.earnedTickets;
        if (totalTickets < tarotState.ticketCost) {
            alert('クローバーが足りません');
            return;
        }
        
const confirmed = await showCustomConfirm(`🍀 ${tarotState.ticketCost}クローバー使用します。\nよろしいですか？`, '🃏', '占う！', 'やめる');
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
        const confirmed = await showCustomConfirm('クローバーを消費しています。\n戻るとクローバーは戻ってきません。\n\n本当に戻りますか？', '⚠️', '戻る', 'やめる');
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
await showCustomAlert('クローバーが足りません', '😢');
        return;    }
    
const confirmed = await showCustomConfirm(`🍀 ${tarotState.ticketCost}クローバー使用します。\nよろしいですか？`, '🎤', '録音する！', 'やめる');
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
        zodiacDisplay.textContent = `${zodiacEmoji[zodiac] || '⭐'} ${zodiac}`;
        
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
    // 毎回クローバー確認＆消費
const totalTickets = userData.freeTickets + userData.earnedTickets;
    if (totalTickets < 1) {
await showCustomAlert('クローバーが足りません', '😢');
        return;
    }
const confirmed = await showCustomConfirm('🍀 1クローバー消費します。\n録音後は戻れません。\n\nよろしいですか？', '🎤', '録音する！', 'やめる');
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
    
    const btn = document.getElementById(`compat${personNum}VoiceBtn`);
    const status = document.getElementById(`compat${personNum}VoiceStatus`);
    
    btn.disabled = true;
    btn.textContent = '🔴 録音中... 3秒';
    status.textContent = '';
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        
        recorder.ondataavailable = (e) => {
            chunks.push(e.data);
        };
        
        recorder.onstop = () => {
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
        const totalTickets = userData.freeTickets + userData.earnedTickets;
        if (totalTickets < 1) {
await showCustomAlert('クローバーが足りません', '😢');
            return;
        }
        
const confirmed = await showCustomConfirm('🍀 1クローバー使用します。\nよろしいですか？', '💕', '占う！', 'やめる');
        if (!confirmed) {
            return;
        }
        
        // クローバー消費（🍀無料 → ⭐獲得 の順）
        if (userData.freeTickets > 0) {
            userData.freeTickets--;
        } else if (userData.earnedTickets > 0) {
            userData.earnedTickets--;
        }
        compatState.ticketUsed = true;
        await saveUserData();
        updateUI();
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
        const confirmed = await showCustomConfirm('クローバーを消費しています。\n戻りますか？', '⚠️', '戻る', 'やめる');
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

// 音声録音
async function recordDreamVoice() {
    const btn = document.getElementById('dreamVoiceBtn');
    const status = document.getElementById('dreamVoiceStatus');
    
    btn.disabled = true;
    btn.textContent = '🔴 録音中... 15秒';
    status.textContent = '';
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        
        recorder.ondataavailable = (e) => chunks.push(e.data);
        
        recorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop());
            dreamVoiceBlob = new Blob(chunks, { type: 'audio/webm' });
            
            btn.textContent = '✅ 録音完了';
            btn.classList.add('recorded');
            status.textContent = '録音しました！';
            btn.disabled = false;
            
            document.getElementById('dreamVoiceNext').style.display = 'block';
        };
        
        recorder.start();
        
        let count = 15;
        const countdown = setInterval(() => {
            count--;
            if (count > 0) {
                btn.textContent = `🔴 録音中... ${count}秒`;
            } else {
                clearInterval(countdown);
                if (recorder.state === 'recording') {
                    recorder.stop();
                }
            }
        }, 1000);
        
    } catch (error) {
        console.error('マイクエラー:', error);
        btn.disabled = false;
        btn.textContent = '🎤 録音する';
await showCustomAlert('マイクへのアクセスが必要です', '🎤');
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
    // クローバー確認
const confirmed = await showCustomConfirm(`🍀 ${dreamState.ticketCost}クローバー使用します。\nよろしいですか？`, '🌙', '占う！', 'やめる');
    if (!confirmed) {
        return;
    }
    
// クローバーチェック
    const totalTickets = userData.freeTickets + userData.earnedTickets;
    if (totalTickets < dreamState.ticketCost) {
await showCustomAlert('クローバーが足りません', '😢');
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
        const confirmed = await showCustomConfirm('クローバーを消費しています。\n戻りますか？', '⚠️', '戻る', 'やめる');
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
        const ticketType = requiredTickets === 0 ? '🎁 無料' : (userData.freeTickets > 0 ? '🍀 無料クローバー' : '⭐ 獲得クローバー');
        
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
                    🎥 動画で1クローバー獲得
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