import express from 'express'
import fetch from 'node-fetch'
import { Telegraf } from 'telegraf'
import axios from 'axios'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const INCOMING_WEBHOOK_URL = process.env.INCOMING_WEBHOOK_URL || ''
const DEFAULT_CHAT_ID = process.env.DEFAULT_CHAT_ID || ''
const PORT = Number(process.env.PORT || 4000)

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required')
  process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)
const app = express()
app.use(express.json())

let isReady = false

// Session management for service addition wizard
const activeSessions = new Map()

const WIZARD_FIELDS = [
  { key: 'name', prompt: 'Please provide the service name:', type: 'text' },
  { key: 'host', prompt: 'Now provide the host (e.g., api.example.com):', type: 'text' },
  { key: 'ip', prompt: 'Please provide the IP address:', type: 'text', validate: 'ip' },
  { key: 'group', prompt: 'What group does this service belong to?', type: 'text' },
  { key: 'sub_group', prompt: 'What sub-group?', type: 'text' },
  { key: 'icon', prompt: 'Provide an icon (emoji or identifier):', type: 'text' },
  { key: 'protocol', prompt: 'Choose the protocol:', type: 'keyboard' },
  { key: 'port', prompt: 'Finally, what port number?', type: 'text', validate: 'port' }
]

// Validation helper functions
const validateIP = (ip) => {
  if (!ip || ip.trim() === '') return false
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipPattern.test(ip)) return false
  const parts = ip.split('.')
  return parts.every(part => {
    const num = parseInt(part, 10)
    return num >= 0 && num <= 255
  })
}

const validatePort = (port) => {
  if (!port || port.trim() === '') return false
  const portNum = parseInt(port, 10)
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535
}

const validateNotEmpty = (value) => {
  return value && value.trim() !== ''
}

bot.start(async (ctx) => {
  await ctx.reply('👋 Welcome! Choose what you want to do:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🌐 Add Service to DNS', callback_data: 'service_type_dns' },
          { text: '📊 Add Service to Dashboard', callback_data: 'service_type_dashboard' }
        ]
      ]
    }
  })
})

bot.help((ctx) =>
  ctx.reply('Send me any message and I will forward it to your backend.\n\nCommands:\n/add-service - Add a new service\n/cancel - Cancel current operation')
)

// /add-service command handler (redirects to service type selection)
bot.command('add-service', async (ctx) => {
  await ctx.reply('👋 Choose what you want to do:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🌐 Add Service to DNS', callback_data: 'service_type_dns' },
          { text: '📊 Add Service to Dashboard', callback_data: 'service_type_dashboard' }
        ]
      ]
    }
  })
})

// /cancel command handler
bot.command('cancel', async (ctx) => {
  const chatId = ctx.chat.id
  
  if (activeSessions.has(chatId)) {
    activeSessions.delete(chatId)
    await ctx.reply('❌ Service addition cancelled.')
  } else {
    await ctx.reply('No active operation to cancel.')
  }
})

// Service type selection callback handler
bot.action(['service_type_dns', 'service_type_dashboard'], async (ctx) => {
  const chatId = ctx.chat.id
  const serviceType = ctx.match[0] === 'service_type_dns' ? 'dns' : 'dashboard'
  const serviceTypeLabel = serviceType === 'dns' ? 'DNS' : 'Dashboard'
  
  // Initialize new session with service type
  activeSessions.set(chatId, {
    currentStep: 0,
    data: {},
    serviceType: serviceType
  })
  
  await ctx.answerCbQuery()
  await ctx.editMessageText(`✅ Selected: Add Service to ${serviceTypeLabel}`)
  
  // Start the wizard
  const firstField = WIZARD_FIELDS[0]
  await ctx.reply(`Let's add a new ${serviceTypeLabel} service! ${firstField.prompt}\n\n(You can use /cancel at any time to stop)`)
})

