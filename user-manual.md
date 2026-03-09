

# Overview

**Unstuck Duck** is an interactive learning tool that transforms any learner into a teacher. Instead of giving answers, the system plays the role of a curious rubber duck who asks clarifying questions, challenges vague explanations, and requests examples. By teaching the duck, users deepen their own understanding.

Users can request a **Teaching Score** after providing some information to the duck, which evaluates how well the duck would perform on a test using *only* the user’s explanation. This encourages clear reasoning, structured thinking, and mastery of the material.


# Installation

## Prerequisites

To run Unstuck Duck locally, you need:

- Node.js ≥ 18
- npm ≥ 9
- macOS, Windows, or Linux
- Chrome, Firefox, or Safari (latest versions)


## Using the website
Hypothetically our website is hosted on the web at http://unstuck-duck.com

### Display Appearance
  1. In the top right corner on the navbar, you can select Dark or Light mode. 

### Logging in
  1. Open http://unstuck-duck.com
  2. Enter credentials or create account
  3. Press sign in or sign up (by clicking the button or hitting enter/return on your keyboard).

### Navigating to Duck
  1. On the home page, ensure the carousel is set to Duck
  2. Click "Enter Duck"

### Teaching the Duck
  1. Enter any topic (e.g., OOP)
  2. Explain the concept in your own words (either type or speak)
     * To type: Type explanation into text box and click "Send" or hit the enter/return button on your keyboard
     * To speak: Press the microphone button, start speaking, once done press the microphone again. The text may take a little bit of time to show up in the box for input.
  3. The duck will:
      * Ask clarifying questions
      * Request examples
      * Challenge vague or incorrect explanations
  4. Continue teaching until satisfied
  
### Request a Teaching Score
1. At any time, click "Get Score".
2. The Duck will then provide a score based on how much you have taught and how much it has learnt.

### End Session
1. Press end session button to end the current session
     * Must end session for session to show up in the history. A warning banner will pop up if you try to navigate away without clicking the "End Session" button.
     
2. After ending the session, you can click a button on the Duck page to start a new session or view history.

### The Lake (WIP)
1. You can choose the topic that you want to learn and hit join.
2. Make sure your pop-up is not blocked so that your Zoom pop-up window can be shown.
3. Join the Zoom meeting.
   * redirects to user's zoom client

### History page
1. You can review past conversations
   * must be fully completed conversations that were finished with the end session button
2. Click on the conversation previews to see the full conversation
3. Can see the name of the topic of each conversation, the date and time, the number of messages, and the score.
4. Can delete conversation(s) by selecting the check-box(es) on the left hand side of each conversation.
  - To de-select a conversation to delete, click the check-box again.
  - To cancel the deletion of all selected boxes/conversations, click the "cancel" button at the top of the conversations.
  - To delete all of the selected boxes/conversations, click the "Delete Selected" button at the top of the conversations.

### Logging Out
1. Press the "Sign out" button on the top right of the navbar to log out of the user account.

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



