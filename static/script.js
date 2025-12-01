let allCards = [];
let selectedFile = null;

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    event.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// File input handler
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        selectedFile = file;
        const fileName = document.getElementById('fileName');
        fileName.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        document.getElementById('generateBtn').disabled = false;
    }
});

// Generate cards from file upload
async function generateCardsFromFile() {
    if (!selectedFile) {
        showError('Please select a file first');
        return;
    }

    const numCards = document.getElementById('numCards').value;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('num_cards', numCards);

    showLoading();
    hideError();

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.status === 401) {
            // Redirect to login
            window.location.href = data.redirect || '/login';
            return;
        }

        if (data.success) {
            allCards = data.cards;
            displayCards(allCards);
            
            // Update credits display
            if (data.credits_remaining !== undefined) {
                updateCreditsDisplay(data.credits_remaining);
                showSuccess(`Generated ${data.total_cards} cards! Used ${data.credits_used} credits.`);
            }
        } else {
            showError(data.error || 'Failed to generate cards');
            
            // Show recharge option if insufficient credits
            if (data.show_recharge) {
                setTimeout(() => {
                    if (confirm('Go to pricing page to buy more credits?')) {
                        window.location.href = '/pricing';
                    }
                }, 1000);
            }
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Generate cards from text input
async function generateCardsFromText() {
    const textInput = document.getElementById('textInput').value;
    const numCards = document.getElementById('numCardsText').value;

    if (!textInput || textInput.trim().length < 100) {
        showError('Please enter at least 100 characters of text');
        return;
    }

    showLoading();
    hideError();

    try {
        const response = await fetch('/generate-from-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: textInput,
                num_cards: parseInt(numCards)
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = data.redirect || '/login';
            return;
        }

        if (data.success) {
            allCards = data.cards;
            displayCards(allCards);
            
            if (data.credits_remaining !== undefined) {
                updateCreditsDisplay(data.credits_remaining);
                showSuccess(`Generated ${data.total_cards} cards! Used ${data.credits_used} credits.`);
            }
        } else {
            showError(data.error || 'Failed to generate cards');
            
            if (data.show_recharge) {
                setTimeout(() => {
                    if (confirm('Go to pricing page to buy more credits?')) {
                        window.location.href = '/pricing';
                    }
                }, 1000);
            }
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Display cards in the UI
function displayCards(cards) {
    const cardsContainer = document.getElementById('cardsContainer');
    const cardsGrid = document.getElementById('cards');
    const cardCount = document.getElementById('cardCount');

    cardCount.textContent = cards.length;
    cardsGrid.innerHTML = '';

    cards.forEach((card, index) => {
        const cardElement = createCardElement(card, index);
        cardsGrid.appendChild(cardElement);
    });

    cardsContainer.classList.remove('hidden');
    
    // Scroll to cards
    cardsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Create individual card element
function createCardElement(card, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `card ${card.importance || 'medium'}`;
    cardDiv.dataset.importance = card.importance || 'medium';

    const badgeClass = `badge-${card.importance || 'medium'}`;

    cardDiv.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${card.title}</h3>
            <span class="card-badge ${badgeClass}">${card.importance || 'medium'}</span>
        </div>
        <span class="card-category">${card.category || 'General'}</span>
        <div class="card-content">${card.content}</div>
    `;

    return cardDiv;
}

// Filter cards by importance
function filterCards() {
    const filter = document.getElementById('importanceFilter').value;
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        if (filter === 'all' || card.dataset.importance === filter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Export cards
function exportCards(format) {
    if (allCards.length === 0) {
        showError('No cards to export');
        return;
    }

    if (format === 'json') {
        const dataStr = JSON.stringify(allCards, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        downloadFile(dataBlob, 'study-cards.json');
    } else if (format === 'text') {
        let textContent = '📚 STUDY CARDS\n';
        textContent += '=' .repeat(50) + '\n\n';

        allCards.forEach((card, index) => {
            textContent += `Card ${index + 1}: ${card.title}\n`;
            textContent += `Category: ${card.category}\n`;
            textContent += `Importance: ${card.importance}\n`;
            textContent += '-'.repeat(50) + '\n';
            textContent += card.content + '\n\n';
        });

        const dataBlob = new Blob([textContent], { type: 'text/plain' });
        downloadFile(dataBlob, 'study-cards.txt');
    }
}

// Download file helper
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Print cards
function printCards() {
    if (allCards.length === 0) {
        showError('No cards to print');
        return;
    }
function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '✅ ' + message;
    errorDiv.style.background = '#d1fae5';
    errorDiv.style.color = '#059669';
    errorDiv.style.borderLeftColor = '#059669';
    errorDiv.classList.remove('hidden');
    
    setTimeout(() => {
        errorDiv.classList.add('hidden');
        errorDiv.style.background = '';
        errorDiv.style.color = '';
        errorDiv.style.borderLeftColor = '';
    }, 5000);
}
// UI helper functions
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '❌ ' + message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}
