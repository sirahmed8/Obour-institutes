---
description: Repository Information Overview
alwaysApply: true
---

# Obour Institutes Information

## Summary
Obour Institutes is a React-based AI-powered education platform built with TypeScript and Vite. It provides an interactive learning interface for students with features including subject management, AI chatbot assistance, notifications, admin controls, and team management. The application integrates with Google Gemini AI and Firebase for authentication, data storage, and hosting.

## Structure
```
obour-institutes/
├── src/                  # React application source code
│   ├── pages/           # Route pages (Home, Admin, AIStudio, Team, Notifications, SubjectView)
│   ├── components/      # Reusable React components (layout, features, UI)
│   ├── contexts/        # React context providers (Auth, Theme, Language)
│   ├── services/        # Business logic services (Firebase, Notifications, Storage, AI)
│   ├── hooks/           # Custom React hooks (usePresence, useClickOutside)
│   ├── App.tsx          # Root component with routing
│   ├── main.tsx         # React DOM entry point
│   └── types.ts         # TypeScript type definitions
├── public/              # Static assets (favicon, logo, service workers)
├── templates/           # HTML templates for various pages
├── services/            # Top-level service files (Firebase, notifications, storage)
├── .github/             # GitHub workflows and documentation
├── .zencoder/           # Zencoder configuration
└── Configuration files  # Build, styling, and environment config
```

## Language & Runtime
**Frontend Language**: TypeScript  
**Language Version**: ^5.2.2  
**Runtime**: Node.js (Vite build tool)  
**Build System**: Vite ^5.1.4  
**Package Manager**: npm  

## Dependencies

**Main Dependencies**:
- **react** ^19.0.0 - UI library
- **react-dom** ^19.0.0 - React DOM rendering
- **react-router-dom** ^6.22.1 - Client-side routing
- **firebase** ^10.8.0 - Backend services (Auth, Firestore, Storage, Database)
- **@google/genai** * - Google Gemini AI integration
- **framer-motion** ^11.0.3 - Animation library
- **react-markdown** ^9.0.1 - Markdown rendering
- **recharts** ^2.12.0 - Chart/data visualization
- **lucide-react** ^0.344.0 - Icon library
- **react-hot-toast** ^2.4.1 - Toast notifications
- **react-helmet-async** ^2.0.4 - Document head management

**Development Dependencies**:
- **@vitejs/plugin-react** ^4.2.1 - Vite React plugin
- **typescript** ^5.2.2 - Type checking
- **tailwindcss** ^3.4.1 - Utility-first CSS framework
- **postcss** ^8.4.35 - CSS transformation
- **autoprefixer** ^10.4.17 - Vendor prefix automation
- **@types/react** ^19.0.0 - React type definitions
- **@types/react-dom** ^19.0.0 - React DOM type definitions

**Backend Dependencies** (Python):
- **Flask** 3.0.0 - Web framework
- **Flask-SQLAlchemy** 3.1.1 - ORM/database toolkit
- **werkzeug** 3.0.1 - WSGI utilities

## Build & Installation

**Install dependencies**:
```bash
npm install
```

**Development server**:
```bash
npm run dev
```

**Production build**:
```bash
npm run build
```

**Code linting**:
```bash
npm run lint
```

**Preview production build**:
```bash
npm run preview
```

## Docker
No Docker configuration found in the repository.

## Configuration

**Vite Configuration**: `vite.config.ts`
- React plugin enabled
- Production: drops console/debugger statements
- Code splitting: vendor (React), firebase (Firebase libs), ui (animations/charts)
- Alias: `react-is` shimmed to avoid compatibility issues

**Tailwind CSS**: `tailwind.config.js`
- Custom color palette (indigo, emerald, dark mode)
- Custom animations (breath, shine, ring-pulse)
- Dark mode support via class strategy

**TypeScript**: `tsconfig.json`
- Target: ES2022
- Module: ESNext
- Path alias: `@/*` maps to root
- JSX: react-jsx

**Firebase Hosting**: `firebase.json`
- Public directory: `dist/` (build output)
- Single Page App rewrite to `/index.html`
- CORS header set to allow same-origin popups

## Main Entry Points

**Frontend**:
- **main.tsx**: React DOM entry point - initializes root component
- **App.tsx**: Root component with routing (HashRouter) and authentication context
- **index.html**: HTML template
- Routes: Home, SubjectView, Admin, Notifications, AIStudio, Team

**Backend**:
- **app.py**: Python Flask application entry point (minimal/placeholder)

## Services & Integration

**Firebase Services** (configured in `services/firebase.ts`):
- Authentication
- Firestore (database)
- Storage (file uploads)
- Realtime Database
- Firebase Messaging (notifications)

**External APIs**:
- Google Gemini AI for chatbot/AI features
- Firebase Admin SDKs for backend operations

## Testing
No testing framework configured (no Jest, Vitest, or similar test runners found).

## Environment Configuration
Environment variables are defined via `.env` and can be referenced in `vite.config.ts`. The project uses:
- `GEMINI_API_KEY` - Google Gemini API key (documented in README)
- `API_KEY` - Generic API key (referenced in Vite config)
