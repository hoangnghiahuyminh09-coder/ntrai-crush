const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'ntrai123';

let waitingUser = null;
let pairs = {};

async function sendMessage(recipientId, text) {
  await axios.post(`https://graph.facebook.com/v22.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    recipient: { id: recipientId },
    message: { text: text }
  });
}

// Webhook verify
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Error');
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object === 'page') {
    for (const entry of body.entry) {
      const event = entry.messaging[0];
      const senderId = event.sender.id;
      const message = event.message?.text?.trim().toLowerCase();
      if (!message) continue;

      console.log(senderId, message);

      // LỆNH /CHAT
      if (message === '/chat') {
        if (pairs[senderId]) {
          await sendMessage(senderId, "Bạn đang trong phòng chat rồi. Gửi \"/thoat\" để rời khỏi.");
          continue;
        }
        if (waitingUser && waitingUser!== senderId) {
          const partner = waitingUser;
          waitingUser = null;
          pairs[senderId] = partner;
          pairs[partner] = senderId;
          await sendMessage(senderId, "🔗 Đã ghép đôi! Hãy bắt đầu trò chuyện.");
          await sendMessage(partner, "🔗 Đã ghép đôi! Hãy bắt đầu trò chuyện.");
        } else {
          waitingUser = senderId;
          // Tin nhắn y hệt PCT Crush
          await sendMessage(senderId, "⏳ Đang chờ người ghép đôi... Gửi \"/thoat\" để rời khỏi.");
        }
      }
      // LỆNH /THOAT
      else if (message === '/thoat' || message === '/end') {
        const partnerId = pairs[senderId];
        if (partnerId) {
          delete pairs[senderId];
          delete pairs[partnerId];
          await sendMessage(senderId, "Bạn đã rời khỏi phòng chat. Gõ /chat để tìm người mới.");
          await sendMessage(partnerId, "Người kia đã rời khỏi. Gõ /chat để tìm người mới.");
        } else if (waitingUser === senderId) {
          waitingUser = null;
          await sendMessage(senderId, "Bạn đã rời khỏi hàng chờ. Gõ /chat để tìm lại.");
        } else {
          await sendMessage(senderId, "Bạn chưa ghép với ai cả. Gõ /chat để bắt đầu.");
        }
      }
      // ĐANG CHAT
      else {
        const partnerId = pairs[senderId];
        if (partnerId) {
          await sendMessage(partnerId, event.message.text); // chuyển nguyên văn
        } else {
          await sendMessage(senderId, "Gõ /chat để tìm người lạ nhé!");
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.get('/', (req, res) => res.send('NTrai Crush running'));
app.listen(process.env.PORT || 10000);
