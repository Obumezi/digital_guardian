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

// Existing routes
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
});

app.post('/quiz', async (req, res) => {
    try {
        const prompt = `
        Generate a fun cybersecurity quiz question for children with 4 multiple-choice options.
        Include the correct answer and a brief, child-friendly explanation.
        Format: 
        Question: [Question text]
        A. [Option A]
        B. [Option B]
        C. [Option C]
        D. [Option D]
        Correct Answer: [A/B/C/D]
        Explanation: [Brief explanation]
        `;
        
        const result = await model.generateContent(prompt);
        const quizContent = result.response.text();
        
        // Parse the quiz content
        const lines = quizContent.split('\n');
        const question = lines[0].replace('Question: ', '');
        const options = lines.slice(1, 5).map(line => line.trim());
        const correctAnswer = lines[5].replace('Correct Answer: ', '');
        const explanation = lines[6].replace('Explanation: ', '');

        // Create a JSON object with the quiz data
        const quizData = {
            question,
            options,
            correctAnswer,
            explanation
        };

        res.json(quizData);
    } catch (error) {
        console.error('Error generating quiz question:', error);
        res.status(500).json({ error: 'Failed to generate quiz question' });
    }
});

// ... (previous code remains unchanged)

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
            `;
            
            const result = await model.generateContent(prompt);
            const gameScenario = result.response.text();
            
            // Parse and validate the JSON response
            const parsedScenario = JSON.parse(gameScenario);
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
                res.status(500).json({ error: 'Failed to generate a safe game scenario after multiple attempts' });
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

// ... (rest of the code remains unchanged)

app.post('/simulation', async (req, res) => {
    try {
        const prompt = `
        Generate a simulated email that could be a phishing attempt.
        Include subtle clues that it might be fake.
        Then provide an analysis of the email, pointing out the suspicious elements.
        Format:
        Email:
        [Simulated email content]
        
        Analysis:
        [Points highlighting suspicious elements]
        `;
        
        const result = await model.generateContent(prompt);
        const phishingSimulation = result.response.text();
        
        res.json({ phishingSimulation: phishingSimulation });
    } catch (error) {
        console.error('Error generating phishing simulation:', error);
        res.status(500).json({ error: 'Failed to generate phishing simulation' });
    }
});

// ... (previous code remains unchanged)

app.post('/resources', async (req, res) => {
    try {
        const prompt = `
        Generate a list of 5 genuine cybersecurity resources for kids aged 8-12. For each resource, include:
        1. A title
        2. A brief description (1-2 sentences)
        3. A fun fact or tip related to the resource
        4. A genuine URL to the resource (use real, existing websites)
    
        Format the response as a JSON array of objects, each containing 'title', 'description', 'funFact', and 'url' properties.
        Do not include any markdown formatting or code block indicators.
        `;
    
        const result = await model.generateContent(prompt);
        let resourcesContent = result.response.text();
    
        console.log('Raw AI response:', resourcesContent);

        // Remove any markdown formatting if present
        resourcesContent = resourcesContent.replace(/```json\s?|\s?```/g, '').trim();

        // Parse the content as JSON
        let resources;
        try {
            resources = JSON.parse(resourcesContent);
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            console.log('Cleaned AI response:', resourcesContent);
            
            // If parsing fails, attempt to extract resource objects
            resources = extractResourceObjects(resourcesContent);
        }
    
        // Ensure the parsed content is an array
        if (!Array.isArray(resources)) {
            resources = [resources];
        }
    
        res.json({ resources });
    } catch (error) {
        console.error('Error generating resources:', error);
        res.status(500).json({ error: 'Failed to generate resources', details: error.message });
    }
});

// ... (rest of the code remains unchanged)

function extractResourceObjects(content) {
    const resourceRegex = /\{[^}]+\}/g;
    const matches = content.match(resourceRegex);
    
    if (matches) {
        return matches.map(match => {
            try {
                return JSON.parse(match);
            } catch (error) {
                console.error('Error parsing resource object:', error);
                return null;
            }
        }).filter(resource => resource !== null);
    }
    
    return [];
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});