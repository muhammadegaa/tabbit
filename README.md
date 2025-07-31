# 🧠 TabMind Chrome Extension

**AI-powered tab analysis to understand your browsing intent and next actions**

## 🎯 Problem & Solution

**Problem:** Many people open dozens of tabs throughout their day but forget:
- Why they opened each tab
- What they were planning to do  
- What project it was for

This leads to confusion, task delays, and a massive productivity leak—especially in creative, knowledge, and solo work.

**Solution:** TabMind is a Chrome extension that lets users click one button—"What is this tab about?"—and it uses an LLM (via OpenRouter) to automatically infer and return:
- The intent (why they opened the tab)
- The project it likely relates to
- The next best action they should take

## ✨ Features

- **One-click Analysis**: Click "What is this tab about?" to get instant insights
- **AI-Powered Insights**: Uses Claude 3.5 Sonnet via OpenRouter for intelligent analysis
- **Local Storage**: All analyses are stored locally in your browser
- **History View**: Browse your recent tab analyses
- **Page Content Extraction**: Automatically extracts relevant content from web pages
- **Clean, Modern UI**: Beautiful gradient design with smooth animations

## 🚀 Installation

### For Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tabmind
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `tabmind` folder

### For Production

1. Download the extension files
2. Follow steps 3-4 above to load in Chrome

## 🔧 Configuration

### API Key Setup

The extension is pre-configured with an OpenRouter API key. If you need to use your own key:
1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Open `popup.js` and replace the `API_KEY` constant:
   ```javascript
   const API_KEY = 'your_actual_api_key_here';
   ```

### Model Configuration

You can change the LLM model by modifying the `DEFAULT_MODEL` constant in `popup.js`:
```javascript
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet'; // or any other OpenRouter model
```

## 📖 Usage

1. **Open any webpage** in Chrome
2. **Click the TabMind extension icon** in your toolbar
3. **Click "What is this tab about?"** button
4. **View the analysis results**:
   - **Intent**: Why you likely opened this tab
   - **Project**: What project or context this relates to
   - **Next Action**: What you should do next
5. **Browse history** by clicking on recent analyses

## 🏗️ Architecture

```
tabmind/
├── manifest.json          # Extension manifest (Manifest v3)
├── popup.html            # Popup UI interface
├── popup.js              # Main popup logic (compiled from TypeScript)
├── background.js         # Background service worker
├── src/                  # TypeScript source files
│   ├── types.ts          # Type definitions
│   ├── api.ts            # OpenRouter API integration
│   ├── storage.ts        # Chrome storage management
│   └── popup.ts          # Main popup logic
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🔌 API Integration

The extension integrates with OpenRouter's API to provide intelligent tab analysis:

- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Model**: Claude 3.5 Sonnet (configurable)
- **Prompt**: Structured prompt requesting JSON response with intent, project, and next action
- **Storage**: All analyses stored locally using `chrome.storage.local`

## 🛠️ Development

### Prerequisites
- Node.js (v16 or higher)
- Chrome browser
- OpenRouter API key

### Development Commands
```bash
npm install          # Install dependencies
npm run build        # Build TypeScript files
npm run watch        # Watch for changes and rebuild
npm run dev          # Build and watch for changes
```

### File Structure
- **TypeScript files** in `src/` directory
- **Compiled JavaScript** files in root for immediate use
- **Manifest v3** configuration for modern Chrome extension features

### Key Components

1. **Popup Interface** (`popup.html` + `popup.js`)
   - Main user interface
   - Handles button clicks and displays results
   - Manages loading states and error handling

2. **API Service** (`src/api.ts`)
   - Communicates with OpenRouter API
   - Extracts page content using content scripts
   - Handles API response parsing and validation

3. **Storage Service** (`src/storage.ts`)
   - Manages local storage of analysis records
   - Handles history and data persistence
   - Implements data cleanup and limits

4. **Background Service** (`background.js`)
   - Handles extension lifecycle events
   - Manages message passing between components
   - Sets up initial storage structure

## 🔒 Privacy & Security

- **Local Storage**: All data stored locally in your browser
- **No Server**: No data sent to external servers except OpenRouter API
- **Minimal Permissions**: Only requests necessary Chrome extension permissions
- **Content Extraction**: Only extracts text content, no sensitive data

## 🐛 Troubleshooting

### Common Issues

1. **API Key Error**
   - Ensure you've replaced the test API key with a real OpenRouter key
   - Check that your OpenRouter account has sufficient credits

2. **Extension Not Loading**
   - Verify all files are present in the extension directory
   - Check Chrome's extension page for error messages
   - Ensure "Developer mode" is enabled

3. **Content Script Errors**
   - Some websites may block content script injection
   - The extension will continue without page content if extraction fails

4. **Storage Issues**
   - Clear extension data in Chrome's extension settings if needed
   - Check browser console for storage-related errors

### Debug Mode

Enable debug logging by opening the extension popup and checking the browser console for detailed logs.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review Chrome extension documentation

---

**Built with ❤️ for productivity enthusiasts** # tabbit
