# 🚀 Quick Installation Guide

## Prerequisites
- Google Chrome browser
- OpenRouter API key (get one at https://openrouter.ai/)

## Step 1: Get Your API Key
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Get your API key from the dashboard

## Step 2: Configure the Extension (Optional)
The extension comes with a pre-configured API key. If you want to use your own:
1. Open `popup.js` in a text editor
2. Find this line: `const API_KEY = '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';`
3. Replace with your actual API key
4. Save the file

## Step 3: Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `tabmind` folder
5. The extension should now appear in your toolbar

## Step 4: Test It Out
1. Open any webpage
2. Click the TabMind extension icon
3. Click "What is this tab about?"
4. Wait for the AI analysis!

## Troubleshooting
- **Extension not loading?** Make sure all files are in the folder
- **API errors?** Check your OpenRouter API key and credits
- **No results?** Check the browser console for error messages

## Need Help?
- Check the main README.md for detailed documentation
- Open an issue on GitHub if you encounter problems 