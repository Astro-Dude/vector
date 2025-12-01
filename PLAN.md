# Mock Interview Feature Implementation Plan

## Overview
Create a mock interview experience with a pre-interview setup flow (rules + mic check) followed by a fullscreen interview session.

## User Flow
```
Purchase Interview Item → Start Interview → Rules Screen → Mic Check → Fullscreen Interview → Complete
```

## Phase 1: Frontend - Interview Flow Pages

### 1.1 Create Interview Setup Page (`/interview/:id/setup`)
A multi-step setup flow before the actual interview:

**Step 1: Rules Screen**
- Display interview rules:
  - Don't exit fullscreen during the interview
  - Keep your microphone enabled
  - Answer each question within the time limit
  - No external help or resources
- Checkbox to acknowledge rules
- "Continue" button (disabled until acknowledged)

**Step 2: Mic Check**
- Request microphone permission
- Show audio level indicator (visual feedback of mic input)
- Play back a short recording to verify quality
- "Test Microphone" button
- Status indicators: ✓ Microphone detected, ✓ Audio level OK
- "Continue to Interview" button (disabled until mic verified)

### 1.2 Create Interview Session Page (`/interview/:id/session`)
The actual fullscreen interview experience:

**Layout:**
- Fullscreen mode (with exit warning)
- Timer display (per question + total)
- Question display area
- Audio recording indicator
- Navigation: Previous / Next / Submit
- Progress indicator (Question 3 of 10)

**Features:**
- Detect fullscreen exit and show warning modal
- Record audio for each answer
- Auto-save progress
- Submit interview when complete

### 1.3 Create Interview Complete Page (`/interview/:id/complete`)
- Summary of completed interview
- Option to review (if enabled)
- Return to home button

## Phase 2: New Components

### 2.1 `MicCheck.tsx`
- Uses Web Audio API for mic access
- Visual audio level meter
- Recording test functionality
- Permission handling with error states

### 2.2 `RulesSheet.tsx`
- Displays rules list with icons
- Acknowledgment checkbox
- Matches existing theme (dark, glassmorphism)

### 2.3 `FullscreenHandler.tsx`
- Manages fullscreen API
- Detects exit attempts
- Shows warning modal

### 2.4 `QuestionCard.tsx`
- Displays interview question
- Timer component
- Recording status indicator

### 2.5 `AudioRecorder.tsx`
- Handles MediaRecorder API
- Visual recording indicator
- Saves audio blobs

## Phase 3: Backend - Interview Session API

### 3.1 New Model: `InterviewSession`
```typescript
{
  user: ObjectId (ref: User)
  item: ObjectId (ref: Item)  // The purchased interview item
  purchase: ObjectId (ref: Purchase)
  status: 'setup' | 'in_progress' | 'completed' | 'abandoned'
  startedAt: Date
  completedAt: Date
  questions: [{
    questionId: ObjectId
    audioUrl: String  // S3/storage URL
    duration: Number  // seconds
    answeredAt: Date
  }]
  totalDuration: Number
  rulesAccepted: Boolean
  micCheckPassed: Boolean
}
```

### 3.2 New Model: `InterviewQuestion`
```typescript
{
  title: String
  description: String
  category: String  // 'behavioral', 'technical', 'situational'
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit: Number  // seconds
  isActive: Boolean
}
```

### 3.3 New API Endpoints
- `POST /api/interview/start/:purchaseId` - Start a new interview session
- `GET /api/interview/session/:sessionId` - Get session details
- `PUT /api/interview/session/:sessionId/rules` - Mark rules accepted
- `PUT /api/interview/session/:sessionId/mic-check` - Mark mic check passed
- `POST /api/interview/session/:sessionId/answer` - Submit answer (audio upload)
- `PUT /api/interview/session/:sessionId/complete` - Mark interview complete
- `GET /api/interview/questions` - Get interview questions (admin)
- `POST /api/interview/questions` - Create question (admin)

## Phase 4: Routing Updates

### 4.1 Add Routes in `App.tsx`
```tsx
<Route path="/interview/:id/setup" element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
<Route path="/interview/:id/session" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
<Route path="/interview/:id/complete" element={<ProtectedRoute><InterviewComplete /></ProtectedRoute>} />
```

## Phase 5: Integration

### 5.1 Update Home Page
- Add "Start Interview" button on purchased interview items
- Navigate to `/interview/:purchaseId/setup`

### 5.2 Audio Storage
- Option 1: Store audio as base64 in MongoDB (simple, limited size)
- Option 2: Upload to cloud storage (S3, Cloudinary) - recommended for production

## UI/Theme Consistency

All new components will follow the existing theme:
- **Background**: `bg-black`, `bg-white/5`
- **Borders**: `border border-white/10`
- **Text**: `text-white`, `text-white/60`, `text-white/80`
- **Accent**: `text-green-400` for success/CTA
- **Cards**: Glassmorphism with `backdrop-blur-xl`
- **Buttons**: White bg with black text for primary, transparent for secondary
- **Rounded corners**: `rounded-lg`, `rounded-xl`, `rounded-2xl`
- **Transitions**: `transition-all duration-300`

## File Structure
```
frontend/src/
├── pages/
│   └── interview/
│       ├── InterviewSetup.tsx
│       ├── InterviewSession.tsx
│       └── InterviewComplete.tsx
├── components/
│   └── interview/
│       ├── RulesSheet.tsx
│       ├── MicCheck.tsx
│       ├── FullscreenHandler.tsx
│       ├── QuestionCard.tsx
│       └── AudioRecorder.tsx

backend/src/
├── models/
│   ├── InterviewSession.ts
│   └── InterviewQuestion.ts
├── routes/
│   └── interview.ts
```

## Implementation Order
1. Create RulesSheet component
2. Create MicCheck component with audio level visualization
3. Create InterviewSetup page combining both
4. Create backend models and routes
5. Create InterviewSession page with fullscreen handling
6. Create QuestionCard and AudioRecorder components
7. Create InterviewComplete page
8. Integrate with Home page
9. Test full flow

## Questions to Clarify
- [ ] Should camera also be checked (video interview)?
- [ ] Where should audio recordings be stored?
- [ ] Should there be a time limit per question?
- [ ] How are questions assigned to interviews?
- [ ] Is there mentor review after completion?
