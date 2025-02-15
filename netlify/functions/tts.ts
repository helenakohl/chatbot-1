import { Handler } from "@netlify/functions";
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

const client = new TextToSpeechClient({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}'),
});

interface RequestBody {
  text: string;
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { text } = JSON.parse(event.body || '{}') as RequestBody;

    const request = {
      input: { text },
      voice: { languageCode: 'en-GB', name: 'en-GB-Studio-C' as const }, //languageCode: 'en-US', name: 'en-US-Journey-F' 
      audioConfig: { audioEncoding: 'MP3' as const, 
        speakingRate: 1.1
       },
    };

    const [response] = await client.synthesizeSpeech(request);
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "audio/mp3" },
      body: response.audioContent?.toString('base64') || '',
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: "Error generating speech" };
  }
};