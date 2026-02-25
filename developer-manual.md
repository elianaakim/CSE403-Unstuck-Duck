This document provides all technical information needed for developers who want to build, test, and contribute to **Unstuck Duck**. It explains the repository structure, build steps, testing workflow, and release process.

## Obtaining the Source Code 
Clone the Repository 
```bash
git clone https://github.com/elianaakim/CSE403-Unstuck-Duck.git
cd CSE403-Unstuck-Duck/unstuck-duck
```
## Directory Structure

| Name / Path            | Purpose |
|------------------------|---------|
| Components             | Reusable React components used across the UI |
| app                    | Next.js routing, pages, server components, and API endpoints |
| app/api                | API endpoints that manage interactions with the ollama model and Supabase |
| app/[pages]            | Each page has its own folder that contains the page.tsx file for that page |
| backend                | Legacy backend code (kept for reference during refactor) |
| core/conversation      | Core logic for conversation handling, including Whisper transcription |
| lib                    | Utility functions, helpers, and Ollama model integration |
| public                 | Static assets such as images, icons, and fonts |
| eslint.config.mjs      | ESLint configuration for code quality and linting |
| postcss.config.mjs     | PostCSS configuration for CSS processing |
| tailwind.config.js     | Tailwind CSS configuration for styling and theming |


## How to build
Install dependences - **make sure to conduct all npm calls in unstuck-duck subfolder**
```bash
npm install
```
Development Build
```bash
npm run dev
```

## How to test
This project uses Mocha, Chai, and Supertest for testing - **make sure to conduct all npm calls in unstuck-duck subfolder**

Run all tests with:
```bash
npm run test
```

## How to add new tests
All test files live in:
```code
unstuck-duck/backend/src/tests
```

Use the following pattern:
```code
<feature>.test.js
```
Test Structure Example:
```js
import { expect } from "chai";
import request from "supertest";
import app from "../app"; // example path

describe("Feature Name", () => {
  it("should perform expected behavior", async () => {
    const res = await request(app).get("/api/example");
    expect(res.status).to.equal(200);
  });
});
```
## How to build a release of the software
Before creating a release:
* Ensure all tests pass
* Ensure documentation is up to date

Creating a Release Tag:

```bash
git tag -a vX.Y.Z -m "Release notes"
git push origin vX.Y.Z
```
