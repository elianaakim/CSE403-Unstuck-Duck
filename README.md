# Unstuck Duck
# Abstract

One of the most effective ways to learn is to teach. We decided to leverage generative AI to turn any learner into a teacher. With Unstuck Duck, users teach a sentient rubber duck any concept they want. The duck responds with follow-up questions when explanations are unclear, asks for specific examples, and challenges oversimplified explanations.

Instead of providing answers directly, Unstuck Duck evaluates how well the concept was taught and offers a teaching score that reflects how a student would perform based solely on the user’s explanation. The more you teach your rubber duck, the more you refine your own understanding.

By shifting generative AI from answer generation to guided questioning and feedback, Unstuck Duck helps users build a deeper understanding and long-term mastery.

# Our Solution

We strive to turn indirect learning into direct teaching. Users teach their topic to a rubber duck that behaves like a curious student. Based on the explanation, the duck asks clarifying questions, requests examples, and points out inconsistencies. This pseudo-teaching experience encourages deep learning rather than surface-level memorization.

At any point, the user can request a Teaching Score. This score represents how well the duck would perform on a test using only the information provided by the user. The feedback highlights weak points and areas for improvement.

We also support synchronous study sessions using the Zoom API, allowing learners to collaborate and reinforce understanding together.

By encouraging users to explain concepts clearly and respond thoughtfully to questions, Unstuck Duck promotes mastery rather than passive consumption.

# Impact

Unstuck Duck lowers the barrier to effective learning by making high-quality practice accessible to anyone with a device. Because the system adapts to the user’s level and improves with more interaction, it supports both beginners and advanced learners.

Unlike traditional AI tools that provide answers, Unstuck Duck assumes the role of a student. This encourages independence, reasoning skills, and confidence. If successful, the product helps learners develop explanation skills, critical thinking, and self-assessment abilities.

# Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/elianaakim/CSE403-Unstuck-Duck.git
cd CSE403-Unstuck-Duck/unstuck-duck
npm install
```

Install Ollama to run locally:

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2
```

# Running the Application
Start the application:

Make sure to run all npm commands from `/unstuck-duck/`!
```bash
npm run dev
```

The application will run locally at:

For frontend:
```bash
http://localhost:3000
```

For backend (ollama):
```bash
http://localhost:11434
```
# Beta Release Tag

The GitHub tag for this milestone is:
```bash
v0.3.0-gamma
```

To check out the exact commit set for this release:
```bash
git checkout v0.3.0-gamma
```

# Running Tests

This project uses Mocha, Chai, and Supertest for testing.

Run all tests with:

Make sure to run all npm commands from `/unstuck-duck/`!
```bash
npm test
```
# Operational Use Case: Teaching the Duck a Concept
Our core use case is fully functional:

1. Input username `a@a.com` and password `1234` into login form
  
2. Press the "Sign In" button
     - Chrome might warn you about an insecure password; feel free to ignore
  
3. Once on the home page, make sure the carousel is selected on "Duck" and press "Go To Duck"

4. Enter a topic of choice (ex. Bubbles)

5. Explain the concept of choice to the duck through the frontend interface (ex. Bubbles can pop)

6. The backend (via Ollama) analyzes the explanation and responds with follow-up questions.

7. Continue explaining the concept to the duck until satisfied with the duck's knowledge on the topic.

8. Request a Teaching Score, which evaluates how well the concept was taught based solely on the user’s explanation.

9. The backend will analyze the information provided and determine a score on how well the topic was taught

```bash
http://localhost:3000/duck
```
