const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = 3000;

app.use(cors());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'templates')));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.post('/process_audio', async (req, res) => {
    if (!req.files || !req.files.audio) {
        return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioFile = req.files.audio;
    const audioPath = path.join(__dirname, 'audio.mp3');

    try {
        await audioFile.mv(audioPath); // Save the file
        console.log('Audio file saved successfully.');

        // Create a form-data object for the API request
        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioPath));
        formData.append('model', 'whisper-1');

        // Send request to OpenAI API
        const transcriptionResponse = await axios.post(
            'https://api.openai.com/v1/audio/transcriptions',
            formData,
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    ...formData.getHeaders(),
                },
            }
        );

        const text = transcriptionResponse.data.text;
        console.log('Transcription:', text);

        // Use the transcription result to generate categories
        const prompt = `Kategorisieren Sie den folgenden Text in ein einfaches gültiges JSON-Objekt ...:\n\n${text}`;
        const gptResponse = await openai.createChatCompletion({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'Sie sind ein hilfreicher Assistent.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: 150,
        });

        const categories = gptResponse.data.choices[0].message.content.trim();
        console.log('Categories:', categories);

        res.json({ transcription: text, categories });
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        fs.unlink(audioPath, (err) => {
            if (err) console.error('Failed to delete temporary audio file:', err);
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://127.0.0.1:${port}`);
});