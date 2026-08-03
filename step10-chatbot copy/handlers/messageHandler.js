import axios from 'axios';
import { createProductCard, createBookingLiffCard } from '../messages/flexMenu.js';
import {
  askGemini,
  clearChatHistory,
  isGeminiConfigured,
} from '../services/geminiService.js';
import { detectIntent } from '../services/dialogflowService.js';

// ฟังก์ชันส่งข้อความไปยัง n8n Webhook
async function sendToN8n(event) {
  try {
    await axios.post(process.env.N8N_WEBHOOK, {
      events: [event]
    });
    console.log('[n8n] Sent event to webhook successfully');
  } catch (error) {
    console.error('[n8n] Error sending to webhook:', error.message);
  }
}

// ฟังก์ชันแปลง google.protobuf.Value เป็น JSON
function decodeProtobufValue(value) {
  if (!value) return null;
  if ('nullValue' in value || value.kind === 'nullValue') return null;
  if ('numberValue' in value || value.kind === 'numberValue') return value.numberValue;
  if ('stringValue' in value || value.kind === 'stringValue') return value.stringValue;
  if ('boolValue' in value || value.kind === 'boolValue') return value.boolValue;
  if ('structValue' in value || value.kind === 'structValue') return decodeProtobufStruct(value.structValue);
  if ('listValue' in value || value.kind === 'listValue') {
    const list = value.listValue;
    if (!list || !list.values) return [];
    return list.values.map(decodeProtobufValue);
  }
  return value;
}

// ฟังก์ชันแปลง google.protobuf.Struct เป็น JSON Object
function decodeProtobufStruct(struct) {
  if (!struct) return null;
  if (struct.fields && typeof struct.fields === 'object') {
    const result = {};
    for (const key of Object.keys(struct.fields)) {
      result[key] = decodeProtobufValue(struct.fields[key]);
    }
    return result;
  }
  return struct;
}

const COMMANDS = {
  ช่วยเหลือ: () => [
    {
      type: 'text',
      text: [
        'คำสั่งที่ใช้ได้:',

        '• ถาม <คำถาม> — ถาม Gemini AI',
        '• ai <คำถาม> — ถาม Gemini AI (ภาษาอังกฤษ)',
        '• ล้าง — ล้างประวัติการสนทนากับ AI',
        '• ช่วยเหลือ — แสดงคำสั่งนี้',
      ].join('\n'),
    },
  ],
  จองทัวร์: () => [createBookingLiffCard()],
  'จอง One Day Trip': () => [createBookingLiffCard()],
  'จอง 2 วัน 1 คืน': () => [createBookingLiffCard()],
  'จอง 3 วัน 2 คืน': () => [createBookingLiffCard()],
  ล้าง: () => [{ type: 'text', text: 'ล้างประวัติแล้ว — เริ่มคุยกับ AI ใหม่ได้' }],
};

const AI_PREFIXES = ['ถาม ', 'ai ', 'AI '];

function extractAiQuestion(text) {
  for (const prefix of AI_PREFIXES) {
    if (text.startsWith(prefix)) {
      return text.slice(prefix.length).trim();
    }
  }
  return null;
}

const IGNORED_KEYWORDS = [
  'โปรโมชัน',
  'ดูโปรคู่รัก ลด 10%',
  'โปรกลุ่ม',
  'รีวิวจากลูกค้า',
  // 'children_policy',
  // 'เด็กสามารถไปได้ไหม',
  // 'change_traveler',
  // 'ให้คนอื่นไปแทนได้ไหม',
  // 'change_date',
  // 'จองแล้วเปลี่ยนวันได้ไหม',
  // 'refund_policy',
  // 'ยกเลิกแล้วได้เงินคืนไหม',
  'รีวิวจากลูกค้า',
  'แพ็กเกจทัวร์',
  'ดูโปรวันเกิด รับส่วนลด 1,000'
  // 'จอง One Day Trip'
  // 'จอง 2 วัน 1 คืน',
  // 'จอง 3 วัน 2 คืน',
];

