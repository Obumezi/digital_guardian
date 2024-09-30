const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize the Google Generative AI model
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const prompt = `
        You are a friendly and supportive chatbot for kids, helping them with online safety issues. 
        The child said: "${message}"
        Provide a caring, age-appropriate response that:
        1. Acknowledges their feelings
        2. Offers support and encouragement
        3. Gives practical advice on how to handle online safety issues
        4. Encourages them to talk to a trusted adult if necessary

        Structure your response with clear paragraphs and use the following prefixes for different types of information:
        - Start important points with "!Important:"
        - Start tips with "Tip:"
        - Start reminders with "Remember:"
        - Start things to avoid with "Never:"

        Use a new line for each new point or piece of advice.
        Keep the response concise, easy to understand for children aged 8-12, and always maintain a positive, supportive tone.
        Avoid any inappropriate or sensitive content.
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

// ... (other routes remain unchanged)

app.post('/game', async (req, res) => {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            const prompt = `
            Create a child-friendly scenario about online safety for kids aged 8-12. 
            Choose one of these themes:
            1. Being kind online
            2. Spotting fake information
            3. Protecting personal information
            4. Creating safe passwords

            Provide a short situation, a question, and three age-appropriate answer choices.
            Format the response as a JSON object with this structure:
            {
                "theme": "Chosen theme",
                "scenario": "Brief, child-friendly scenario",
                "question": "What should you do?",
                "options": ["Safe option", "Okay option", "Unsafe option"],
                "correctChoice": 1,
                "explanation": "Simple explanation of the correct choice"
            }
            Ensure all content is appropriate for children and avoids any sensitive topics.
            Do not include any markdown formatting, code block indicators, or additional text outside the JSON object in your response.
            `;

            const result = await model.generateContent(prompt);
            let gameScenario = result.response.text();

            console.log('Raw AI response:', gameScenario);

            // Clean the response
            gameScenario = gameScenario.replace(/```json\s?|\s?```/g, '').trim();

            // Remove any text before or after the JSON object
            const jsonStartIndex = gameScenario.indexOf('{');
            const jsonEndIndex = gameScenario.lastIndexOf('}') + 1;
            if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                gameScenario = gameScenario.slice(jsonStartIndex, jsonEndIndex);
            }

            console.log('Cleaned response:', gameScenario);

            // Parse and validate the JSON response
            const parsedScenario = JSON.parse(gameScenario);

            console.log('Parsed scenario:', parsedScenario);

            if (validateScenario(parsedScenario)) {
                res.json(parsedScenario);
                return;
            } else {
                throw new Error("Invalid scenario structure");
            }
        } catch (error) {
            console.error(`Attempt ${retries + 1} failed:`, error);
            retries++;
            if (retries >= maxRetries) {
                res.status(500).json({ error: 'Failed to generate a safe game scenario after multiple attempts', details: error.message });
            }
        }
    }
});

function validateScenario(scenario) {
    return (
        scenario.theme &&
        scenario.scenario &&
        scenario.question &&
        Array.isArray(scenario.options) &&
        scenario.options.length === 3 &&
        typeof scenario.correctChoice === 'number' &&
        scenario.correctChoice >= 1 &&
        scenario.correctChoice <= 3 &&
        scenario.explanation
    );
}

// ... (rest of the server code remains unchanged)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/resources', async (req, res) => {
    try {
        const resources = await generateResources();
        res.json({ resources: resources });
    } catch (error) {
        console.error('Error generating resources:', error);
        res.status(500).json({ 
            error: 'Failed to generate resources', 
            details: error.message,
            rawResponse: error.rawResponse // Add this line
        });
    }
});

async function generateResources() {
    const prompt = `
    Generate 4 online safety resources for children aged 8-12. Each resource should include:
    1. A title
    2. A brief description (1-2 sentences)
    3. A fun fact related to the topic
    4. A fictional URL for more information

    Topics should cover different aspects of online safety, such as:
    - Cyberbullying prevention
    - Password security
    - Privacy protection
    - Safe social media use
    - Recognizing online scams
    - Digital footprint awareness

    Provide the response as a simple list, not in JSON format.
    Ensure all content is age-appropriate and engaging for children.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    console.log('Raw AI response:', text);

    // Parse the text response into structured data
    const resources = parseResourcesFromText(text);

    console.log('Parsed resources:', resources);

    if (resources.length !== 4) {
        throw new Error(`Expected 4 resources, but got ${resources.length}`);
    }

    return resources;
}

function parseResourcesFromText(text) {
    const resources = [];
    let currentResource = {};
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
        if (line.match(/^\d+\./)) {
            // New resource starts
            if (Object.keys(currentResource).length) {
                resources.push(currentResource);
                currentResource = {};
            }
            currentResource.title = line.replace(/^\d+\./, '').trim();
        } else if (line.toLowerCase().includes('description:')) {
            currentResource.description = line.replace(/^.*?description:/i, '').trim();
        } else if (line.toLowerCase().includes('fun fact:')) {
            currentResource.funFact = line.replace(/^.*?fun fact:/i, '').trim();
        } else if (line.toLowerCase().includes('url:')) {
            currentResource.url = line.replace(/^.*?url:/i, '').trim();
        } else if (currentResource.title && !currentResource.description) {
            // If we have a title but no description, assume this line is the description
            currentResource.description = line;
        }
    }
    
    if (Object.keys(currentResource).length) {
        resources.push(currentResource);
    }
    
    // Ensure all resources have all required fields
    resources.forEach((resource, index) => {
        if (!resource.title) resource.title = `Resource ${index + 1}`;
        if (!resource.description) resource.description = 'No description provided.';
        if (!resource.funFact) resource.funFact = 'No fun fact available.';
        if (!resource.url) resource.url = '#';
    });
    
    return resources;
}