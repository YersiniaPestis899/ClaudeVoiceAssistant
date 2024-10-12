# Voice Assistant with Claude 3.5 Sonnet

This project is a voice-enabled AI assistant that uses Claude 3.5 Sonnet for natural language processing, Google Cloud Speech-to-Text for voice recognition, and Google Cloud Text-to-Speech for voice synthesis.

## Features

- Voice input and output
- Text-based chat interface
- Conversation history (up to 20 messages)
- Integration with Claude 3.5 Sonnet AI model
- Modern, Japanese-inspired UI

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Python 3.9+
- Node.js and npm
- Anaconda or Miniconda
- Google Cloud account with Speech-to-Text and Text-to-Speech APIs enabled
- AWS account with access to Claude 3.5 Sonnet model

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/voice-assistant.git
   cd voice-assistant
   ```

2. Set up the backend:
   ```
   cd backend
   conda create -n voice-assistant-env python=3.9
   conda activate voice-assistant-env
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```
   cd ../frontend
   npm install
   ```

4. Set up environment variables:
   - Create a `.env` file in the `backend` directory
   - Add the following variables:
     ```
     AWS_REGION=your_aws_region
     AWS_ACCESS_KEY_ID=your_aws_access_key_id
     AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
     CLAUDE_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
     ```

5. Set up Google Cloud credentials:
   - Place your `google-credentials.json` file in the `backend` directory
   - Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to this file

## Usage

1. Start the backend server:
   ```
   cd backend
   uvicorn main:app --reload
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Open your web browser and navigate to `http://localhost:3000`

4. Click the "Start Recording" button to begin speaking, and click "Stop Recording" when finished.

5. The application will transcribe your speech, send it to Claude for processing, and play back the AI's response.

## Contributing

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes.

## License

[MIT License](https://opensource.org/licenses/MIT)

## Contact

If you have any questions or feedback, please open an issue in the GitHub repository.
