document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('answerForm');
    const textarea = document.getElementById('answer');
    const charCount = document.getElementById('charCount');
    const maxLength = 300;
    let currentScore = parseInt(sessionStorage.getItem('score')) || 0;
    let questionsAnswered = parseInt(sessionStorage.getItem('questionsAnswered')) || 0;
    let currentStreak = parseInt(sessionStorage.getItem('streak')) || 0;
    let currentLevel = parseInt(sessionStorage.getItem('level')) || 1;
    let perfectScoresInRow = parseInt(sessionStorage.getItem('perfectScoresInRow')) || 0;
    let xpToNextLevel = 100;
    let currentQuestion = null;

    // Import questions from questions.js
    console.log('Available questions:', window.questions);
    const questions = window.questions || [];
    console.log('Questions array:', questions);

    // Keep track of used questions
    let usedQuestions = JSON.parse(sessionStorage.getItem('usedQuestions')) || [];

    // Update score display
    function updateScoreDisplay() {
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${currentScore} | Streak: ${currentStreak} | Questions: ${questionsAnswered}`;
        }
    }

    // Update level display
    function updateLevelDisplay() {
        const levelNumber = document.getElementById('levelNumber');
        const progressFill = document.getElementById('progressFill');
        if (levelNumber) {
            levelNumber.textContent = currentLevel;
        }
        if (progressFill) {
            const progress = (currentScore % xpToNextLevel) / xpToNextLevel * 100;
            progressFill.style.width = `${progress}%`;
            console.log('Updated progress bar:', progress);
        }
    }

    // Check for level up
    function checkLevelUp() {
        const newLevel = Math.floor(currentScore / xpToNextLevel) + 1;
        if (newLevel > currentLevel) {
            currentLevel = newLevel;
            sessionStorage.setItem('level', currentLevel);
            showSuccessMessage(`Level Up! You are now level ${currentLevel}`);
            updateLevelDisplay();
        }
    }

    // Check achievements
    function checkAchievements() {
        const achievements = document.querySelectorAll('.achievement');
        achievements.forEach(achievement => {
            const requirement = parseInt(achievement.dataset.requirement);
            const isUnlocked = 
                (requirement === 5 && questionsAnswered >= 5) ||
                (requirement === 10 && currentStreak >= 5) ||
                (requirement === 100 && currentScore >= 100) ||
                (requirement === 20 && perfectScoresInRow >= 2) ||
                (requirement === 50 && currentLevel >= 5);
            
            achievement.classList.toggle('unlocked', isUnlocked);
        });
    }

    // Update character count
    function updateCharCount() {
        const count = textarea.value.length;
        charCount.textContent = count;
        if (count > maxLength) {
            charCount.style.color = 'red';
        } else {
            charCount.style.color = '';
        }
    }

    // Add input event listener for character count
    textarea.addEventListener('input', updateCharCount);

    // Load a random question
    function loadQuestion() {
        console.log('Loading question. Questions array length:', questions.length);
        if (!questions || questions.length === 0) {
            console.error('No questions available in the array');
            showError('No questions available. Please refresh the page.');
            return;
        }

        // Get available questions (not used yet)
        const availableQuestions = questions.filter(q => !usedQuestions.includes(q.id));
        console.log('Available questions:', availableQuestions);

        // If all questions have been used, reset the used questions
        if (availableQuestions.length === 0) {
            console.log('All questions have been used, resetting...');
            usedQuestions = [];
            sessionStorage.setItem('usedQuestions', JSON.stringify(usedQuestions));
            return loadQuestion();
        }

        // Select a random question from available ones
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const selectedQuestion = availableQuestions[randomIndex];
        console.log('Selected question:', selectedQuestion);

        // Add to used questions
        usedQuestions.push(selectedQuestion.id);
        sessionStorage.setItem('usedQuestions', JSON.stringify(usedQuestions));

        const questionText = document.querySelector('.question-text');
        const questionPoints = document.querySelector('.question-points');
        
        if (questionText && questionPoints) {
            // Update the question text
            questionText.textContent = selectedQuestion.text.split('\n\n')[0];
            
            // Update the bullet points
            const points = selectedQuestion.text.split('\n\n')[1].split('\n').filter(point => point.trim().startsWith('-'));
            questionPoints.innerHTML = points.map(point => 
                `<li>${point.replace('-', '').trim()}</li>`
            ).join('');
        }

        // Clear previous answer
        if (textarea) {
            textarea.value = '';
            updateCharCount();
        }

        // Store the current question in sessionStorage
        try {
            // Clear any existing question data first
            sessionStorage.removeItem('currentQuestion');
            sessionStorage.removeItem('currentQuestionId');
            
            // Store the complete question object
            sessionStorage.setItem('currentQuestion', JSON.stringify(selectedQuestion));
            sessionStorage.setItem('currentQuestionId', selectedQuestion.id.toString());
            
            console.log('Stored selected question in sessionStorage:', selectedQuestion);
            
            // Verify the data was stored correctly
            const storedQuestion = JSON.parse(sessionStorage.getItem('currentQuestion'));
            console.log('Retrieved stored question:', storedQuestion);
            console.log('Selected question:', selectedQuestion);
            console.log('Are they equal?', JSON.stringify(storedQuestion) === JSON.stringify(selectedQuestion));
            
            if (JSON.stringify(storedQuestion) !== JSON.stringify(selectedQuestion)) {
                throw new Error('Question data mismatch after storage');
            }

            // Only set currentQuestion after successful storage
            currentQuestion = selectedQuestion;
        } catch (error) {
            console.error('Error storing current question:', error);
            showError('Error storing question data. Please refresh the page.');
        }
    }

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        const answer = textarea.value.trim();
        console.log('Answer:', answer);
        
        if (!answer) {
            showError('Please enter your response before submitting.');
            return;
        }

        // Get the question from sessionStorage
        const storedQuestion = JSON.parse(sessionStorage.getItem('currentQuestion'));
        if (!storedQuestion) {
            console.error('No question found in sessionStorage');
            showError('No question available. Please refresh the page.');
            return;
        }

        console.log('Stored question during submission:', storedQuestion);

        // Disable submit button and show loading state
        const submitButton = form.querySelector('.submit-button');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            console.log('Sending request to server...');
            const response = await fetch('http://localhost:8000/evaluate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: storedQuestion.text,
                    answer: answer
                })
            });

            console.log('Server response status:', response.status);

            if (!response.ok) {
                throw new Error('Failed to evaluate response');
            }

            const evaluation = await response.json();
            console.log('Evaluation received:', evaluation);

            // Store data in sessionStorage
            try {
                // Clear any existing data first
                sessionStorage.removeItem('currentEvaluation');
                sessionStorage.removeItem('currentAnswer');

                // Store new data
                sessionStorage.setItem('currentEvaluation', JSON.stringify(evaluation));
                sessionStorage.setItem('currentAnswer', answer);

                // Verify the question is still the same
                const finalQuestion = JSON.parse(sessionStorage.getItem('currentQuestion'));
                if (!finalQuestion || JSON.stringify(finalQuestion) !== JSON.stringify(storedQuestion)) {
                    throw new Error('Question data changed during submission');
                }
            } catch (error) {
                console.error('Error storing data in sessionStorage:', error);
                showError('Failed to store evaluation data. Please try again.');
                return;
            }

            // Update score and stats
            if (evaluation.success) {
                currentScore += evaluation.score;
                questionsAnswered++;
                currentStreak++;
                if (evaluation.score >= 90) {
                    perfectScoresInRow++;
                } else {
                    perfectScoresInRow = 0;
                }
            } else {
                currentStreak = 0;
                perfectScoresInRow = 0;
            }

            // Save stats to sessionStorage
            sessionStorage.setItem('score', currentScore);
            sessionStorage.setItem('questionsAnswered', questionsAnswered);
            sessionStorage.setItem('streak', currentStreak);
            sessionStorage.setItem('perfectScoresInRow', perfectScoresInRow);

            // Check for level up
            checkLevelUp();

            // Update displays
            updateScoreDisplay();
            updateLevelDisplay();
            checkAchievements();

            // Redirect to evaluation page
            window.location.href = 'evaluation.html';
        } catch (error) {
            console.error('Error submitting answer:', error);
            showError('Failed to submit answer. Please try again.');
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.insertBefore(errorDiv, document.body.firstChild);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        document.body.insertBefore(successDiv, document.body.firstChild);
        
        // Remove success message after 5 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    // Initialize
    updateScoreDisplay();
    updateLevelDisplay();
    checkAchievements();
    loadQuestion(); // Load first question
}); 