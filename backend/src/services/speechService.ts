import axios from 'axios';
import FormData from 'form-data';

const SPEECHMATICS_API_URL = 'https://asr.api.speechmatics.com/v2';
const SPEECHMATICS_TTS_URL = 'https://mp.speechmatics.com/v1/synthesize';

interface TranscriptionResult {
  text: string;
  provider: 'speechmatics' | 'browser';
  success: boolean;
}

interface SynthesisResult {
  audio: Buffer | null;
  provider: 'speechmatics' | 'browser';
  success: boolean;
  useBrowserFallback?: boolean;
}

// Speech-to-Text using Speechmatics
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = 'audio/wav'
): Promise<TranscriptionResult> {
  const apiKey = process.env.SPEECHMATICS_API_KEY;

  if (!apiKey) {
    console.warn('Speechmatics API key not configured, using browser fallback');
    return {
      text: '',
      provider: 'browser',
      success: false
    };
  }

  // Determine correct file extension based on mime type
  let filename = 'audio.wav';
  if (mimeType.includes('webm')) {
    filename = 'audio.webm';
  } else if (mimeType.includes('ogg')) {
    filename = 'audio.ogg';
  } else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
    filename = 'audio.mp3';
  }

  console.log(`[Speechmatics] Starting transcription - mimeType: ${mimeType}, filename: ${filename}, buffer size: ${audioBuffer.length} bytes`);

  try {
    // Create job for transcription
    const formData = new FormData();

    // Append the audio file with correct extension
    formData.append('data_file', audioBuffer, {
      filename: filename,
      contentType: mimeType
    });

    // Append the config
    const config = {
      type: 'transcription',
      transcription_config: {
        language: 'en',
        operating_point: 'enhanced'
      }
    };
    formData.append('config', JSON.stringify(config));

    // Submit transcription job
    console.log('[Speechmatics] Submitting job...');
    const response = await axios.post(
      `${SPEECHMATICS_API_URL}/jobs`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders()
        },
        timeout: 60000 // 60 second timeout
      }
    );

    const jobId = response.data.id;
    console.log(`[Speechmatics] Job created: ${jobId}`);

    // Poll for results
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      const statusResponse = await axios.get(
        `${SPEECHMATICS_API_URL}/jobs/${jobId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      const jobStatus = statusResponse.data.job?.status;
      console.log(`[Speechmatics] Job ${jobId} status: ${jobStatus} (attempt ${attempts + 1}/${maxAttempts})`);

      if (jobStatus === 'done') {
        // Get the transcript
        const transcriptResponse = await axios.get(
          `${SPEECHMATICS_API_URL}/jobs/${jobId}/transcript`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json'
            }
          }
        );

        const results = transcriptResponse.data.results || [];
        const text = results
          .filter((r: { type: string }) => r.type === 'word')
          .map((r: { alternatives: Array<{ content: string }> }) => r.alternatives[0]?.content || '')
          .join(' ');

        console.log(`[Speechmatics] Transcription complete: "${text.substring(0, 100)}..."`);

        return {
          text: text.trim(),
          provider: 'speechmatics',
          success: true
        };
      }

      if (jobStatus === 'rejected') {
        const errorDetails = statusResponse.data.job?.errors || 'Unknown error';
        console.error(`[Speechmatics] Job rejected:`, errorDetails);
        throw new Error(`Transcription job rejected: ${JSON.stringify(errorDetails)}`);
      }

      if (jobStatus === 'error') {
        const errorDetails = statusResponse.data.job?.errors || 'Unknown error';
        console.error(`[Speechmatics] Job error:`, errorDetails);
        throw new Error(`Transcription job error: ${JSON.stringify(errorDetails)}`);
      }

      attempts++;
    }

    throw new Error('Transcription job timed out');
  } catch (error: any) {
    console.error('[Speechmatics] STT error:', error.response?.data || error.message || error);
    return {
      text: '',
      provider: 'browser',
      success: false
    };
  }
}

// Text-to-Speech using Speechmatics
export async function synthesizeSpeech(text: string): Promise<SynthesisResult> {
  const apiKey = process.env.SPEECHMATICS_API_KEY;

  if (!apiKey) {
    console.warn('Speechmatics API key not configured, using browser fallback');
    return {
      audio: null,
      provider: 'browser',
      success: false,
      useBrowserFallback: true
    };
  }

  try {
    const response = await axios.post(
      SPEECHMATICS_TTS_URL,
      {
        text: text,
        audio_format: {
          type: 'wav',
          sample_rate: 22050
        },
        voice_config: {
          voice: 'en-US',
          audio_profile: 'standard'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'audio/wav'
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );

    return {
      audio: Buffer.from(response.data),
      provider: 'speechmatics',
      success: true
    };
  } catch (error) {
    console.error('Speechmatics TTS error:', error);
    return {
      audio: null,
      provider: 'browser',
      success: false,
      useBrowserFallback: true
    };
  }
}

// Check if Speechmatics is available and configured
export function isSpeechmaticsConfigured(): boolean {
  return !!process.env.SPEECHMATICS_API_KEY;
}

// Get speech service status
export function getSpeechServiceStatus(): {
  stt: { available: boolean; provider: string };
  tts: { available: boolean; provider: string };
} {
  const hasApiKey = !!process.env.SPEECHMATICS_API_KEY;

  return {
    stt: {
      available: hasApiKey,
      provider: hasApiKey ? 'speechmatics' : 'browser'
    },
    tts: {
      available: hasApiKey,
      provider: hasApiKey ? 'speechmatics' : 'browser'
    }
  };
}

export default {
  transcribeAudio,
  synthesizeSpeech,
  isSpeechmaticsConfigured,
  getSpeechServiceStatus
};
