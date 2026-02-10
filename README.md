# Unstuck Duck
# Abstract

One of the most effective ways to learn is to teach. We decided to leverage generative AI to turn any learner into a teacher. With Unstuck Duck, users teach a sentient rubber duck any concept they want. The duck responds with follow-up questions when explanations are unclear, asks for examples, and challenges oversimplifications.

Instead of providing answers directly, Unstuck Duck evaluates how well the concept was taught and offers a teaching score that reflects how a student would perform based solely on the user’s explanation. The more you teach your rubber duck, the more you refine your own understanding.

By shifting generative AI from answer generation to guided questioning and feedback, Unstuck Duck helps users build deeper understanding and long term mastery.

# 💡 Our Solution

We strive to turn indirect learning into direct teaching. Users teach their topic to a rubber duck that behaves like a curious student. Based on the explanation, the duck asks clarifying questions, requests examples, and points out inconsistencies. This pseudo teaching experience encourages deep learning rather than surface level memorization.

At any point, the user can request a Teaching Score. This score represents how well the duck would perform on a test using only the information provided by the user. The feedback highlights weak points and areas for improvement.

We also support synchronous study sessions using the Zoom API, allowing learners to collaborate and reinforce understanding together.

By encouraging users to explain concepts clearly and respond thoughtfully to questions, Unstuck Duck promotes mastery rather than passive consumption.

# Impact

Unstuck Duck lowers the barrier to effective learning by making high quality practice accessible to anyone with a device. Because the system adapts to the user’s level and improves with more interaction, it supports both beginners and advanced learners.

Unlike traditional AI tools that provide answers, Unstuck Duck assumes the role of a student. This encourages independence, reasoning skills, and confidence. If successful, the product helps learners develop explanation skills, critical thinking, and self assessment abilities.

# 🛠 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/elianaakim/CSE403-Unstuck-Duck.git
cd CSE403-Unstuck-Duck
npm install
```

# Running the Application
Backend

Start the backend server:

```bash
npm run dev
```

Or:

```bash
npx ts-node src/server.ts
```

Backend runs on:

```bash
http://localhost:3000
```

Frontend

Start the frontend:

```bash
npm start
```

or

```bash
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

# Running Tests

This project uses Mocha, Chai, and Supertest.

Run all tests with:

```bash
npm test
```

# 🔐 Environment Variables

Create a .env file in the root directory:

```bash
OPENAI_API_KEY=your_key_here
ZOOM_API_KEY=your_key_here
```

These are required for:

* AI-powered Socratic questioning

* Synchronous study sessions

# Beta Release Tag

The GitHub tag for this beta release is:

beta-release

To check out this release: git checkout beta-release

# 📁 Project Structure
backend/
  src/
  tests/

frontend/
  src/
