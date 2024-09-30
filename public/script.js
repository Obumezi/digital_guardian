document.addEventListener('DOMContentLoaded', () => {
    const learningContent = document.getElementById('learning-content');
    const dockItems = document.querySelectorAll('.dock-item');

    let currentScore = 0;

    function updateContent(section) {
        switch(section) {
            case 'home':
                learningContent.innerHTML = `
                    <h2>Welcome to Digital Guardian</h2>
                    <p>Explore our resources, chat with our AI, or play games to learn about online safety!</p>
                    <div class="bounce">
                        <i class="fas fa-arrow-down" style="font-size: 2rem; color: var(--primary);"></i>
                    </div>
                `;
                break;
            case 'resources':
                loadResources();
                break;
            case 'chat':
                displayChatInterface();
                break;
            case 'game':
                loadGameScenario();
                break;
        }
    }

    async function loadResources() {
        try {
            const response = await fetch('/resources', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.json();

            if (!data.resources || !Array.isArray(data.resources)) {
                throw new Error('Invalid response format');
            }

            displayResources(data.resources);
        } catch (error) {
            console.error('Error:', error);
            learningContent.innerHTML = `<p>Error loading resources. Please try again later.</p>`;
        }
    }

    function displayResources(resources) {
        if (resources.length === 0) {
            learningContent.innerHTML = '<p>No resources available at the moment. Please try again later.</p>';
            return;
        }

        let html = '<h2>Online Safety Resources</h2><div class="resource-grid">';
        resources.forEach(resource => {
            html += `
                <div class="resource-card">
                    <h3>${resource.title}</h3>
                    <p>${resource.description}</p>
                    <div class="fun-fact">
                        <strong>Fun Fact:</strong> ${resource.funFact}
                    </div>
                    <a href="${resource.url}" target="_blank" rel="noopener noreferrer" class="button">Learn More</a>
                </div>
            `;
        });
        html += '</div>';
        learningContent.innerHTML = html;
    }

    async function loadGameScenario() {
        try {
            const response = await fetch('/game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.json();
            displayGameScenario(data);
        } catch (error) {
            console.error('Error:', error);
            learningContent.innerHTML = `<p>Error loading game scenario. Please try again later.</p>`;
        }
    }

    function displayGameScenario(scenario) {
        let html = `
            <h2>Digital Guardian online Safety Quiz</h2>
            <div class="game-scenario">
                <h3>${scenario.theme}</h3>
                <p>${scenario.scenario}</p>
                <p>${scenario.question}</p>
                <div class="options">
                    ${scenario.options.map((option, index) => `
                        <button class="button game-option" data-choice="${index + 1}">${option}</button>
                    `).join('')}
                </div>
            </div>
            <div class="score">Score: ${currentScore}</div>
        `;

        learningContent.innerHTML = html;

        const optionButtons = document.querySelectorAll('.game-option');
        optionButtons.forEach(button => {
            button.addEventListener('click', () => handleAnswer(button, scenario.correctChoice, scenario.explanation));
        });
    }

    function handleAnswer(button, correctChoice, explanation) {
        const selectedChoice = parseInt(button.dataset.choice);
        const optionButtons = document.querySelectorAll('.game-option');

        optionButtons.forEach(btn => btn.disabled = true);

        if (selectedChoice === correctChoice) {
            button.classList.add('correct');
            currentScore += 10;
        } else {
            button.classList.add('incorrect');
            const correctButton = document.querySelector(`.game-option[data-choice="${correctChoice}"]`);
            correctButton.classList.add('correct');
        }

        const explanationElement = document.createElement('div');
        explanationElement.classList.add('explanation');
        explanationElement.textContent = explanation;
        learningContent.appendChild(explanationElement);

        const nextButton = document.createElement('button');
        nextButton.classList.add('button', 'next-scenario');
        nextButton.textContent = 'Next Scenario';
        nextButton.addEventListener('click', loadGameScenario);
        learningContent.appendChild(nextButton);

        updateScore();
    }

    function updateScore() {
        const scoreElement = document.querySelector('.score');
        scoreElement.textContent = `Score: ${currentScore}`;
    }

    function startChat() {
        console.log('Starting chat...');
        // Implement chat functionality here
    }

    function displayChatInterface() {
        learningContent.innerHTML = `
            <h2>Chat with Digital Guardian</h2>
            <div id="chat-messages"></div>
            <div class="chat-input">
                <input type="text" id="user-input" placeholder="Type your message here...">
                <button id="send-btn" class="button">Send</button>
            </div>
        `;

        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        const chatMessages = document.getElementById('chat-messages');

        sendBtn.addEventListener('click', () => sendMessage(userInput, chatMessages));
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage(userInput, chatMessages);
            }
        });
    }

    async function sendMessage(userInput, chatMessages) {
        const message = userInput.value.trim();
        if (message === '') return;

        // Display user message
        displayMessage(chatMessages, message, 'user');
        userInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.json();
            displayMessage(chatMessages, data.reply, 'bot');
        } catch (error) {
            console.error('Error:', error);
            displayMessage(chatMessages, 'Sorry, I had trouble understanding that. Can you try again?', 'bot');
        }
    }
    function displayMessage(chatMessages, message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
    
        if (sender === 'bot') {
            messageElement.innerHTML = `
                <div class="bot-message-header">Digital Guardian says:</div>
                <div class="bot-message-content">${formatBotMessage(message)}</div>
                <div class="bot-message-footer">Remember, stay safe online!</div>
            `;
        } else {
            messageElement.textContent = message;
        }
    
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function formatBotMessage(message) {
        // Split the message into paragraphs
        const paragraphs = message.split('\n').filter(p => p.trim() !== '');
    
        // Process each paragraph
        const formattedParagraphs = paragraphs.map(paragraph => {
            if (paragraph.startsWith('!Important:')) {
                return `<div class="advice-block">
                            <span class="advice-icon">❗</span>
                            <span class="advice-title">Important:</span>
                            <p>${paragraph.replace('!Important:', '').trim()}</p>
                        </div>`;
            } else if (paragraph.startsWith('Tip:')) {
                return `<div class="advice-block">
                            <span class="advice-icon">💡</span>
                            <span class="advice-title">Tip:</span>
                            <p>${paragraph.replace('Tip:', '').trim()}</p>
                        </div>`;
            } else if (paragraph.startsWith('Remember:')) {
                return `<div class="advice-block">
                            <span class="advice-icon">🔔</span>
                            <span class="advice-title">Remember:</span>
                            <p>${paragraph.replace('Remember:', '').trim()}</p>
                        </div>`;
            } else if (paragraph.startsWith('Never:')) {
                return `<div class="advice-block">
                            <span class="advice-icon">🚫</span>
                            <span class="advice-title">Never:</span>
                            <p>${paragraph.replace('Never:', '').trim()}</p>
                        </div>`;
            } else {
                return `<p>${paragraph}</p>`;
            }
        });
    
        // Join the formatted paragraphs
        return formattedParagraphs.join('');
    }

    dockItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            dockItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            updateContent(item.dataset.section);
        });
    });

    // Initialize with home content
    updateContent('home');
});



/* game logic */