export async function handleMessage(client, event) {
  // 1. ถ้าไม่ใช่ข้อความประเภท text (เช่น เป็น sticker, image) ให้ส่งไปให้ n8n เลย
  if (event.message.type !== 'text') {
    console.log('[Bot] Non-text event, routing to n8n');
    sendToN8n(event);
    return null;
  }

  const userId = event.source.userId ?? 'anonymous';
  const text = event.message.text.trim();

  // ป้องกันการตอบซ้ำกับข้อความตอบกลับอัตโนมัติ (Auto-response) ของ LINE Business
  if (IGNORED_KEYWORDS.includes(text)) {
    console.log(`[Bot] Ignored keyword matched: "${text}". Letting LINE Business reply.`);
    return null;
  }

  // 2. เช็กคำสั่งด่วนในระบบก่อน (Local Commands)
  if (text === 'ล้าง') {
    clearChatHistory(userId);
  }

  // ดึงชื่อผู้ใช้และทักทายเมื่อพิมพ์ "สวัสดี"
  if (text === 'สวัสดี') {
    let displayName = '';
    if (userId && userId !== 'anonymous') {
      try {
        const profile = await client.getProfile(userId);
        displayName = profile.displayName || '';
      } catch (err) {
        console.error('[Profile] Error getting profile:', err.message);
      }
    }
    const replyText = displayName ? `สวัสดีครับ คุณ ${displayName}` : 'สวัสดีครับ';
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: replyText }],
    });
  }

  const buildMessages = COMMANDS[text];
  if (buildMessages) {
    console.log(`[Bot] Matched local command: ${text}`);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: buildMessages(),
    });
  }

  // 2.7 เช็กการถามหา "อ.วุฒิพงษ์ ชินศรี" หรือ "อ.เณร" เพื่อตอบกลับด้วย AI (Gemini) ทันที
  if (text.includes('อ.วุฒิพงษ์ ชินศรี') || text.includes('อ.เณร') || text.includes('วุฒิพงษ์ ชินศรี')) {
    console.log(`[Bot] Query related to "อ.วุฒิพงษ์ ชินศรี" / "อ.เณร" detected. Routing to Gemini.`);
    return replyWithGemini(client, event, userId, text);
  }

  // 2.9 เช็กข้อความที่มี AI Prefix (เช่น ถาม, ai, AI) เพื่อส่งให้ Gemini AI ตอบกลับโดยตรง
  const aiQuestion = extractAiQuestion(text);
  if (aiQuestion !== null) {
    console.log(`[Bot] AI Prefix matched: "${text}". Routing directly to Gemini.`);
    return replyWithGemini(client, event, userId, aiQuestion);
  }

  // 3. ยิงเช็กกับ Dialogflow
  console.log(`[Dialogflow] Analyzing message: "${text}"`);
  const queryResult = await detectIntent(text, userId);
  const intentName = queryResult?.intent?.displayName;

  // ถ้าเจอ Intent จริงใน Dialogflow และไม่ใช่ Fallback
  if (intentName && intentName !== 'Default Fallback Intent') {
    const messagesToSend = [];

    // ดึงข้อความตอบกลับทั้งหมดจาก Dialogflow (รองรับทั้ง Text และ Custom Payload)
    if (queryResult.fulfillmentMessages && queryResult.fulfillmentMessages.length > 0) {
      for (const msg of queryResult.fulfillmentMessages) {
        // กรณีเป็น Text Message
        if (msg.message === 'text' && msg.text && msg.text.text && msg.text.text[0]) {
          messagesToSend.push({
            type: 'text',
            text: msg.text.text[0],
          });
        }
        // กรณีเป็น Custom Payload
        else if (msg.message === 'payload' && msg.payload) {
          const decodedPayload = decodeProtobufStruct(msg.payload);
          if (decodedPayload && decodedPayload.line) {
            // รองรับกรณี payload.line เป็น Array หรือเป็น Object เดี่ยว
            if (Array.isArray(decodedPayload.line)) {
              messagesToSend.push(...decodedPayload.line);
            } else if (typeof decodedPayload.line === 'object') {
              messagesToSend.push(decodedPayload.line);
            }
          }
        }
      }
    }

    if (messagesToSend.length > 0) {
      console.log(`[Dialogflow] Matched intent: "${intentName}". Sending ${messagesToSend.length} messages.`);
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: messagesToSend,
      });
    }
  }

  // 4. หากเป็น Fallback Intent (วิเคราะห์ไม่เจอ) หรือเกิดข้อผิดพลาด (คำถามทั่วไป)
  // ให้เชื่อมต่อกับ Generative AI เพื่อตอบกลับผู้ใช้
  console.log('[Bot] Intent not matched or fallback (general question). Replying with Gemini.');
  return replyWithGemini(client, event, userId, text);
}

async function showAiLoading(client, userId) {
  if (!userId || userId === 'anonymous') return;

  try {
    await client.showLoadingAnimation({
      chatId: userId,
      loadingSeconds: 20,
    });
  } catch (err) {
    console.warn('[loading]', err.message);
  }
}

async function replyWithGemini(client, event, userId, question) {
  if (!question) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: 'กรุณาพิมพ์คำถามหลังคำว่า "ถาม" เช่น ถาม อธิบาย webhook' }],
    });
  }

  if (!isGeminiConfigured()) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน .env\nขอ key ได้ที่ https://aistudio.google.com/apikey',
        },
      ],
    });
  }

  try {
    await showAiLoading(client, userId);
    const answer = await askGemini(userId, question);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: answer }],
    });
  } catch (err) {
    console.error('[Gemini]', err);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: 'ขออภัย AI ตอบไม่ได้ในขณะนี้ ลองใหม่อีกครั้งหรือตรวจ API Key',
        },
      ],
    });
  }
}