// bot.on('message', async (ctx) => {
//   try {
//     const update = ctx.update

//     console.log('📩 Incoming message from', ctx.from?.id, '->', ctx.chat?.id)

//     if (INCOMING_WEBHOOK_URL) {
//       await fetch(INCOMING_WEBHOOK_URL, {
//         method: 'POST',
//         headers: { 'content-type': 'application/json' },
//         body: JSON.stringify(update)
//       })
//     }
//   } catch (err) {
//     console.error('Error handling incoming message:', err)
//   }
// })

app.get('/health', (_req, res) => {
  res.json({ ok: true, telegramConnected: isReady })
})

app.post('/send-text', async (req, res) => {
  try {
    const { chatId, text } = req.body || {}
    
    // Use provided chatId or fall back to DEFAULT_CHAT_ID
    const targetChatId = chatId || DEFAULT_CHAT_ID
    
    if (!targetChatId || !text) {
      return res.status(400).json({ 
        ok: false, 
        error: 'text is required. chatId is optional if DEFAULT_CHAT_ID is set' 
      })
    }

    const message = await bot.telegram.sendMessage(targetChatId, text)
    return res.json({ ok: true, messageId: message.message_id, chatId: targetChatId })
  } catch (err) {
    console.error('Error in /send-text:', err)
    return res.status(500).json({ ok: false, error: String(err) })
  }
})

// Inline keyboard callback handler for protocol selection
bot.action(['protocol_http', 'protocol_https'], async (ctx) => {
  const chatId = ctx.chat.id
  const session = activeSessions.get(chatId)
  
  if (!session) {
    await ctx.answerCbQuery()
    return
  }
  
  const protocol = ctx.match[0] === 'protocol_http' ? 'http' : 'https'
  session.data.protocol = protocol
  
  await ctx.answerCbQuery()
  await ctx.editMessageText(`Choose the protocol: ✅ ${protocol.toUpperCase()}`)
  
  // Move to next step
  session.currentStep++
  
  if (session.currentStep < WIZARD_FIELDS.length) {
    const nextField = WIZARD_FIELDS[session.currentStep]
    await ctx.reply(nextField.prompt)
  }
})

// Wizard message handler
bot.on('message', async (ctx) => {
  const chatId = ctx.chat.id
  const text = ctx.message?.text || ''
  
  // Check if user has an active session
  const session = activeSessions.get(chatId)
  
  if (!session) {
    // No active session - check for legacy 'add service' trigger
    const lower = text.toLowerCase()
    if (lower.includes('add service')) {
      try {
        console.log('Sending message to the homelab agent...')
        await axios.post(`${INCOMING_WEBHOOK_URL}/webhook/add-service`, {
          chat_id: ctx.chat.id,
          user_id: ctx.from.id,
          username: ctx.from.username,
          text
        })
        await ctx.reply('🧠 Got it, sending this to the homelab agent...')
      } catch (err) {
        console.error(err)
        await ctx.reply('❌ Could not reach the automation service.')
      }
    }
    return
  }
  
  // Process wizard step
  const currentField = WIZARD_FIELDS[session.currentStep]
  
  // Skip if this field uses keyboard (protocol)
  if (currentField.type === 'keyboard') {
    return
  }
  
  // Validate input
  let isValid = true
  let errorMessage = ''
  
  if (currentField.validate === 'ip') {
    isValid = validateIP(text)
    errorMessage = '❌ Invalid IP address format. Please provide a valid IP (e.g., 192.168.1.100):'
  } else if (currentField.validate === 'port') {
    isValid = validatePort(text)
    errorMessage = '❌ Invalid port number. Please provide a number between 1 and 65535:'
  } else {
    isValid = validateNotEmpty(text)
    errorMessage = '❌ This field cannot be empty. Please try again:'
  }
  
  if (!isValid) {
    await ctx.reply(errorMessage)
    return
  }
  
  // Store the value
  session.data[currentField.key] = currentField.validate === 'port' ? parseInt(text, 10) : text
  
  // Move to next step
  session.currentStep++
  
  if (session.currentStep < WIZARD_FIELDS.length) {
    const nextField = WIZARD_FIELDS[session.currentStep]
    
    if (nextField.type === 'keyboard' && nextField.key === 'protocol') {
      // Show inline keyboard for protocol
      await ctx.reply(nextField.prompt, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'HTTP', callback_data: 'protocol_http' },
              { text: 'HTTPS', callback_data: 'protocol_https' }
            ]
          ]
        }
      })
    } else {
      await ctx.reply(nextField.prompt)
    }
  } else {
    // All fields collected - send webhook
    await sendServiceDataToWebhook(ctx, session.data)
    activeSessions.delete(chatId)
  }
})

