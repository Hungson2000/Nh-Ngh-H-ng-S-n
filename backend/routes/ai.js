const express = require('express');
const router = express.Router();

// ================================================================
// TƯ VẤN PHÒNG BẰNG AI (Google Gemini)
// - API key CHỈ nằm ở server (process.env.GEMINI_API_KEY), không
//   bao giờ gửi xuống frontend.
// - Route này không tự truy vấn DB: tình trạng phòng trống được
//   frontend tính sẵn (getAvailableRoomsForRange) và gửi kèm lên,
//   để tránh phải đồng bộ lại Firebase/Mongo.
// ================================================================

const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Thông tin cố định của nhà nghỉ — AI chỉ được tư vấn dựa trên dữ kiện này,
// không được bịa thêm loại phòng/giá/chính sách khác.
const HOTEL_CONTEXT = `
Bạn là trợ lý tư vấn đặt phòng của "Nhà Nghỉ Hùng Sơn" tại Thôn Vinh Sơn, Xã Hưng Lộc, Huyện Phú Lộc, Thừa Thiên Huế.
Thông tin CHÍNH XÁC (không được bịa thêm ngoài danh sách này):
- Phòng đơn: 200.000đ/đêm, phù hợp 1-2 người, tổng cộng 5 phòng.
- Phòng đôi: 350.000đ/đêm, phù hợp 2-4 người, tổng cộng 3 phòng.
- Nhận phòng: 14:00. Trả phòng: trước 12:00.
- Số điện thoại liên hệ: 0352 055 348.
Quy tắc trả lời:
- Luôn trả lời bằng tiếng Việt, ngắn gọn, thân thiện, không quá 4-5 câu.
- Nếu dữ liệu phòng trống được cung cấp, PHẢI dựa vào đó để tư vấn (không đề xuất phòng đã hết).
- Nếu thiếu thông tin để tư vấn chính xác (VD: chưa rõ ngày, số khách), hỏi lại khách 1 câu ngắn gọn.
- Không tự đặt phòng hộ khách, không xác nhận đơn — chỉ tư vấn. Nếu khách muốn đặt, hướng dẫn họ dùng form đặt phòng trên trang.
`.trim();

async function callGemini(contents) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('Server chưa cấu hình GEMINI_API_KEY');
    err.status = 500;
    throw err;
  }
  const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
 generationConfig: {
  temperature: 0.4,
  maxOutputTokens: 1024,
  thinkingConfig: { thinkingBudget: 0 }
}
    })
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => '');
    const err = new Error(`Gemini API lỗi (${resp.status}): ${errBody}`);
    err.status = 502;
    throw err;
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const err = new Error('Gemini không trả về nội dung hợp lệ');
    err.status = 502;
    throw err;
  }
  return text.trim();
}

// ===== POST /api/ai/suggest — form gợi ý nhanh =====
// body: { guests, budget, needs, checkin, checkout, availability: {"Phòng đơn": 2, "Phòng đôi": 0} }
router.post('/suggest', async (req, res) => {
  try {
    const { guests, budget, needs, checkin, checkout, availability } = req.body;

    if (!guests) {
      return res.status(400).json({ error: 'Thiếu số lượng khách (guests)' });
    }

    const availText = availability
      ? Object.entries(availability).map(([room, n]) => `${room}: còn ${n} phòng trống`).join(', ')
      : 'Chưa có dữ liệu phòng trống cho khoảng ngày này.';

    const prompt = `
Khách yêu cầu tư vấn phòng với thông tin sau:
- Số khách: ${guests}
- Ngân sách mong muốn: ${budget || 'không nêu rõ'}
- Nhu cầu thêm: ${needs || 'không có'}
- Ngày nhận phòng: ${checkin || 'chưa chọn'}
- Ngày trả phòng: ${checkout || 'chưa chọn'}
- Tình trạng phòng trống: ${availText}

Hãy tư vấn loại phòng phù hợp nhất và giải thích ngắn gọn lý do.
`.trim();

    const reply = await callGemini([
      { role: 'user', parts: [{ text: HOTEL_CONTEXT + '\n\n' + prompt }] }
    ]);

    res.json({ reply });
  } catch (err) {
    console.error('AI suggest error:', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ===== POST /api/ai/chat — chat tự do, có lưu lịch sử hội thoại =====
// body: { message, history: [{role:'user'|'model', text:'...'}], availability }
router.post('/chat', async (req, res) => {
  try {
    const { message, history, availability } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Thiếu nội dung tin nhắn (message)' });
    }

    const availText = availability
      ? '\n\nDữ liệu phòng trống hiện tại: ' +
        Object.entries(availability).map(([room, n]) => `${room}: còn ${n} phòng`).join(', ')
      : '';

    const contents = [
      { role: 'user', parts: [{ text: HOTEL_CONTEXT + availText }] },
      { role: 'model', parts: [{ text: 'Dạ vâng, em đã sẵn sàng tư vấn cho khách theo đúng thông tin trên.' }] }
    ];

    // Ghép lịch sử hội thoại trước đó (nếu có), giới hạn 10 lượt gần nhất để tránh phình prompt
    if (Array.isArray(history)) {
      history.slice(-10).forEach(h => {
        if (h && h.text && (h.role === 'user' || h.role === 'model')) {
          contents.push({ role: h.role, parts: [{ text: h.text }] });
        }
      });
    }

    contents.push({ role: 'user', parts: [{ text: message.trim() }] });

    const reply = await callGemini(contents);
    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;