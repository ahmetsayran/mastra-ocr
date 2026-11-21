import { mastra } from '../../mastra';

const READ_PROMPT = 'Bu görseldeki tüm metni oku ve aynen yaz.';

export abstract class OcrService {
  static async read(file: File) {
    const agent = mastra.getAgent('ocrAgent');
    const image = new Uint8Array(await file.arrayBuffer());

    const result = await agent.generate([
      {
        role: 'user',
        content: [
          { type: 'text', text: READ_PROMPT },
          { type: 'image', image, mimeType: file.type },
        ],
      },
    ]);

    return { text: result.text };
  }
}
