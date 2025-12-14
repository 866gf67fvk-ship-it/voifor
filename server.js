require('dotenv').config();
const express = require('express');
const cors = require('cors');
const speech = require('@google-cloud/speech');
const Anthropic = require('@anthropic-ai/sdk');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
// ファイルアップロード用
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
// PAY.JP
const Payjp = require('payjp');
const payjp = Payjp(process.env.PAYJP_SECRET_KEY);

// Supabase
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);
console.log('Supabase接続準備完了');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Google Cloud Speech
let googleCredentials;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    googleCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
}

const speechClient = new speech.SpeechClient({
    credentials: googleCredentials
});

// Anthropic API
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// WebMをWAVに変換
async function convertWebMToWav(webmBase64) {
    return new Promise(async (resolve, reject) => {
        const tempWebM = path.join(__dirname, `temp_${Date.now()}.webm`);
        const tempWav = path.join(__dirname, `temp_${Date.now()}.wav`);

        try {
            const base64Audio = webmBase64.replace(/^data:audio\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Audio, 'base64');
            await writeFile(tempWebM, buffer);

            ffmpeg(tempWebM)
                .toFormat('wav')
                .audioChannels(1)
                .audioFrequency(16000)
                .on('end', async () => {
                    const wavBuffer = fs.readFileSync(tempWav);
                    const wavBase64 = wavBuffer.toString('base64');
                    await unlink(tempWebM).catch(() => {});
                    await unlink(tempWav).catch(() => {});
                    resolve(wavBase64);
                })
                .on('error', async (err) => {
                    await unlink(tempWebM).catch(() => {});
                    await unlink(tempWav).catch(() => {});
                    reject(err);
                })
                .save(tempWav);
        } catch (error) {
            reject(error);
        }
    });
}
// ========================================
// 声占いエンドポイント
// ========================================
app.post('/analyze-voice', async (req, res) => {
    try {
        const { audioBase64, characterName, characterPersonality } = req.body;
        console.log('声占いリクエスト:', characterName);

        const wavBase64 = await convertWebMToWav(audioBase64);

        const audio = { content: wavBase64 };
        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'ja-JP',
            enableAutomaticPunctuation: true,
            audioChannelCount: 1,
        };

        const [response] = await speechClient.recognize({ audio, config });
        
        if (!response.results || response.results.length === 0) {
            return res.json({
                fortune: `${characterName}「声が聞こえなかったわ...もう一度話してくれる？」`,
                transcription: ''
            });
        }

        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        console.log('認識結果:', transcription);

        const prompt = `あなたは${characterName}という占い師です。

【キャラクター性格】
${characterPersonality}

【ユーザーの今朝の声】
「${transcription}」

この声の内容を元に、${characterName}として今日の運勢を占ってください。

【重要な指示】
1. ${characterName}のキャラクター性に沿った口調で話してください
2. ユーザーの言葉の内容を踏まえて占ってください
3. 具体的で実践的なアドバイスを含めてください
4. 150-200文字程度で簡潔に
5. 必ず前向きで温かいメッセージを

占い結果:`;

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }]
        });

        res.json({ 
            fortune: message.content[0].text,
            transcription
        });

    } catch (error) {
        console.error('声占いエラー:', error.message);
        res.status(500).json({ error: 'サーバーエラー' });
    }
});

// ========================================
// タロット占いエンドポイント
// ========================================
app.post('/tarot-fortune', async (req, res) => {
    try {
        const { cards, category, voiceQuestion, characterName, characterPersonality } = req.body;
        console.log('タロット占いリクエスト:', characterName);

        let cardsInfo = cards.map((card, i) => {
            const position = cards.length === 3 ? ['過去', '現在', '未来'][i] : '';
            return `${position ? position + ': ' : ''}${card.name}（${card.meaning}）`;
        }).join('\n');

        const prompt = `あなたは${characterName}という占い師です。${characterPersonality}

以下のタロットカードが出ました：
${cardsInfo}

${category ? `相談カテゴリ: ${category}` : ''}
${voiceQuestion ? `質問: ${voiceQuestion}` : ''}

このカードの意味を解釈し、相談者へのアドバイスを${characterName}らしい口調で300文字程度で伝えてください。`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        });

        res.json({ fortune: response.content[0].text });

    } catch (error) {
        console.error('タロットエラー:', error.message);
        res.status(500).json({ error: 'タロット占いに失敗しました' });
    }
});
// ========================================
// 相性占いエンドポイント
// ========================================
app.post('/compatibility-fortune', async (req, res) => {
    try {
        const { person1, person2, relation, characterName, characterPersonality } = req.body;
        console.log('相性占いリクエスト:', characterName);

        let info1 = `${person1.name}`;
        if (person1.birthday) info1 += `（${person1.birthday}生まれ、${person1.zodiac || ''}）`;
        if (person1.blood) info1 += ` ${person1.blood}型`;
        if (person1.gender) info1 += ` ${person1.gender === 'male' ? '男性' : person1.gender === 'female' ? '女性' : 'その他'}`;

        let info2 = `${person2.name}`;
        if (person2.birthday) info2 += `（${person2.birthday}生まれ、${person2.zodiac || ''}）`;
        if (person2.blood) info2 += ` ${person2.blood}型`;
        if (person2.gender) info2 += ` ${person2.gender === 'male' ? '男性' : person2.gender === 'female' ? '女性' : 'その他'}`;

        const relationMap = {
            crush: '片思い中', dating: '交際中', friend: '友人',
            coworker: '同僚', ex: '元恋人', family: '家族',
            oshi: '推し・ファン', celebrity: '有名人・芸能人', idol: '憧れの人', other: 'その他'
        };

        const prompt = `あなたは${characterName}という占い師です。${characterPersonality}

以下の2人の相性を占ってください：
人物1: ${info1}
人物2: ${info2}
二人の関係: ${relationMap[relation] || relation || '不明'}

相性スコア（0-100%）と、相性の詳細なアドバイスを${characterName}らしい口調で300文字程度で伝えてください。
最初の行に「相性スコア: XX%」と書いてください。`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        });

        const text = response.content[0].text;
        const scoreMatch = text.match(/相性スコア[：:]\s*(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : Math.floor(Math.random() * 40) + 60;

        res.json({ fortune: text, score: score });

    } catch (error) {
        console.error('相性占いエラー:', error.message);
        res.status(500).json({ error: '相性占いに失敗しました' });
    }
});

