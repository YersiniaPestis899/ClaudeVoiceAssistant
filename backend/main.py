import os
os.environ['GRPC_TRACE'] = 'none'
os.environ['GRPC_VERBOSITY'] = 'none'

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import tempfile
import boto3
from google.cloud import speech
from google.cloud import texttospeech
from dotenv import load_dotenv
import json
from pydantic import BaseModel
from typing import List, Dict

# .envファイルから環境変数を読み込む
load_dotenv()

app = FastAPI()

# CORSミドルウェアを追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Reactアプリのオリジン
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Cloud認証情報ファイルのパスは環境変数から取得
# この行は削除または変更する必要はありません
# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] は既にシステム環境変数として設定されています

# AWS Bedrock設定
bedrock = boto3.client(
    service_name='bedrock-runtime',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    client = speech.SpeechClient()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
        temp_audio.write(await file.read())
        temp_audio_path = temp_audio.name

    with open(temp_audio_path, "rb") as audio_file:
        content = audio_file.read()

    audio = speech.RecognitionAudio(content=content)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        sample_rate_hertz=48000,
        language_code="ja-JP",
    )

    response = client.recognize(config=config, audio=audio)
    transcription = response.results[0].alternatives[0].transcript if response.results else ""

    os.unlink(temp_audio_path)
    return {"transcription": transcription}

@app.post("/chat")
async def chat_with_claude(request: ChatRequest):
    # 最新の20件の会話履歴を使用
    recent_messages = request.messages[-20:]
    
    response = bedrock.invoke_model(
        modelId=os.getenv('CLAUDE_MODEL_ID'),
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 200000,
            "messages": [{"role": msg.role, "content": msg.content} for msg in recent_messages]
        })
    )
    response_body = json.loads(response['body'].read())
    assistant_response = response_body['content'][0]['text']
    return {"response": assistant_response}

@app.post("/synthesize")
async def synthesize_speech(request: Dict[str, str]):
    client = texttospeech.TextToSpeechClient()
    synthesis_input = texttospeech.SynthesisInput(text=request["text"])
    voice = texttospeech.VoiceSelectionParams(
        language_code="ja-JP", 
        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    def iterfile():
        yield response.audio_content

    return StreamingResponse(iterfile(), media_type="audio/mpeg")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
