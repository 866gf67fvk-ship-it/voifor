// ========================================
// VOIFOR -声占い- メインアプリ
// ========================================

// ユーザーデータ
let userData = {
    oduu: null,
    oduu: null,
    freeTickets: 3,
    earnedTickets: 0,
    oduu: null,
    oduu: null,
    paidTickets: 0,
    streak: 0,
    totalReadings: 0,
    checkedDates: [],
    selectedCharacter: 'luna'
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
    
    console.log('✅ VOIFOR 準備完了！');
});

// UI更新
function updateUI() {
    // チケット数
    const totalTickets = userData.freeTickets + userData.earnedTickets + userData.paidTickets;
    document.getElementById('ticketCount').textContent = totalTickets;
    
    // 連続日数・合計
    document.getElementById('streakCount').textContent = userData.streak;
    document.getElementById('totalCount').textContent = userData.totalReadings;
}

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
}

// メイン画面に戻る
function showMainScreen() {
    showScreen('mainScreen');
}
// ========================================
// データ読み込み・保存
// ========================================

// ユーザーデータ読み込み
async function loadUserData() {
    // まずローカルストレージから
    const saved = localStorage.getItem('voifor_user');
    if (saved) {
        userData = { ...userData, ...JSON.parse(saved) };
    }
    console.log('📁 ユーザーデータ読み込み完了');
}

// ユーザーデータ保存
async function saveUserData() {
    localStorage.setItem('voifor_user', JSON.stringify(userData));
    console.log('💾 ユーザーデータ保存完了');
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
        const isToday = d === today;
        const isChecked = userData.checkedDates.includes(dateStr);
        
        let classes = 'day';
        if (isToday) classes += ' today';
        if (isChecked) classes += ' checked';
        
        html += `<span class="${classes}">${d}</span>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}
// ========================================
// 画面表示関数
// ========================================

// 設定画面
function showSettingsScreen() {
    alert('設定画面は準備中です');
    // TODO: 設定画面実装
}

// 履歴画面
function showHistoryScreen() {
    alert('履歴画面は準備中です');
    // TODO: 履歴画面実装
}

// 購入画面
function showPurchaseScreen() {
    alert('購入画面は準備中です');
    // TODO: 購入画面実装
}

// 招待画面
function showReferralScreen() {
    alert('招待画面は準備中です');
    // TODO: 招待画面実装
}

// 相性占い画面
function showCompatibilityScreen() {
    alert('相性占いは準備中です');
    // TODO: 相性占い実装
}

// タロット画面
function showTarotScreen() {
    alert('タロット占いは準備中です');
    // TODO: タロット実装
}

// 夢占い画面
function showDreamScreen() {
    alert('夢占いは準備中です');
    // TODO: 夢占い実装
}

// ========================================
// 占い機能
// ========================================

// 声占い開始
function startVoiceFortune() {
    // チケット確認
    const totalTickets = userData.freeTickets + userData.earnedTickets + userData.paidTickets;
    
    if (totalTickets <= 0) {
        alert('チケットがありません');
        return;
    }
    
    alert('声占い機能は準備中です');
    // TODO: 声占い実装
}

// 動画広告でチケット獲得
function watchAdForTicket() {
    alert('動画広告機能は準備中です');
    // TODO: 広告実装
}

console.log('📱 app.js 読み込み完了');