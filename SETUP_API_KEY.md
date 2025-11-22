# 🔑 Gemini API Key Setup

## ⚠️ Your Previous API Key Was Leaked

Your previous API key was detected as leaked and has been disabled by Google for security reasons. Follow these steps to get your app working again.

---

## Step 1: Get a New API Key

1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the new API key (it will look like: `AIzaSy...`)

---

## Step 2: Add the API Key to Your Project

1. Open the `.env` file in your project root (it was created for you)
2. Replace `your_new_api_key_here` with your actual API key:

```
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

3. Save the file

---

## Step 3: Restart Your Dev Server

If your development server is running, restart it so it picks up the new environment variable:

```bash
npm run dev
```

---

## ✅ You're Done!

Your nutrition tracker and exercise features should now work correctly with the new API key.

---

## 🔒 Security Best Practices

- ✅ The `.env` file is now in `.gitignore` - it won't be committed to GitHub
- ✅ **NEVER** hardcode API keys in your source code
- ✅ **NEVER** commit `.env` files to git
- ⚠️ If you accidentally commit an API key, revoke it immediately and create a new one

---

## 📝 Notes

- Both **Nutrition Tracker** and **Exercise Generator** now use `gemini-2.5-flash` (the working model)
- The old experimental model `gemini-2.0-flash-exp` has been removed
