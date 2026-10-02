
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'ntrai123';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

app.get('/', (req,res)=> res.send('NTrai Crush Bot is running!'));

app.get('/webhook', (req,res)=>{
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if(mode && token){
    if(mode==='subscribe' && token===VERIFY_TOKEN){
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else res.sendStatus(400);
});

app.post('/webhook', async (req,res)=>{
  const body = req.body;
  if(body.object==='page'){
    for(const entry of body.entry){
      const webhook_event = entry.messaging[0];
      if(webhook_event.message && webhook_event.message.text){
        const sender_psid = webhook_event.sender.id;
        const text = webhook_event.message.text.toLowerCase();
        let reply = `Hehe bạn nói "${webhook_event.message.text}" cute thế 😏 NTrai crush bạn rồi đó!`;
        if(text.includes('hello')||text.includes('hi')||text.includes('chào')) reply = "Chào em iu 😘 Anh là NTrai đây, em cần anh thả thính gì nào?";
        if(text.includes('yêu') ) reply = "Yêu là phải nói, cũng như đói là phải ăn 😚 Em đồng ý làm người yêu anh nhé?";
        await sendMessage(sender_psid, reply);
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else res.sendStatus(404);
});

async function sendMessage(psid, text){
  try{
    await axios.post(`https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      recipient:{id:psid},
      message:{text}
    });
  } catch(e){ console.error(e.response?.data || e.message); }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));
