const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize the Google Generative AI model
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        const prompt = `
        You are a friendly and supportive chatbot for kids, helping them with bullying issues. 
        The child said: "${message}"
        Provide a caring, age-appropriate response that:
        1. Acknowledges their feelings
        2. Offers support and encouragement
        3. Gives practical advice on how to handle bullying
        4. Encourages them to talk to a trusted adult if necessary
        Keep the response concise and easy to understand for children.
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});



app.post('/guidance', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        res.json({ guidance: text });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});;app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
