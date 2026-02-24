

# Overview

**Unstuck Duck** is an interactive learning tool that transforms any learner into a teacher. Instead of giving answers, the system plays the role of a curious rubber duck who asks clarifying questions, challenges vague explanations, and requests examples. By teaching the duck, users deepen their own understanding.

At any time, users can request a **Teaching Score**, which evaluates how well the duck would perform on a test using *only* the user’s explanation. This encourages clear reasoning, structured thinking, and mastery of the material.


# Installation

## Prerequisites

To run Unstuck Duck locally, you need:

- Node.js ≥ 18
- npm ≥ 9
- macOS, Windows, or Linux
- Chrome, Firefox, or Safari (latest versions)

## Clone the Repository

```bash
git clone https://github.com/elianaakim/CSE403-Unstuck-Duck.git
cd CSE403-Unstuck-Duck/unstuck-duck
npm install
```
## Running the application
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

For backend:
```bash
http://localhost:11434
```
## Using the software
### Logging in
  1. Open http://localhost:3000
  2. Enter credentials or create account
  3. Press sign in or sign up

### Navigating to Duck
  1. On the home page, ensure the carousel is set to Duck
  2. Click Go To Duck

### Teaching the Duck
  1. Enter any topic (e.g., OOP)
  2. Explain the concept in your own words (either type or speak)
     * To type: Type explanation into text box
     * To speak: Press the microphone button, start speaking, once done press the microphone again
  3. The duck will:
      * Ask clarifying questions
      * Request examples
      * Challenge vague or incorrect explanations
  4. Continue teaching until satisfied
### Request a Teaching Score
1. At any time, click Get Score.
2. The Duck will then provide a score based on how much you have teached

### End Session
1. Press end session button to end the current session

### The Lake (WIP)

### History page

### Light mode/dark mode toggle (WIP)

## How to report a bug

We use GitHub Issues for bug tracking 

https://github.com/users/elianaakim/projects/2

A good bug report should contain:
* Steps to reproduce
* Expected behavior
* Actual behavior
* Screenshots or console logs
* Commit hash or release tag
* Any relevant error messages

## Current bugs
* Zoom meetings can only host 2 people (WIP)



