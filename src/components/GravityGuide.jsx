import React, { useState, useRef, useEffect } from 'react';

const CHAT_QA_MAP = [
  {
    question: 'What are your opening hours?',
    answer: 'Anti Gravity Dundee is open daily! Monday to Friday: 11:00 AM - 9:00 PM, Saturday & Sunday: 9:00 AM - 10:00 PM. Note that our Nebula Glow Nights occur on Friday and Saturday from 8:00 PM onwards!'
  },
  {
    question: 'Are there age or weight limits?',
    answer: 'Safety is our absolute core value. The trampoline grid supports jumpers up to 120kg. Jumpers must be 4 years or older. The Aerial Silk & Hoops nest is recommended for ages 14 and above.'
  },
  {
    question: 'What should I wear for a session?',
    answer: 'Wear comfortable athletic clothing without sharp buttons, studs, or metal zippers. AntiGravity safety-grip traction socks are mandatory in active zones and cost £2.50 at reception (yours to keep for future visits!).'
  },
  {
    question: 'Do you host birthday parties?',
    answer: 'Yes, we host spectacular neon glow parties! Packages include 60 mins of arena jumping, custom neon face paint, dedicated glowing party rooms, cyber pizza platters, and glowing neon mocktails.'
  }
];

const GravityGuide = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "Greetings, cadet! I'm your digital Gravity Guide. Ask me anything about our sessions, safety guidelines, or packages!" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const simulateBotResponse = (userText) => {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      
      // Match question from FAQ or give general helpful answer
      const matchedQA = CHAT_QA_MAP.find(
        (qa) => userText.toLowerCase().includes(qa.question.toLowerCase()) || 
                qa.question.toLowerCase().includes(userText.toLowerCase())
      );

      const responseText = matchedQA 
        ? matchedQA.answer 
        : "That's a stellar query! While I configure my gravity gyroscopes, you can check out our Attractions map above or jump over to our Booking Center to secure your slot directly.";

      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, sender: 'bot', text: responseText }
      ]);
    }, 1000);
  };

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, sender: 'user', text: textToSend }
    ]);
    
    setInputValue('');
    simulateBotResponse(textToSend);
  };

  const handleFaqClick = (faqQuestion) => {
    // Add user message with FAQ question
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, sender: 'user', text: faqQuestion }
    ]);
    simulateBotResponse(faqQuestion);
  };

  return (
    <section id="guide" className="section-container">
      <div className="section-header">
        <span className="section-tag">Instant Help Desk</span>
        <h2 className="section-title">Gravity Guide AI</h2>
        <p className="section-desc">
          Have queries about safety protocols, schedules, or park facilities? Chat with our digital AI assistant below.
        </p>
      </div>

      <div className="chat-layout">
        {/* FAQ Quick Links Sidebar */}
        <div className="chat-faq-sidebar glass-panel">
          <h3 className="faq-title">Quick Queries</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Click any common question to instantly query the Gravity Guide:
          </p>
          {CHAT_QA_MAP.map((item, index) => (
            <button 
              key={index} 
              className="faq-item-btn"
              onClick={() => handleFaqClick(item.question)}
            >
              {item.question}
            </button>
          ))}
        </div>

        {/* Dynamic Chat Window */}
        <div className="chat-window glass-panel">
          <div className="chat-header">
            <div className="bot-avatar">🤖</div>
            <div className="bot-info">
              <h4>Gravity Guide</h4>
              <div className="bot-status">Online</div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            
            {isTyping && (
              <div className="chat-bubble bot">
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form 
            className="chat-input-bar" 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
          >
            <input 
              type="text" 
              className="chat-input"
              placeholder="Ask about hours, wear, limits..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit" 
              className="btn-send-chat"
              disabled={isTyping || !inputValue.trim()}
              aria-label="Send Message"
            >
              ➤
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default GravityGuide;
