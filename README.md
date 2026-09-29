# n8n-nodes-washoot

Official n8n community node for [Washoot](https://washoot.com) — WhatsApp automation for WooCommerce and any business in India.

## Features

### Washoot (Action Node)
- **Send Text Message** — Send WhatsApp messages to any phone number
- **Send Media** — Send images, documents, or videos via WhatsApp
- **Create/Update Contact** — Add contacts to your Washoot CRM
- **Get Contacts** — Fetch your contact list
- **Get Sessions** — Check connected WhatsApp numbers

### Washoot Trigger
- **Message Received** — Trigger when a customer sends a WhatsApp message
- **Order Created** — Trigger on new WooCommerce order
- **Order Updated** — Trigger when order status changes
- **Abandoned Cart** — Trigger when a cart is abandoned
- **Cart Recovered** — Trigger when abandoned cart is recovered
- **Campaign Sent** — Trigger when a campaign message is sent

## Setup

### 1. Get your API key
1. Login to [washoot.com](https://washoot.com)
2. Go to **Developer → API Keys**
3. Create a new API key
4. Copy the key

### 2. Install in n8n
```bash
npm install n8n-nodes-washoot
```
Or via n8n community nodes UI: Search for **washoot**

### 3. Configure credentials
1. In n8n, go to **Credentials → New**
2. Search for **Washoot API**
3. Paste your API key
4. Save

## Example Workflows

### Send WhatsApp on WooCommerce order
```
WooCommerce Trigger (order.created) 
  → Washoot (Send Text Message)
```

### Add customer to Washoot CRM when they buy
```
WooCommerce Trigger (order.completed)
  → Washoot (Create Contact)
```

### Auto-reply to incoming WhatsApp messages
```
Washoot Trigger (message.received)
  → IF (message contains "track")
  → Washoot (Send Text: "Your order is on the way!")
```

### Sync abandoned carts to Google Sheets
```
Washoot Trigger (cart.abandoned)
  → Google Sheets (Append Row)
```

## API Reference
Full API docs: [washoot.com/docs/api](https://washoot.com/docs/api)

## Support
- Email: support@washoot.com
- Website: [washoot.com](https://washoot.com)

## License
MIT
