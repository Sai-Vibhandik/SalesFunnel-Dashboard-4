# Task Workflow System Documentation

## Overview

The system has two production pipelines for task assignment and workflow:

1. **Creative Production Pipeline** - For ads, creatives, images, videos
2. **Landing Page Production Pipeline** - For landing pages

---

## Creative Production Pipeline

```
CONTENT_CREATOR → TESTER → GRAPHIC_DESIGNER/VIDEO_EDITOR → TESTER → PERFORMANCE_MARKETER
```

### Workflow States

| Stage | Status | assignedRole | Next Action |
|-------|--------|--------------|-------------|
| 1. Content Creation | `content_pending` | `content_creator` | Content Creator starts working |
| 2. Content Submitted | `content_submitted` | `tester` | Content Creator submits |
| 3. Content Approved | `content_approved` | `performance_marketer` | Tester approves |
| 4. Content Final Approved | `content_final_approved` | `graphic_designer` / `video_editor` | Marketer approves |
| 5. Design Pending | `design_pending` | `graphic_designer` / `video_editor` | Designer starts working |
| 6. Design Submitted | `design_submitted` | `tester` | Designer submits |
| 7. Design Approved | `design_approved` | `performance_marketer` | Tester approves |
| 8. Final Approved | `final_approved` | - | Marketer approves |

### Rejection Flow

| Current Status | Rejected Status | Returns To |
|---------------|-----------------|------------|
| `content_submitted` | `content_rejected` | Content Creator |
| `content_approved` | `content_rejected` | Content Creator |
| `design_submitted` | `design_rejected` | Graphic Designer / Video Editor |
| `design_approved` | `design_rejected` | Graphic Designer / Video Editor |

### Task Assignment

When creative strategy is completed, tasks are generated:
1. **Content Task** - Assigned to `content_creator` with status `content_pending`
2. **Design Task** - Assigned to `graphic_designer` or `video_editor` (based on `assignedRole` in creative plan) with status `design_pending`

The design task remains inactive until content is approved.

---

## Landing Page Production Pipeline

```
UI_UX_DESIGNER → TESTER → PERFORMANCE_MARKETER → DEVELOPER → TESTER → PERFORMANCE_MARKETER
```

### Workflow States

| Stage | Status | assignedRole | Next Action |
|-------|--------|--------------|-------------|
| 1. Design Pending | `design_pending` | `ui_ux_designer` | UI/UX Designer starts working |
| 2. Design Submitted | `design_submitted` | `tester` | Designer submits |
| 3. Design Approved | `design_approved` | `performance_marketer` | Tester approves |
| 4. Development Pending | `development_pending` | `developer` | Marketer approves |
| 5. Development Submitted | `development_submitted` | `tester` | Developer submits |
| 6. Development Approved | `development_approved` | `performance_marketer` | Tester approves |
| 7. Final Approved | `final_approved` | - | Marketer approves |

### Rejection Flow

| Current Status | Rejected Status | Returns To |
|---------------|-----------------|------------|
| `design_submitted` | `design_rejected` | UI/UX Designer |
| `design_approved` | `design_rejected` | UI/UX Designer |
| `development_submitted` | `development_pending` | Developer |
| `development_approved` | `development_pending` | Developer |

### Task Generation

When landing page strategy is completed:
1. **Design Task** - Assigned to `ui_ux_designer` with status `design_pending`
2. **Development Task** - Assigned to `developer` with status `development_pending`

Development task becomes active only after design is approved by marketer.

---

## API Endpoints

### Task Management

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/tasks/my-tasks` | GET | Get tasks assigned to current user | All authenticated |
| `/api/tasks/my-role-tasks` | GET | Get tasks for current user's role | All authenticated |
| `/api/tasks/by-role/:role` | GET | Get tasks by role | All authenticated |
| `/api/tasks/project/:projectId` | GET | Get all tasks for a project | Project team |
| `/api/tasks/:taskId` | GET | Get single task | Project team |
| `/api/tasks/:taskId` | PUT | Update task | Assigned user |
| `/api/tasks/:taskId/assign` | PUT | Assign task to user | Admin, Performance Marketer |
| `/api/tasks/:taskId/tester-review` | PUT | Tester approve/reject | Tester, Admin |
| `/api/tasks/:taskId/marketer-review` | PUT | Marketer approve/reject | Performance Marketer, Admin |
| `/api/tasks/:taskId/files` | POST | Upload files to task | Assigned user |
| `/api/tasks/generate/:projectId` | POST | Generate tasks from strategy | Admin |

### Dashboard Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/tasks/pending-review` | GET | Tasks pending tester review | Tester, Admin |
| `/api/tasks/pending-marketer-approval` | GET | Tasks pending marketer approval | Performance Marketer, Admin |
| `/api/tasks/team-members` | GET | Get available team members | All authenticated |

