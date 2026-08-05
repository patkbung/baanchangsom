# BaanChangSom — Custom Tailoring LINE Mini App & Chatbot

BaanChangSom (บ้านช่างส้ม) is a comprehensive LINE Mini App and AI-powered Chatbot solution tailored for a bespoke tailoring and boutique storefront. It seamlessly integrates an intelligent AI assistant (powered by Google Gemini) with a sleek LINE Front-end Framework (LIFF) web application for appointment bookings and service inquiries.

## 🌟 Features

- **AI-Powered Chatbot**: Integrates Google Gemini (and Dialogflow) to handle customer inquiries, provide information about services, and assist with bookings directly within the LINE chat.
- **LIFF Web Application**: A beautiful, responsive web frontend integrated seamlessly into LINE.
  - **Service Catalog**: Browse tailoring categories (Dresses, Shirts, Pants, Alterations).
  - **Booking System**: Interactive calendar to book appointments for fittings and design consultations.
  - **Bilingual Support (TH/EN)**: The interface can switch between Thai and English instantly.
  - **Customer Profile Tracking**: A dedicated `profile.html` page where customers can track their upcoming appointments, view history, and manage their profile with full TH/EN translation support.
- **Admin Dashboard (`admin.html`)**: A comprehensive interface for shop owners to manage bookings.
  - **Month & Date Picker**: Features a month navigator and horizontal date picker for quick scheduling views.
  - **Synced Filter Tabs**: Filter appointments by date and status ("All", "Service Queue", "Done") concurrently.
  - **Bespoke Edit Modal**: Allows admins to modify appointments using a form identical to the customer booking form (dynamic name fields, duration-based time slots, and queue conflict checking).
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

To deploy the application to the internet for the LINE Webhook, you can deploy it to **Vercel**:

### Deploying to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy the project**:
   Run the following command in the root directory:
   ```bash
   vercel
   ```
   Follow the prompts to link and deploy your project.

3. **Configure Environment Variables on Vercel**:
   Go to your Vercel Dashboard -> Project Settings -> Environment Variables, and add the variables defined in your `.env` file:
   - `CHANNEL_SECRET`
   - `CHANNEL_ACCESS_TOKEN`
   - `LIFF_ID`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `N8N_WEBHOOK`

4. **Set Webhook URL in LINE Developer Console**:
   Copy the deployment URL provided by Vercel (e.g., `https://your-project.vercel.app`) and paste it into your LINE Developer Console as the Webhook URL:
   `https://your-project.vercel.app/callback`


## 📱 Screenshots & UI

The frontend is designed with a premium, mobile-first approach featuring soft gradients, glassmorphism elements, and smooth micro-animations. It operates entirely within the LINE app via LIFF, providing a native-like experience.

## 🔒 Security Note

Please ensure that sensitive files like `.env`, `dialogflow-key.json`, and any other credential files are listed in your `.gitignore` and **never** pushed to a public repository.