// ========================================
// 夢占いエンドポイント
// ========================================
app.post('/dream-fortune', async (req, res) => {
    try {
        const { dreamContent, type, details, characterName, characterPersonality } = req.body;
        console.log('夢占いリクエスト:', characterName, type);

        let detailsText = '';
        if (type === 'detailed' && details) {
            if (details.when) detailsText += `いつ見た夢: ${details.when}\n`;
            if (details.emotion) detailsText += `夢の中の感情: ${details.emotion}\n`;
            if (details.impression) detailsText += `印象的だったもの: ${details.impression}\n`;
            if (details.color) detailsText += `夢の色彩: ${details.color}\n`;
            if (details.wakeup) detailsText += `目覚めた時の気分: ${details.wakeup}\n`;
        }

        const prompt = `あなたは${characterName}という占い師です。${characterPersonality}

以下の夢を占ってください：
夢の内容: ${dreamContent}
${detailsText}

この夢が持つ意味、象徴するもの、そして相談者へのメッセージを${characterName}らしい口調で${type === 'detailed' ? '400' : '300'}文字程度で伝えてください。`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        });

        res.json({ fortune: response.content[0].text });

    } catch (error) {
        console.error('夢占いエラー:', error.message);
        res.status(500).json({ error: '夢占いに失敗しました' });
    }
});
// ========================================
// 音声→テキスト変換エンドポイント
// ========================================
app.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '音声ファイルがありません' });
        }
        
        console.log('音声変換リクエスト');
        
        // WebMをBase64に変換
        const audioBase64 = req.file.buffer.toString('base64');
        const wavBase64 = await convertWebMToWav('data:audio/webm;base64,' + audioBase64);
        
        const audio = { content: wavBase64 };
        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'ja-JP',
            enableAutomaticPunctuation: true,
            audioChannelCount: 1,
        };
        
        const [response] = await speechClient.recognize({ audio, config });
        
        if (!response.results || response.results.length === 0) {
            return res.json({ text: '' });
        }
        
        const text = response.results
            .map(result => result.alternatives[0].transcript)
            .join('');
        
        console.log('音声変換結果:', text);
        res.json({ text });
        
    } catch (error) {
        console.error('音声変換エラー:', error.message);
        res.status(500).json({ error: '音声変換に失敗しました' });
    }
});

// ========================================
// 魂の暴露占いエンドポイント
// ========================================
app.post('/soul-fortune', async (req, res) => {
    try {
        const { answers, userName } = req.body;
        console.log('魂の暴露占いリクエスト:', userName);
        
        const prompt = `あなたは「魂の暴露師」という占い師です。
相手の心の奥底を見通し、本人すら気づいていない真実を暴き出す占い師です。

【あなたの特徴】
- シャドウワーク、深層心理学、スピリチュアルの専門知識を持つ
- 表面的な慰めや当たり障りのないアドバイスは一切しない
- 優しいが、容赦なく本質を突く
- 占い師として神秘的な口調で話す

【相談者の回答データ】
相談者名: ${userName}

${answers}

【あなたがやること】
この回答データを分析し、以下の構成で鑑定結果を書いてください：

━━━━━━━━━━━━━━━━━━━━
【あなたの隠された本音】
━━━━━━━━━━━━━━━━━━━━
（本当は〇〇と思っている、〇〇が欲しい、など。本人が認めたくない本心を暴く）

━━━━━━━━━━━━━━━━━━━━
【傷の根源】
━━━━━━━━━━━━━━━━━━━━
（過去のどの経験が今も影響しているか）

━━━━━━━━━━━━━━━━━━━━
【心の盲点】
━━━━━━━━━━━━━━━━━━━━
（自分では気づいていない思考のクセ、無意識のパターン）

━━━━━━━━━━━━━━━━━━━━
【繰り返すループの正体】
━━━━━━━━━━━━━━━━━━━━
（なぜ同じ失敗を繰り返すのか、その原因）

━━━━━━━━━━━━━━━━━━━━
【あなたの闇】
━━━━━━━━━━━━━━━━━━━━
（認めたくない自分の一面、シャドウ）

━━━━━━━━━━━━━━━━━━━━
【眠っている強み】
━━━━━━━━━━━━━━━━━━━━
（本人が気づいていない、または活かせていない強み）

━━━━━━━━━━━━━━━━━━━━
【魂の処方箋】
━━━━━━━━━━━━━━━━━━━━
（具体的なアドバイス、マインドセットの転換、行動指針）

【重要】
- 忖度なし、お世辞なしで容赦なく分析してください
- ただし最後は希望を持てる内容で締めてください
- 全体で800〜1200文字程度`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }]
        });
        
        res.json({ result: response.content[0].text });
        
    } catch (error) {
        console.error('魂の暴露占いエラー:', error.message);
        res.status(500).json({ error: '鑑定に失敗しました' });
    }
});

