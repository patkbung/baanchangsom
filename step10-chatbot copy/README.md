# BaanChangSom — Custom Tailoring LINE Mini App & Chatbot

BaanChangSom (บ้านช่างส้ม) is a comprehensive LINE Mini App and AI-powered Chatbot solution tailored for a bespoke tailoring and boutique storefront. It seamlessly integrates an intelligent AI assistant (powered by Google Gemini) with a sleek LINE Front-end Framework (LIFF) web application for appointment bookings and service inquiries.

## 🌟 Features

- **AI-Powered Chatbot**: Integrates Google Gemini (and Dialogflow) to handle customer inquiries, provide information about services, and assist with bookings directly within the LINE chat.
- **LIFF Web Application**: A beautiful, responsive web frontend integrated seamlessly into LINE.
  - **Service Catalog**: Browse tailoring categories (Dresses, Shirts, Pants, Alterations).
  - **Booking System**: Interactive calendar to book appointments for fittings and design consultations.
  - **Bilingual Support (TH/EN)**: The interface can switch between Thai and English instantly.
- **Admin Dashboard**: A dedicated interface for shop owners to view and manage customer appointments.
- **Automated Workflows**: Ready for integration with n8n for webhook automation and notifications.

## 🚀 Tech Stack

- **Backend**: Node.js, Express.js
- **AI/NLP**: Google Gemini API, Dialogflow
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, LIFF (LINE Front-end Framework)
- **Integration**: LINE Messaging API, n8n (Workflow Automation)

## 📋 Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js** (v18 or higher)
- **LINE Developer Account**:
  - A LINE Messaging API channel.
  - A LINE Login channel with LIFF app added.
- **Google Cloud/Gemini API**:
  - A Gemini API Key from Google AI Studio.
  - (Optional) Dialogflow Service Account Credentials.

## ⚙️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/patkbung/baanchangsom.git
   cd baanchangsom
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory based on `.env.example` (or configure the following variables):
   ```env
   PORT=3000
   CHANNEL_SECRET=your_line_channel_secret
   CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
   LIFF_ID=your_liff_id
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-3.1-flash-lite
   N8N_WEBHOOK=http://localhost:5678/webhook/line-chatbot
   ```

4. Place your Google Service Account key (if using Dialogflow) in the root directory and ensure it is ignored by git (`dialogflow-key.json`).

## 💻 Running the Application

To run the application in development mode with automatic restarts:
```bash
npx nodemon index.js
```
Or use:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port defined in your `.env`). 

To expose your local server to the internet for the LINE Webhook, open a new terminal and run **ngrok**:
```bash
ngrok http 3000
```
Then copy the `https://...` Forwarding URL provided by ngrok and paste it into your LINE Developer Console as the Webhook URL (e.g., `https://<your-ngrok-url>.ngrok-free.app/webhook`).

## 📱 Screenshots & UI

The frontend is designed with a premium, mobile-first approach featuring soft gradients, glassmorphism elements, and smooth micro-animations. It operates entirely within the LINE app via LIFF, providing a native-like experience.

## 🔒 Security Note

Please ensure that sensitive files like `.env`, `dialogflow-key.json`, and any other credential files are listed in your `.gitignore` and **never** pushed to a public repository.
