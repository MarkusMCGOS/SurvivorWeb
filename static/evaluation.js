document.addEventListener('DOMContentLoaded', () => {
    console.log('Evaluation page loaded');
    
    // Get all required data from sessionStorage
    const getStoredData = () => {
        console.log('All sessionStorage keys:', Object.keys(sessionStorage));
        
        const data = {
            evaluationData: sessionStorage.getItem('currentEvaluation'),
            questionData: sessionStorage.getItem('currentQuestion'),
            userAnswer: sessionStorage.getItem('currentAnswer'),
            questionId: sessionStorage.getItem('currentQuestionId'),
            score: parseInt(sessionStorage.getItem('score')) || 0,
            level: parseInt(sessionStorage.getItem('level')) || 1,
            questionsAnswered: parseInt(sessionStorage.getItem('questionsAnswered')) || 0,
            streak: parseInt(sessionStorage.getItem('streak')) || 0
        };
        
        console.log('Raw sessionStorage data:', data);
        
        // Parse JSON data
        try {
            if (data.evaluationData) {
                data.evaluationData = JSON.parse(data.evaluationData);
                console.log('Parsed evaluation data:', data.evaluationData);
            }
            if (data.questionData) {
                data.questionData = JSON.parse(data.questionData);
                console.log('Parsed question data:', data.questionData);
                console.log('Question text:', data.questionData.text);
                console.log('Question ID:', data.questionData.id);
                console.log('Stored Question ID:', data.questionId);
                
                // Verify question ID matches
                if (data.questionData.id.toString() !== data.questionId) {
                    console.error('Question ID mismatch!');
                    throw new Error('Question data mismatch');
                }
            }
        } catch (error) {
            console.error('Error parsing stored data:', error);
            return null;
        }
        
        console.log('Final parsed data:', data);
        return data;
    };

    // Get DOM elements
    const questionElement = document.getElementById('questionText');
    const questionPointsElement = document.getElementById('questionPoints');
    const answerElement = document.getElementById('answerText');
    const feedbackElement = document.getElementById('evaluationFeedback');
    const scoreElement = document.getElementById('evaluationScore');
    const explanationElement = document.getElementById('evaluationExplanation');
    const nextButton = document.getElementById('nextQuestion');
    const retryButton = document.getElementById('retryQuestion');
    const levelDisplay = document.getElementById('levelNumber');
    const progressFill = document.getElementById('progressFill');
    const scoreDisplay = document.getElementById('scoreDisplay');

    // Validate DOM elements
    if (!questionElement || !questionPointsElement || !answerElement || !feedbackElement || 
        !scoreElement || !explanationElement || !nextButton || !retryButton) {
        console.error('Missing required DOM elements');
        return;
    }

    // Get and validate data
    const data = getStoredData();
    console.log('Retrieved data:', data);

    if (!data || !data.evaluationData || !data.questionData || !data.userAnswer) {
        console.error('Missing required data:', data);
        showError('Unable to load evaluation data. Please try answering the question again.');
        
        // Add retry button functionality
        retryButton.addEventListener('click', () => {
            window.location.href = 'question.html';
        });
        return;
    }

    // Display evaluation results
    try {
        // Update score and level display
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${data.score} | Streak: ${data.streak} | Questions: ${data.questionsAnswered}`;
        }
        if (levelDisplay) {
            levelDisplay.textContent = data.level;
        }
        if (progressFill) {
            const xpToNextLevel = 100;
            const progress = (data.score % xpToNextLevel) / xpToNextLevel * 100;
            progressFill.style.width = `${progress}%`;
            console.log('Updated progress bar:', progress);
        }

        // Display question text and points
        const questionText = data.questionData.text.split('\n\n')[0];
        console.log('Setting question text:', questionText);
        questionElement.textContent = questionText;
        
        // Display question points
        const points = data.questionData.text.split('\n\n')[1].split('\n').filter(point => point.trim().startsWith('-'));
        console.log('Setting question points:', points);
        questionPointsElement.innerHTML = points.map(point => 
            `<li>${point.replace('-', '').trim()}</li>`
        ).join('');
        
        console.log('Setting answer text:', data.userAnswer);
        answerElement.textContent = data.userAnswer;
        
        console.log('Setting feedback:', data.evaluationData.feedback);
        feedbackElement.textContent = data.evaluationData.feedback;
        
        // Create result indicator
        const resultIndicator = document.createElement('div');
        resultIndicator.className = 'result-indicator';
        const passed = data.evaluationData.success;
        resultIndicator.innerHTML = `
            <div class="result-icon">${passed ? '✅' : '❌'}</div>
            <div class="result-text">${passed ? 'Passed!' : 'Not Passed'}</div>
        `;
        scoreElement.parentNode.insertBefore(resultIndicator, scoreElement);
        
        console.log('Setting score:', data.evaluationData.score);
        scoreElement.textContent = `Score: ${data.evaluationData.score}%`;
        
        console.log('Setting explanation:', data.evaluationData.explanation);
        explanationElement.textContent = data.evaluationData.explanation;

        // Display question explanation
        const questionExplanationElement = document.getElementById('questionExplanation');
        if (questionExplanationElement && data.questionData.explanation) {
            questionExplanationElement.innerHTML = `<p>${data.questionData.explanation}</p>`;
        }

        // Add success/failure styling
        if (data.evaluationData.success) {
            scoreElement.classList.add('success');
            resultIndicator.classList.add('success');
        } else {
            scoreElement.classList.add('failure');
            resultIndicator.classList.add('failure');
        }

        // Add button event listeners
        nextButton.addEventListener('click', () => {
            // Clear the current question data before loading a new one
            sessionStorage.removeItem('currentQuestion');
            sessionStorage.removeItem('currentQuestionId');
            sessionStorage.removeItem('currentEvaluation');
            sessionStorage.removeItem('currentAnswer');
            window.location.href = 'question.html';
        });

        retryButton.addEventListener('click', () => {
            window.location.href = 'question.html';
        });
    } catch (error) {
        console.error('Error displaying evaluation:', error);
        showError('Error displaying evaluation results. Please try again.');
    }
});

function showError(message) {
    console.error('Showing error:', message);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.insertBefore(errorDiv, document.body.firstChild);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
} 