// Helper function to send collected service data to webhook
async function sendServiceDataToWebhook(ctx, serviceData) {
  const chatId = ctx.chat.id
  const session = activeSessions.get(chatId)
  const serviceType = session?.serviceType || 'unknown'
  const serviceTypeLabel = serviceType === 'dns' ? 'DNS' : serviceType === 'dashboard' ? 'Dashboard' : 'Unknown'
  
  try {
    console.log('Sending collected service data to webhook...', serviceData)
    
    // Display summary to user
    const summary = `✅ Service added successfully!\n\n` +
      `📋 Summary:\n` +
      `Service Type: ${serviceTypeLabel}\n` +
      `Name: ${serviceData.name}\n` +
      `Host: ${serviceData.host}\n` +
      `IP: ${serviceData.ip}\n` +
      `Group: ${serviceData.group}\n` +
      `Sub-group: ${serviceData.sub_group}\n` +
      `Icon: ${serviceData.icon}\n` +
      `Protocol: ${serviceData.protocol}\n` +
      `Port: ${serviceData.port}`
    
    await ctx.reply(summary)
    
    // Send to webhook
    if (INCOMING_WEBHOOK_URL) {
      await axios.post(`${INCOMING_WEBHOOK_URL}/webhook/add-service`, {
        chat_id: ctx.chat.id,
        user_id: ctx.from.id,
        username: ctx.from.username,
        service_type: serviceType,
        service: serviceData
      })
      console.log('✅ Service data sent to webhook successfully')
    } else {
      console.log('⚠️ No INCOMING_WEBHOOK_URL configured, skipping webhook call')
    }
  } catch (err) {
    console.error('Error sending service data to webhook:', err)
    await ctx.reply('⚠️ Service data collected, but failed to send to backend. Please try again or contact support.')
  }
}


process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

app.listen(PORT, () => {
  console.log(`🌐 HTTP API listening on :${PORT}`)
})

// Launch bot asynchronously after HTTP server is ready
setTimeout(async () => {
  try {
    console.log('Verifying bot token...')
    const botInfo = await bot.telegram.getMe()
    console.log(`Bot token valid: @${botInfo.username}`)
    
    console.log('Starting Telegram bot (long polling)...')
    const launchPromise = bot.launch()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Bot launch timeout - this may indicate a Telegraf library issue in this environment')), 45000)
    )
    
    await Promise.race([launchPromise, timeoutPromise])
    
    console.log('✅ Telegram bot started successfully')
    isReady = true
  } catch (err) {
    console.error('❌ Failed to start bot:', err.message)
    console.error('⚠️  HTTP API will continue running, but bot functionality is unavailable')
    
    if (err.message.includes('timeout')) {
      console.error('')
      console.error('KNOWN ISSUE: bot.launch() hangs in some Docker environments')
      console.error('Possible solutions:')
      console.error('  1. Try using webhook mode instead of long polling')
      console.error('  2. Check if another bot instance is polling with this token')
      console.error('  3. Try a different version of telegraf package')
    }
  }
}, 3000)