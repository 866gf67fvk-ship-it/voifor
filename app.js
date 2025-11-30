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
        emoji: '👹',
        speech: '占ってやるぜ！👹'
    },
    devilFemale: {
        defaultName: '鬼巫女',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269013/u4834658121_A_cute_chibi_demon_fortune_teller_character_small_b8d8bc81-26e3-4456-a478-b2a609fc70fe_2_eileck.png',
        emoji: '👹',
        speech: '占ってあげるわよ👹'
    },
    angelMale: {
        defaultName: 'エンジェル♂',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269049/u4834658121_A_cute_chibi_angel_fortune_teller_character_white_6469a933-2db5-40bf-af2f-7a4757fab116_3_nqhd7q.png',
        emoji: '😇',
        speech: '一緒に占いましょう😇'
    },
angelFemale: {
        defaultName: 'エンジェル♀',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269392/u4834658121_A_cute_chibi_angel_fortune_teller_character_white_dfe8d8c8-cff0-447d-8c3c-7d8b417105b4_1_e5ddvi.png',
        emoji: '😇',
        speech: '占わせてくださいね😇'
    },
    jesterMale: {
        defaultName: 'ピエロ♂',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269038/u4834658121_A_cute_chibi_jester_fortune_teller_character_colo_70f0ae95-dfef-4686-9415-3e3dca5130a2_0_o74bse.png',
        emoji: '🃏',
        speech: '占っちゃうよん！🃏'
    },
    jesterFemale: {
        defaultName: 'ピエロ♀',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269038/u4834658121_A_cute_chibi_jester_fortune_teller_character_colo_70f0ae95-dfef-4686-9415-3e3dca5130a2_3_rhnwuu.png',
        emoji: '🃏',
        speech: '占うよ〜！🃏'
    },
    elfMale: {
        defaultName: 'エルフ♂',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269024/u4834658121_____--v_7_dc3fac00-dc89-440c-b28e-9fe33ff8b3a8_0_1_uabcje.png',
        emoji: '🧝',
        speech: '未来を見せてあげよう🧝'
    },
    elfFemale: {
        defaultName: 'エルフ♀',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269094/u4834658121_____--v_7_1a2a511d-936c-447f-9525-f2358094ae5c_0_zinx1g.png',
        emoji: '🧝',
        speech: '占わせていただきますわ🧝'
    },
    fairy: {
        defaultName: 'フェアリー',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269036/u4834658121_A_cute_chibi_fairy_fortune_teller_character_trans_a96b325e-fc10-43ed-aec5-dadff09ae0db_2_npiwaf.png',
        emoji: '🧚',
        speech: '占うの！楽しみだね！🧚'
    },
    cat: {
        defaultName: 'クロネコ',
        image: 'https://res.cloudinary.com/dgtsmtijl/image/upload/v1764269055/u4834658121_A_cute_black_cat_fortune_teller_sitting_on_mystic_b1566c70-0a16-4513-aea5-6bc94f8b8f98_2_uvkr3s.png',
        emoji: '🐱',
        speech: '別に...占ってあげるにゃ🐱'
    }
};

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
            userData.paidTickets = data.paid_tickets;
            userData.streak = data.streak;
            userData.totalReadings = data.total_readings;
            userData.checkedDates = data.checked_dates ? JSON.parse(data.checked_dates) : [];
            userData.selectedCharacter = data.selected_character;
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
                paid_tickets: userData.paidTickets,
                streak: userData.streak,
                total_readings: userData.totalReadings,
                checked_dates: JSON.stringify(userData.checkedDates),
                selected_character: userData.selectedCharacter
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
                <div class="name">${char.emoji} ${char.defaultName}</div>
            </div>
        `;
    }
    grid.innerHTML = html;
}

// キャラ選択
async function selectCharacter(characterId) {
    userData.selectedCharacter = characterId;
    await saveUserData();
    updateUI();
    showMainScreen();
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
    const totalTickets = userData.freeTickets + userData.earnedTickets + userData.paidTickets;
    document.getElementById('currentTickets').textContent = totalTickets;
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
    showScreen('tarotScreen');
    resetTarot();
}

// 夢占い画面
function showDreamScreen() {
    alert('夢占いは準備中です');
    // TODO: 夢占い実装
}

// ========================================
// 占い機能
// ========================================

// 声占い開始（画面表示）
function startVoiceFortune() {
    // チケット確認
    const totalTickets = userData.freeTickets + userData.earnedTickets + userData.paidTickets;
    
    if (totalTickets <= 0) {
        alert('チケットがありません');
        return;
    }
    
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
        alert('マイクへのアクセスが必要です');
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
    document.getElementById('fortuneLoading').style.display = 'block';
    document.getElementById('loadingText').textContent = `${character.defaultName}が占い中...`;
    document.getElementById('fortuneCharSpeech').textContent = 'あなたの声から運勢を読み取っています...';
    
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
        
        // チケット消費
        if (userData.freeTickets > 0) {
            userData.freeTickets--;
        } else if (userData.earnedTickets > 0) {
            userData.earnedTickets--;
        } else {
            userData.paidTickets--;
        }
        
        // 占い回数更新
        userData.totalReadings++;
        
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
        document.getElementById('fortuneLoading').style.display = 'none';
        document.getElementById('fortuneResult').style.display = 'block';
        document.getElementById('fortuneText').textContent = 'エラーが発生しました。もう一度お試しください。';
    }
}

// 占い結果表示
function showFortuneResult(fortune) {
    document.getElementById('fortuneLoading').style.display = 'none';
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
    saveFortuneHistory(today, fortune, summary);
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
    document.getElementById('calendarModal').classList.add('active');
    renderModalCalendar();
}

// モーダルを閉じる
function closeCalendarModal(event) {
    if (!event || event.target.id === 'calendarModal') {
        document.getElementById('calendarModal').classList.remove('active');
    }
}

// モーダル用カレンダー描画
function renderModalCalendar() {
    const container = document.getElementById('modalCalendarGrid');
    if (!container) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
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
        const isToday = d === today;
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
function saveFortuneHistory(dateStr, fortune, summary) {
    const history = JSON.parse(localStorage.getItem('voifor_fortune_history') || '{}');
    history[dateStr] = {
        fortune: fortune,
        summary: summary,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('voifor_fortune_history', JSON.stringify(history));
}
// ========================================
// チケット購入（Stripe）
// ========================================

// Stripe公開キー
const stripe = Stripe('pk_test_51SPaWsIpIpuVRpxZBE0LgYxH5Fn8nwzh7EYRQAK2GMvxiKYoZi1zT3RA36VNLZb9o7TMm5W3J7A3X5f7Cq0PEr0f00ThNZl8gn');

// チケット購入
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
            alert(result.error.message);
        }
        
    } catch (error) {
        console.error('購入エラー:', error);
        alert('購入処理中にエラーが発生しました');
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
            alert(result.error.message);
        }
        
    } catch (error) {
        console.error('購入エラー:', error);
        alert('購入処理中にエラーが発生しました');
    }
}

// 動画広告でチケット獲得（仮実装）
function watchAdForTicket() {
    alert('動画広告機能は準備中です\n（Google AdMob連携後に有効になります）');
    // TODO: AdMob実装後に有効化
}

// SNSシェア
function shareToSNS() {
    const text = '声で占う新感覚アプリ「VOIFOR」で今日の運勢を占ったよ！🔮✨';
    const url = 'https://voifor.vercel.app';
    
    if (navigator.share) {
        navigator.share({
            title: 'VOIFOR -声占い-',
            text: text,
            url: url
        }).then(() => {
            // シェア成功したらチケット付与
            userData.earnedTickets++;
            saveUserData();
            updateUI();
            alert('シェアありがとう！🎫 1チケット獲得！');
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
    document.getElementById('editNickname').value = userData.nickname || '';
    document.getElementById('editBirthday').value = userData.birthday || '';
    document.getElementById('editGender').value = userData.gender || '';
}

// プロフィール保存
async function saveProfile() {
    userData.nickname = document.getElementById('editNickname').value;
    userData.birthday = document.getElementById('editBirthday').value;
    userData.gender = document.getElementById('editGender').value;
    
    await saveUserData();
    alert('保存しました！');
    showSettingsScreen();
}

// データリセット確認
function confirmReset() {
    if (confirm('本当にすべてのデータをリセットしますか？\nこの操作は取り消せません。')) {
        if (confirm('最終確認です。本当にリセットしますか？')) {
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
    
    alert('データをリセットしました。アプリを再読み込みします。');
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
        return data.type === currentHistoryFilter;
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
        'compatibility': 'tabCompat'
    };
    
    document.getElementById(tabId[type]).classList.add('active');
    
    renderHistoryList();
}

// 履歴詳細表示
function showHistoryDetail(date) {
    const history = JSON.parse(localStorage.getItem('voifor_fortune_history') || '{}');
    const data = history[date];
    
    if (data) {
        alert(`📅 ${formatDate(date)}\n\n${data.fortune || '詳細なし'}\n\n${data.summary || ''}`);
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
    
    document.getElementById('tarotStep1').style.display = 'block';
    document.getElementById('tarotStep2').style.display = 'none';
    document.getElementById('tarotStep3').style.display = 'none';
    document.getElementById('tarotLoading').style.display = 'none';
    document.getElementById('tarotResult').style.display = 'none';
    
    document.querySelectorAll('.spread-option').forEach(el => el.classList.remove('selected'));
}

// スプレッド選択
function selectSpread(num) {
    tarotState.spread = num;
    tarotState.ticketCost = num === 1 ? 1 : 2;
    
    // チケット確認
    const totalTickets = userData.freeTickets + userData.earnedTickets + userData.paidTickets;
    if (totalTickets < tarotState.ticketCost) {
        alert('チケットが足りません');
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
    // 声で質問の場合は既にチケット消費済み
    if (!tarotState.ticketUsed) {
        // チケット確認
        const totalTickets = userData.freeTickets + userData.earnedTickets + userData.paidTickets;
        if (totalTickets < tarotState.ticketCost) {
            alert('チケットが足りません');
            return;
        }
        
        if (!confirm(`🎫 ${tarotState.ticketCost}チケット使用します。よろしいですか？`)) {
            return;
        }
        
        // チケット消費
        for (let i = 0; i < tarotState.ticketCost; i++) {
            if (userData.freeTickets > 0) {
                userData.freeTickets--;
            } else if (userData.earnedTickets > 0) {
                userData.earnedTickets--;
            } else {
                userData.paidTickets--;
            }
        }
        tarotState.ticketUsed = true;
        await saveUserData();
        updateUI();
    }
    
    document.getElementById('tarotStep3').style.display = 'none';
    document.getElementById('tarotLoading').style.display = 'block';
    
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
        
        showTarotResult(drawnCards, data.fortune);
        
} catch (error) {
        console.error('タロットエラー:', error);
        document.getElementById('tarotLoading').style.display = 'none';
        document.getElementById('tarotResult').style.display = 'block';
        document.getElementById('tarotFortuneText').textContent = 'エラーが発生しました。チケットは消費されていません。';
        // エラー時はチケット消費なし
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
console.log('📱 app.js 読み込み完了');
// 戻る確認
function confirmTarotBack() {
    if (tarotState.ticketUsed) {
        if (confirm('チケットを消費しています。戻るとチケットは戻ってきません。本当に戻りますか？')) {
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
async function startTarotVoiceQuestion() {
    // チケット確認
    const totalTickets = userData.freeTickets + userData.earnedTickets + userData.paidTickets;
    if (totalTickets < tarotState.ticketCost) {
        alert('チケットが足りません');
        return;
    }
    
    if (!confirm(`🎫 ${tarotState.ticketCost}チケット使用します。よろしいですか？`)) {
        return;
    }
    
    // チケット消費
    for (let i = 0; i < tarotState.ticketCost; i++) {
        if (userData.freeTickets > 0) {
            userData.freeTickets--;
        } else if (userData.earnedTickets > 0) {
            userData.earnedTickets--;
        } else {
            userData.paidTickets--;
        }
    }
    tarotState.ticketUsed = true;
    await saveUserData();
    updateUI();
    
    const btn = document.querySelector('.voice-category-btn');
    btn.disabled = true;
    btn.textContent = '🔴 録音中...';
    
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
            btn.disabled = false;
            btn.textContent = '🎤 声で質問する';
            
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
        
        // 3秒後に停止
        setTimeout(() => {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
            }
        }, 3000);
        
    } catch (error) {
        console.error('マイクエラー:', error);
        btn.disabled = false;
        btn.textContent = '🎤 声で質問する';
        alert('マイクへのアクセスが必要です');
    }
}