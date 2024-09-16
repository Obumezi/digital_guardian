document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('report-form');
    const aiGuidance = document.getElementById('ai-guidance');
    const incidentType = document.getElementById('incident-type');
    const incidentDescription = document.getElementById('incident-description');

    async function getAIGuidance(prompt) {
        try {
            const response = await fetch('http://localhost:3000/guidance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', response.status, errorText);
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.guidance;
        } catch (error) {
            console.error('Error in getAIGuidance:', error);
            return "I'm sorry, I'm having trouble providing guidance right now. Please try again later.";
        }
    }

    async function updateGuidance() {
        const prompt = `
        A child is reporting an incident. The incident type is: "${incidentType.value}"
        and the description is: "${incidentDescription.value}".
        Please provide gentle, supportive guidance on how to report this incident,
        emphasizing the importance of telling a trusted adult. Keep the response
        concise and easy for a child to understand.
        `;

        aiGuidance.textContent = "Getting guidance...";
        const guidance = await getAIGuidance(prompt);
        aiGuidance.textContent = guidance;
    }

    incidentType.addEventListener('blur', updateGuidance);
    incidentDescription.addEventListener('blur', updateGuidance);

    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        alert("Thank you for your report. Remember to talk to a trusted adult about this incident.");
        reportForm.reset();
        aiGuidance.textContent = '';
    });
});
