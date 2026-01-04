# Emory Major Planner

A web application to help Emory University students plan their majors, track degree progress, and explore academic pathways.

![Emory Major Planner](https://img.shields.io/badge/Emory-Major%20Planner-004990?style=for-the-badge)

## Features

- 📄 **Transcript Upload** - Upload your unofficial transcript (PDF/TXT) to automatically extract courses
- 📊 **Major Recommendations** - See which majors align with courses you've already taken
- 🎯 **Custom Major Tracking** - Track double majors, joint degrees, or any custom combination
- ✅ **GER Progress** - Monitor your General Education Requirements completion
- 🔒 **Privacy First** - All data processed locally in your browser

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/emory-major-planner.git
cd emory-major-planner
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "New Project" and import your repository
4. Vercel will auto-detect Vite and configure everything
5. Click "Deploy"

Your app will be live at `https://your-project-name.vercel.app`

### Deploy to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign in
3. Click "Add new site" > "Import an existing project"
4. Connect to GitHub and select your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy"

## Privacy

This application processes all transcript data locally in your browser. Your academic information is never sent to or stored on any external server. See the Privacy section in the app for more details.

## Disclaimer

This tool is for planning purposes only. Course requirements are based on the 2024-2025 catalog and may not reflect the most current requirements. Always consult with your academic advisor and refer to OPUS for official degree audits.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own university!

---

*"The wise heart seeks knowledge."* - Emory University
