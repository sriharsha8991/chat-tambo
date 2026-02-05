
# Agentic Generative UI for Zoho People

### A Persona-Aware, Intent-Driven HR Experience

---

## 1. Background & Initial Pain Point

Enterprise HR tools are powerful but cognitively overwhelming.
One such tool is **Zoho People**, widely used for attendance, leave, onboarding, performance, and compliance.

### Real, daily pain (lived experience)

* Users repeatedly **search how to perform simple actions**
* Same task appears in **multiple places**
* Users forget **daily check-in / check-out**
* Employees, managers, and HR see **the same complex UI**
* Productivity loss due to **navigation, not work**

> The problem is not lack of features.
> The problem is **users must learn the software instead of completing tasks**.

---

## 2. Problem Statement

> **HR platforms like Zoho People expose features through complex, module-driven interfaces that force users to constantly search *where* to perform routine actions, leading to frustration, errors, and wasted time.**

This problem is especially visible in:

* attendance regularization
* leave approvals
* profile updates
* onboarding & document uploads

---

## 3. Key Insight

> **Humans think in goals and tasks.
> Zoho People is designed in modules and settings.**

This mismatch creates friction.

### Example:

User intent:

> “I forgot to check out yesterday”

System response today:

> “Go to Attendance → Regularization → Select Date → Submit → Track”

This is unnecessary cognitive load.

---

## 4. Design Philosophy

### What we do NOT want

* Chatbots that explain where to click
* Free-form AI generating UI code
* Replacing Zoho People itself

### What we DO want

* A **persona-aware operational layer**
* AI that **renders the right UI at the right time**
* Zero menu hunting

---

## 5. Generative UI (Correct Definition)

> **Generative UI is agentic rendering of pre-registered components, where user persona, intent, and workflow state dynamically determine which UI is presented.**

This aligns with the philosophy of **Tambo**.

Important distinction:

* The AI does **not** generate components
* The AI **selects and orchestrates** components

---

## 6. Personas (Scope Definition)

To keep the system realistic and hackathon-ready, we strictly scoped to **three real personas**:

### 1️⃣ Employee

* Applies leave
* Checks in / checks out
* Fixes attendance mistakes
* Updates profile & documents
* Tracks request status

### 2️⃣ Manager

* Approves/rejects requests
* Sees team availability
* Sets goals
* Gives feedback

### 3️⃣ HR

* Monitors system health
* Manages documents & policies
* Resolves escalations
* Tracks onboarding & compliance

> These three personas cover **~80–90% of real Zoho People usage**.

---

## 7. Mental Model Shift

### From:

```
User → Menu → Submenu → Screen → Action
```

### To:

```
User → Persona → Intent → Component → Action
```

This is the foundation of the system.

---

## 8. Chat + Intent (Hybrid Model)

We intentionally **keep chat**, but **chat is not the product**.

### Chat is used for:

* Expressing intent naturally
  (“I forgot to checkout yesterday”)
* Clarifying missing information
* Handling edge cases

### Chat is NOT used for:

* Navigation
* Executing actions
* Approvals or uploads

> **All real actions happen through UI components, not chat.**

---

## 9. Agentic Rendering Architecture

```
User Input (Chat or Click)
        ↓
Persona Detection
        ↓
Intent Understanding
        ↓
State & Context Resolution
        ↓
Component Selection (from fixed registry)
        ↓
Generative UI Render
        ↓
State Update → Next Component
```

This ensures:

* Safety
* Predictability
* Personalization

---

## 10. Component-Driven System (Strictly Bounded)

To avoid scope creep, we **fixed the component budget**.

### Core Components: **21**

* Employee: 8
* Manager: 7
* HR: 6

### Shared Utility Components: **9**

> Every form, upload, stat, and approval is just a **component**.

No special cases.

---

## 11. Personalization Dimensions

The UI is personalized on **three axes**:

### 1️⃣ Persona-based

Same intent → different UI

Example:

* Employee → Attendance form
* Manager → Approval panel
* HR → Exception resolution

---

### 2️⃣ State-based

Same user → different moment

Example:

* Checked in but not checked out → reminder
* Missed yesterday → regularization flow
* Rejected request → resubmission UI

---

### 3️⃣ Context-based

Same user & state → different conditions

Example:

* Payroll day → warning
* Auto-approval policy → skip manager
* Repeated violations → escalate to HR

---

## 12. Example Flow (Daily Pain Solved)

### Scenario: Employee forgets to check out

1. Employee logs in
2. Persona detected: **Employee**
3. System detects missing checkout
4. Agent renders:

   * Attendance status timeline
   * Regularization form
5. Employee submits request
6. Manager sees approval inbox
7. Manager approves
8. Employee sees updated status

No searching.
No menus.
No confusion.

---

## 13. Why This Is Better Than a Copilot

| Traditional Copilot | Our System         |
| ------------------- | ------------------ |
| Explains steps      | Executes flows     |
| Chat-heavy          | UI-driven          |
| User navigates      | System guides      |
| Text answers        | Structured actions |

---

## 14. Why This Fits the Hackathon Perfectly

* Solves a **real, relatable problem**
* Demonstrates **true Generative UI**
* Clear scope and constraints
* Persona-driven
* Production-minded, not a demo toy

---

## 15. Final Summary

> We re-imagined Zoho People as a **persona-aware, intent-driven HR operating system**, where AI dynamically renders the exact UI components needed to complete tasks—eliminating navigation complexity while preserving control, safety, and transparency.


