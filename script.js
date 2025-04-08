// Configuration
const GEMINI_API_KEY = 'AIzaSyBm_19XcHK3SUHa7kNwCdhe3z93eKcEixI';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// State management
let conversationState = {
  step: 1,
  monthlyExpense: null,
  riskTolerance: null,
  duration: null,
  dependents: null
};

// DOM Elements
const chatMessages = document.querySelector('.chat-messages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.querySelector('.typing-indicator');

// Initialize the chatbot
function initChatbot() {
  addMessage("👋 Hi! I'm your Financial Assistant. Let's calculate your ideal emergency fund!", 'bot');
  addMessage("💰 What are your total monthly expenses in ₹?", 'bot');
}

// Add a message to the chat
function addMessage(text, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message`;
  messageDiv.innerHTML = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
  typingIndicator.classList.remove('hidden');
}

// Hide typing indicator
function hideTypingIndicator() {
  typingIndicator.classList.add('hidden');
}

// Generate content using Gemini API
async function generateContent(prompt) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
}

// Handle user input
async function handleUserInput() {
  const input = userInput.value.trim();
  if (!input) return;

  addMessage(input, 'user');
  userInput.value = '';

  switch (conversationState.step) {
    case 1:
      await handleMonthlyExpense(input);
      break;
    case 2:
      await handleRiskTolerance(input);
      break;
    case 3:
      await handleDuration(input);
      break;
    case 4:
      await handleDependents(input);
      break;
  }
}

// Handle monthly expense input
async function handleMonthlyExpense(input) {
  const expense = parseFloat(input);
  if (isNaN(expense) || expense <= 0) {
    addMessage("❌ Please enter a valid monthly expense amount in ₹.", 'bot');
    return;
  }

  conversationState.monthlyExpense = expense;
  conversationState.step = 2;

  addMessage("🎯 What's your risk tolerance? (Low / Medium / High)", 'bot');
  addMessage("💡 Low: More conservative, Medium: Balanced, High: More aggressive", 'bot');
}

// Handle risk tolerance input
async function handleRiskTolerance(input) {
  const risk = input.toLowerCase();
  if (!['low', 'medium', 'high'].includes(risk)) {
    addMessage("❌ Please enter either Low, Medium, or High.", 'bot');
    return;
  }

  conversationState.riskTolerance = risk;
  conversationState.step = 3;

  addMessage("📅 How many months of emergency fund would you like to prepare for? (3, 6, or 12 months)", 'bot');
}

// Handle duration input
async function handleDuration(input) {
  const months = parseInt(input);
  if (isNaN(months) || months <= 0) {
    addMessage("❌ Please enter a valid number of months.", 'bot');
    return;
  }

  conversationState.duration = months;
  conversationState.step = 4;

  addMessage("👨‍👩‍👧‍👦 How many dependents do you have? (Enter 0 if none)", 'bot');
}

// Handle dependents input
async function handleDependents(input) {
  const dependents = parseInt(input);
  if (isNaN(dependents) || dependents < 0) {
    addMessage("❌ Please enter a valid number of dependents.", 'bot');
    return;
  }

  conversationState.dependents = dependents;
  showTypingIndicator();

  try {
    // Calculate emergency fund
    const baseAmount = conversationState.monthlyExpense * conversationState.duration;
    const riskMultiplier = getRiskMultiplier(conversationState.riskTolerance);
    const dependentAdjustment = 1 + (conversationState.dependents * 0.1);
    const inflationAdjustment = 1.1; // 10% inflation adjustment
    const totalAmount = baseAmount * riskMultiplier * dependentAdjustment * inflationAdjustment;

    // Generate personalized advice using Gemini
    const advicePrompt = `Based on the following financial situation, provide personalized advice for building an emergency fund:
    Monthly Expenses: ₹${conversationState.monthlyExpense}
    Risk Tolerance: ${conversationState.riskTolerance}
    Duration: ${conversationState.duration} months
    Dependents: ${conversationState.dependents}
    Total Emergency Fund Needed: ₹${Math.round(totalAmount)}
    
    Provide:
    1. A brief explanation of why this amount is recommended
    2. Investment strategy breakdown (savings account, fixed deposits, liquid mutual funds)
    3. 3-4 specific tips for saving this amount
    4. Current inflation trends in India and how they affect the calculation
    
    Format the response with emojis and bullet points for better readability.`;

    const advice = await generateContent(advicePrompt);

    hideTypingIndicator();
    addMessage(formatEmergencyFundAnalysis({
      monthlyExpense: conversationState.monthlyExpense,
      riskTolerance: conversationState.riskTolerance,
      duration: conversationState.duration,
      dependents: conversationState.dependents,
      totalAmount: totalAmount
    }), 'bot');

  } catch (error) {
    hideTypingIndicator();
    addMessage("❌ Sorry, there was an error generating the analysis. Please try again.", 'bot');
    console.error('Error:', error);
  }

  conversationState.step = 1;
}

// Get risk multiplier based on risk tolerance
function getRiskMultiplier(riskTolerance) {
  switch (riskTolerance) {
    case 'low':
      return 3;
    case 'medium':
      return 6;
    case 'high':
      return 9;
    default:
      return 3;
  }
}

function formatEmergencyFundAnalysis(data) {
  return `<div class="section-heading">💰 Emergency Fund Analysis Report</div>

<div class="sub-heading">📊 Calculation Details</div>
<div class="calculation-details">
    <div class="detail-item">
        <span class="detail-label">Monthly Expenses</span>
        <span class="detail-value">₹${data.monthlyExpense.toLocaleString()}</span>
    </div>
    <div class="detail-item">
        <span class="detail-label">Risk Tolerance</span>
        <span class="detail-value">${data.riskTolerance.charAt(0).toUpperCase() + data.riskTolerance.slice(1)}</span>
    </div>
    <div class="detail-item">
        <span class="detail-label">Duration</span>
        <span class="detail-value">${data.duration} months</span>
    </div>
    <div class="detail-item">
        <span class="detail-label">Dependents</span>
        <span class="detail-value">${data.dependents}</span>
    </div>
</div>

<div class="recommended-fund">
    <div class="sub-heading">💵 Recommended Emergency Fund</div>
    <div class="recommended-amount">₹${Math.round(data.totalAmount).toLocaleString()}</div>
</div>

<div class="sub-heading">📈 Investment Strategy</div>
<div class="investment-strategy">
    ${generateInvestmentStrategy(data.totalAmount, data.riskTolerance)}
</div>

<div class="sub-heading">🎯 Saving Tips & Timeline</div>
<div class="tips-section">
    ${generateSavingTips(data.totalAmount, data.duration)}
</div>

<div class="note-section">
    <div class="note-title">📝 Important Notes</div>
    <div class="inflation-note">
        • This calculation includes a 10% inflation adjustment to protect against rising costs
        • The investment strategy is tailored to your ${data.riskTolerance} risk tolerance
        • Consider reviewing and adjusting your fund every 6 months
    </div>
</div>`;
}

function generateInvestmentStrategy(amount, riskTolerance) {
  if (riskTolerance === 'high') {
    return `
    <div class="strategy-item">
        <div class="strategy-type"><span class="strategy-icon">🏦</span>Savings Account (30%)</div>
        <div class="strategy-amount">₹${Math.round(amount * 0.3).toLocaleString()}</div>
    </div>
    <div class="strategy-item">
        <div class="strategy-type"><span class="strategy-icon">🔒</span>Fixed Deposits (20%)</div>
        <div class="strategy-amount">₹${Math.round(amount * 0.2).toLocaleString()}</div>
    </div>
    <div class="strategy-item">
        <div class="strategy-type"><span class="strategy-icon">📈</span>Liquid Mutual Funds (50%)</div>
        <div class="strategy-amount">₹${Math.round(amount * 0.5).toLocaleString()}</div>
    </div>
    <div class="note-title">💡 Aggressive strategy optimized for higher returns</div>`;
  } else if (riskTolerance === 'medium') {
    return `
    <div class="strategy-item">
        <div class="strategy-type"><span class="strategy-icon">🏦</span>Savings Account (40%)</div>
        <div class="strategy-amount">₹${Math.round(amount * 0.4).toLocaleString()}</div>
    </div>
    <div class="strategy-item">
        <div class="strategy-type"><span class="strategy-icon">🔒</span>Fixed Deposits (30%)</div>
        <div class="strategy-amount">₹${Math.round(amount * 0.3).toLocaleString()}</div>
    </div>
    <div class="strategy-item">
        <div class="strategy-type"><span class="strategy-icon">📈</span>Liquid Mutual Funds (30%)</div>
        <div class="strategy-amount">₹${Math.round(amount * 0.3).toLocaleString()}</div>
    </div>
    <div class="note-title">💡 Balanced approach for moderate risk takers</div>`;
  } else {
    return `
    <div class="strategy-item">
        <div class="strategy-type"><span class="strategy-icon">🏦</span>Savings Account (60%)</div>
        <div class="strategy-amount">₹${Math.round(amount * 0.6).toLocaleString()}</div>
    </div>
    <div class="strategy-item">
        <div class="strategy-type"><span class="strategy-icon">🔒</span>Fixed Deposits (40%)</div>
        <div class="strategy-amount">₹${Math.round(amount * 0.4).toLocaleString()}</div>
    </div>
    <div class="note-title">💡 Conservative strategy prioritizing safety</div>`;
  }
}

function generateSavingTips(amount, duration) {
  const monthlyTarget = Math.round(amount / duration);
  return `
      <div class="tip-item">
          <span class="tip-icon">🎯</span>
          <div class="tip-text">
              <strong>Monthly Saving Target:</strong> ₹${monthlyTarget.toLocaleString()}
          </div>
      </div>
      <div class="tip-item">
          <span class="tip-icon">📱</span>
          <div class="tip-text">Use a budgeting app to track daily expenses and identify areas for saving</div>
      </div>
      <div class="tip-item">
          <span class="tip-icon">🏦</span>
          <div class="tip-text">Set up automatic transfers on payday to ensure consistent savings</div>
      </div>
      <div class="tip-item">
          <span class="tip-icon">💡</span>
          <div class="tip-text">Look for additional income sources through freelancing or part-time work</div>
      </div>
      <div class="tip-item">
          <span class="tip-icon">��</span>
          <div class="tip-text">Review and cut non-essential expenses temporarily to reach your goal faster</div>
      </div>`;
}

// Event Listeners
sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleUserInput();
  }
});

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', initChatbot); 