---

## Task Status Transitions

### Creative Tasks (Content Creation Flow)

```
content_pending → content_submitted → content_approved → content_final_approved → design_pending
                        ↓ content_rejected ← content_approved
                        ↓
                   content_submitted (resubmit)
```

### Creative Tasks (Design Flow)

```
design_pending → design_submitted → design_approved → final_approved
                     ↓ design_rejected
                     ↓
                design_submitted (resubmit)
```

### Landing Page Tasks (Design Flow)

```
design_pending → design_submitted → design_approved → development_pending
                     ↓ design_rejected
                     ↓
                design_submitted (resubmit)
```

### Landing Page Tasks (Development Flow)

```
development_pending → development_submitted → development_approved → final_approved
                            ↓ rejection
                            ↓
                      development_pending
```

---

## Notification Events

| Event | Recipient | Message |
|-------|-----------|---------|
| Task Assigned | Assigned user | "You have been assigned a new task for project X" |
| Task Submitted | Tester | "A task has been submitted for your review" |
| Content Approved (Tester) | Performance Marketer | "Content is ready for your approval" |
| Content Approved (Marketer) | Graphic Designer / Video Editor | "Content approved. Design task assigned." |
| Design Approved (Tester) | Performance Marketer | "Design is ready for your approval" |
| Task Rejected | Assigned user | "Your task has been rejected. Please review feedback." |
| Task Approved (Final) | Assigned user | "Your work has been fully approved and is ready for deployment." |

---

## Database Schema

### Task Model Key Fields

```javascript
{
  projectId: ObjectId,
  taskType: String, // 'content_creation', 'graphic_design', 'video_editing', 'landing_page_design', 'landing_page_development'
  assetType: String, // 'image_creative', 'video_creative', etc.
  taskTitle: String,

  assignedTo: ObjectId, // User ID
  assignedRole: String, // 'content_creator', 'graphic_designer', 'video_editor', 'ui_ux_designer', 'developer', 'tester', 'performance_marketer'

  status: String, // See status enums above

  // Content Creator fields
  contentLink: String,
  contentFile: Object,
  contentNotes: String,

  // Designer fields
  creativeLink: String,
  reviewNotes: String,

  // UI/UX Designer fields
  designLink: String,
  designFile: Object,
  designNotes: String,

  // Developer fields
  implementationUrl: String,
  repoLink: String,
  devNotes: String,

  // Review fields
  rejectionNote: String,
  rejectionReason: String,
  reviewedBy: ObjectId,
  testerReviewedBy: ObjectId,
  marketerApprovedBy: ObjectId
}
```

---

## Role-Based Dashboard Views

### Content Creator Dashboard
- Shows tasks with `assignedRole: 'content_creator'` and status `content_pending` or `content_rejected`
- Can submit content via `contentLink`, `contentFile`, `contentNotes`

### Graphic Designer / Video Editor Dashboard
- Shows tasks with `assignedRole: 'graphic_designer'` or `'video_editor'` and status `design_pending` or `design_rejected`
- Can submit creative via `creativeLink`, `reviewNotes`

### UI/UX Designer Dashboard
- Shows tasks with `assignedRole: 'ui_ux_designer'` and status `design_pending` or `design_rejected`
- Can submit design via `designLink`, `designFile`, `designNotes`

### Developer Dashboard
- Shows tasks with `assignedRole: 'developer'` and status `development_pending`
- Can submit implementation via `implementationUrl`, `repoLink`, `devNotes`

### Tester Dashboard
- Shows tasks with status `content_submitted`, `design_submitted`, or `development_submitted`
- Can approve or reject with notes

### Performance Marketer Dashboard
- Shows tasks with status `content_approved`, `design_approved`, or `development_approved`
- Can approve or reject with notes

---

## Task Generation Flow

1. **Creative Strategy Completed**
   - For each creative plan item, create:
     - Content task (assigned to content_creator)
     - Design task (assigned to graphic_designer or video_editor)

2. **Landing Page Completed**
   - For each landing page, create:
     - Design task (assigned to ui_ux_designer)
     - Development task (assigned to developer, pending until design approved)

3. **Notifications Sent**
   - Each assigned user receives notification about new tasks