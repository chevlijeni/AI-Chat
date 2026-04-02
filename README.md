# Jeni AI Chat

A modern, multi-threaded AI chat application built with Node.js, Express, TypeScript, MySQL, and Google Gemini 2.5 Flash.

**🔗 [Check the Live URL](https://ai-chat-jeni.onrender.com)**

## Features
- **Dynamic Multi-Threaded Chat:** Create multiple distinct chat sessions.
- **Edit and Regenerate:** Modify past prompts to organically branch AI conversation timelines.
- **Persistent Storage:** MySQL database securely holds user accounts and chat histories.
- **GitHub OAuth Login:** Secure user authentication via GitHub.
- **Stunning UI:** Fully responsive glassmorphism dark-theme with SweetAlert2 interactions.

## Prerequisites
Before cloning this project, ensure you have installed:
- [Node.js](https://nodejs.org/) (v20 or higher)
- [MySQL Server](https://dev.mysql.com/downloads/) (Running locally on your computer, or remotely)
- A [GitHub Developer Account](https://github.com/settings/developers) (to get GitHub OAuth App Credentials)
- A [Google AI Studio](https://aistudio.google.com/) account (to get a Gemini API Key)

## Complete Setup Guide

### 1. Clone & Install
```bash
git clone https://github.com/chevlijeni/AI-Chat.git
cd AI-Chat
npm install
```

### 2. Database Setup
You just need to create the empty database container. The backend Node server will automatically build the tables (`users`, `chat_sessions`, `chat_history`) on its first boot!
Log into your MySQL server (via phpMyAdmin or your terminal) and run:
```sql
CREATE DATABASE ai_chat;
```

### 3. Environment Variables
Copy the example environment template to create your secure configuration file:
```bash
cp .env.example .env
```
Open `.env` in a text editor and fill in your sensitive credentials:
- **`GEMINI_API_KEY`**: Your Gemini API Key.
- **`DB_PASSWORD`**: The password for your MySQL user.
- **`GITHUB_CLIENT_ID`** & **`GITHUB_CLIENT_SECRET`**: Created from your GitHub OAuth App (*Ensure your callback URI is exactly `http://localhost:3000/auth/github/callback`*).

### 4. Run the Server
```bash
# For local development (auto-restarts on save)
npm run dev

# For production deployment
npm run build
npm start
```
Open `http://localhost:3000` in your web browser. The app is ready!

