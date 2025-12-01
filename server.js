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

// Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
