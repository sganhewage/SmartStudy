# SmartStudy

**SmartStudy** is an AI-powered web application designed to revolutionize the way students prepare for exams. By leveraging advanced language models, SmartStudy transforms your study materials—such as notes, lectures, and textbooks—into interactive quizzes and flashcards, facilitating efficient and effective learning.

## 🌟 Features

- Generate Study Content based on uploaded files and instructions
- Customize each form of study content to focus on specific areas of content
- Create and save multiple study sessions organizing uploaded and generated files.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or later)
- **npm** (v6 or later)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/sganhewage/SmartStudy.git
   cd SmartStudy
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
Create a .env file in the root directory and add the following:

  ```bash
  MONGODB_URL="<Your MongoDB URI>"
  JWT_SECRET_KEY=<Any string sequence>
  NEXT_PUBLIC_LLM_API_KEY="<Your chosen API's key>"
  ```

4. **Run the Development Server**:
  ```bash
  npm run dev
  ```
  Open http://localhost:3000 in your browser to see the application.

**🛠️ Technologies Used**
- Frontend: Next.js, React, Tailwind CSS
- Backend: Node.js, Python
- Database: MongoDB