// ========================================
// Stripe決済エンドポイント
// ========================================
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { amount, price, type, userId } = req.body;
        console.log('決済リクエスト:', type, amount, price);

        let lineItems;
        let mode = 'payment';

        if (type === 'premium') {
            // プレミアムプラン（サブスクリプション）
            mode = 'subscription';
            lineItems = [{
                price_data: {
                    currency: 'jpy',
                    product_data: {
                        name: 'VOIFOR プレミアム',
                        description: '占い放題（1日20回）・広告なし',
                    },
                    unit_amount: 1480,
                    recurring: {
                        interval: 'month',
                    },
                },
                quantity: 1,
            }];
        } else {
            // クローバー購入（単発）
            lineItems = [{
                price_data: {
                    currency: 'jpy',
                    product_data: {
                        name: `VOIFOR クローバー ${amount}枚`,
                        description: `占いチケット ${amount}回分`,
                    },
                    unit_amount: price,
                },
                quantity: 1,
            }];
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: mode,
            success_url: `https://voifor.vercel.app/?success=true&amount=${amount || 0}`,
            cancel_url: 'https://voifor.vercel.app/?canceled=true',
            metadata: {
                userId: userId,
                amount: amount || 0,
                type: type
            }
        });

        res.json({ id: session.id });

    } catch (error) {
        console.error('Stripe決済エラー:', error.message);
        res.status(500).json({ error: '決済処理に失敗しました' });
    }
});

// ========================================
// PAY.JP 決済エンドポイント
// ========================================

// 都度課金（クローバー購入）
app.post('/create-payment', async (req, res) => {
    try {
        const { token, amount, tickets, deviceId } = req.body;
        console.log('決済リクエスト:', amount, '円', tickets, '枚');

        const charge = await payjp.charges.create({
            amount: amount,
            currency: 'jpy',
            card: token,
            description: `VOIFOR クローバー ${tickets}枚`
        });

        if (charge.paid) {
            // Supabaseでチケット追加
            const { data, error } = await supabase
                .from('users')
                .select('paid_tickets')
                .eq('device_id', deviceId)
                .single();

            if (!error && data) {
                await supabase
                    .from('users')
                    .update({ paid_tickets: (data.paid_tickets || 0) + tickets })
                    .eq('device_id', deviceId);
            }

            res.json({ success: true, chargeId: charge.id });
        } else {
            res.status(400).json({ success: false, error: '決済に失敗しました' });
        }

    } catch (error) {
        console.error('決済エラー:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 定期課金（プレミアムプラン）
app.post('/create-subscription', async (req, res) => {
    try {
        const { token, deviceId } = req.body;
        console.log('サブスク登録リクエスト');

        // 顧客作成
        const customer = await payjp.customers.create({
            card: token,
            description: `VOIFOR User: ${deviceId}`
        });

        // サブスクリプション作成（プランIDは後で設定）
        const subscription = await payjp.subscriptions.create({
            customer: customer.id,
            plan: process.env.PAYJP_PLAN_ID
        });

        // Supabaseで更新
        await supabase
            .from('users')
            .update({ 
                is_premium: true,
                premium_customer_id: customer.id,
                premium_subscription_id: subscription.id
            })
            .eq('device_id', deviceId);

        res.json({ success: true, subscriptionId: subscription.id });

    } catch (error) {
        console.error('サブスク登録エラー:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// ヘルスチェック
// ========================================
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'VOIFOR Server is running!',
        version: '2.0.0'
    });
});

// ルート
app.get('/', (req, res) => {
    res.json({ message: 'VOIFOR API Server' });
});

// サーバー起動
app.listen(PORT, () => {
    console.log('=================================');
    console.log('VOIFOR サーバー起動！');
    console.log('ポート:', PORT);
    console.log('音声認識: Google Cloud Speech');
    console.log('占い生成: Anthropic Claude');
    console.log('=================================');
});
