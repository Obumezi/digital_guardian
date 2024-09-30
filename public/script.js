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
                learningContent.innerHTML = `
                    <h2>Chat with Digital Guardian</h2>
                    <p>Our AI assistant is here to answer your questions about online safety.</p>
                    <button id="start-chat" class="button">
                        <i class="fas fa-robot"></i> Start Chat
                    </button>
                `;
                document.getElementById('start-chat').addEventListener('click', startChat);
                break;
            case 'game':
                loadGameScenario();
                break;
        }
    }

    async function loadResources() {
        try {
            const response = await fetch('/resources', {
                method: 'POST',
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

        let html = '<h2>Cybersecurity Resources</h2><ul>';
        resources.forEach(resource => {
            html += `
                <li>
                    <h3>${resource.title}</h3>
                    <p>${resource.description}</p>
                    <div class="fun-fact">
                        <strong>Fun Fact:</strong> ${resource.funFact}
                    </div>
                    <p><a href="${resource.url}" target="_blank" rel="noopener noreferrer" class="button">Visit Resource</a></p>
                </li>
            `;
        });
        html += '</ul>';
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
            <h2>Interland-inspired Safety Game</h2>
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

