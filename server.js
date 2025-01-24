const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');
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

// Überprüfen, ob der OpenAI-API-Schlüssel vorhanden ist
if (!process.env.OPENAI_API_KEY) {
    console.error('No OpenAI API key provided. Please set the OPENAI_API_KEY environment variable.');
    process.exit(1);
}

// Initialize OpenAI with your API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.post('/process_audio', async (req, res) => {
    if (!req.files || !req.files.audio) {
        console.error('No audio file provided');
        return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioFile = req.files.audio;
    const audioPath = path.join(__dirname, 'audio.mp3');

    // Save the file in the current working directory
    await audioFile.mv(audioPath);
    console.log('Audio file saved successfully.');

    // Create a form-data object for the API request
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioPath));
    formData.append('model', 'whisper-1');

    // Send request to OpenAI API for transcription
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
    const prompt = `Kategorisieren Sie den folgenden Text in ein einfaches gültiges JSON-Objekt ohne JS multiline Kommentare und ohne JSON Keyword, das folgendes enthält: Vorname, Nachname, Alter, Geschlecht, Blutdruck, Körpertemperatur und weitere Vitalparameter, Diagnosetext mit Nummer 1. bis Nummer 5. Diagnose als Javascript Array mit Key 1. etc. (numerischer Wert mit Punkt) Value: die Diagnose:\n\n${text}`;
    const gptResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: 'Sie sind ein hilfreicher Assistent, der auf medizinische Kategorisierung spezialisiert ist.' },
            { role: 'user', content: prompt },
        ],
        max_tokens: 150,
    });

    const categories = gptResponse.choices[0].message.content.trim();
    console.log('Categories:', categories);

    res.json({ transcription: text, categories: categories });
});

app.listen(port, () => {
    console.log(`Server is running on http://127.0.0.1:${port}`);
});
