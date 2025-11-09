const express = require('express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { classifyIntent, INTENTS } = require('./intent-classifier');
const functionRegistry = require('./function-registry');
const citationValidator = require('./citation-validator');
const synonyms = require('./synonyms');

const router = express.Router();

// Load configuration
let assistantConfig = null;
let knowledgeBase = null;

/**
 * Load YAML configuration
 */
function loadConfig() {
  try {
    // Try local docs first (for deployed environment), then monorepo root
    const localPath = path.join(__dirname, '../../docs/prompts.yaml');
    const rootPath = path.join(__dirname, '../../../../docs/prompts.yaml');
    const yamlPath = fs.existsSync(localPath) ? localPath : rootPath;
    
    if (fs.existsSync(yamlPath)) {
      const yamlContent = fs.readFileSync(yamlPath, 'utf8');
      assistantConfig = yaml.load(yamlContent);
      console.log('✅ Assistant configuration loaded from:', yamlPath);
    } else {
      console.warn('⚠️ prompts.yaml not found, using defaults');
      assistantConfig = getDefaultConfig();
    }
  } catch (error) {
    console.error('Error loading prompts.yaml:', error);
    assistantConfig = getDefaultConfig();
  }
}

/**
 * Load knowledge base
 */
function loadKnowledgeBase() {
  try {
    // Try local docs first (for deployed environment), then monorepo root
    const localPath = path.join(__dirname, '../../docs/ground-truth.json');
    const rootPath = path.join(__dirname, '../../../../docs/ground-truth.json');
    const kbPath = fs.existsSync(localPath) ? localPath : rootPath;
    
    if (fs.existsSync(kbPath)) {
      const kbContent = fs.readFileSync(kbPath, 'utf8');
      knowledgeBase = JSON.parse(kbContent);
      console.log(`✅ Knowledge base loaded: ${knowledgeBase.length} policies from:`, kbPath);
    } else {
      console.warn('⚠️ ground-truth.json not found at either location');
      knowledgeBase = [];
    }
  } catch (error) {
    console.error('Error loading ground-truth.json:', error);
    knowledgeBase = [];
  }
}

/**
 * Get default configuration if YAML not found
 */
function getDefaultConfig() {
  return {
    assistant: {
      name: 'Ahmad',
      role: 'Customer Support Specialist',
      company: 'Ahmad Store',
      personality: ['helpful', 'professional', 'friendly', 'efficient']
    },
    intents: {
      policy_question: {
        behavior: 'Provide accurate policy information with citations',
        tone: 'informative and clear'
      },
      order_status: {
        behavior: 'Look up order information and provide status',
        tone: 'professional and helpful'
      },
      product_search: {
        behavior: 'Help find products that match customer needs',
        tone: 'enthusiastic and helpful'
      },
      complaint: {
        behavior: 'Listen with empathy and offer solutions',
        tone: 'empathetic and solution-focused'
      },
      chitchat: {
        behavior: 'Be friendly but redirect to support topics',
        tone: 'warm and professional'
      },
      off_topic: {
        behavior: 'Politely decline and redirect to e-commerce support',
        tone: 'polite and professional'
      },
      violation: {
        behavior: 'Set boundaries firmly but professionally',
        tone: 'firm and professional'
      }
    },
    rules: [
      'Never reveal you are an AI or language model',
      'Never mention ChatGPT, Claude, Llama, or any AI model names',
      'Always respond as a human support specialist',
      'Maximum 2 function calls per query',
      'Keep responses concise and helpful',
      'Always use citations when referencing policies'
    ]
  };
}

/**
 * Build an assistive clarification plan when context is insufficient
 */
function buildAssistivePlan(userQuery) {
  const lang = synonyms.detectLanguage(userQuery);
  if (lang === 'ar') {
    return [
      'المعلومة غير كافية حالياً لإجابة دقيقة.',
      'سؤال توضيحي: هل يمكنك تحديد المطلوب بدقة (مثال: سياسة الإرجاع لفئة معيّنة، أو رقم الطلب الكامل)؟',
      'خطوات مقترحة:',
      '- أضف كلمات مفتاحية أدق (مثال: سياسة الإرجاع للإلكترونيات).',
      '- إن كان استعلامك عن الطلب، أرسل رقم الطلب كاملاً (قد يكون 24 خانة).',
      '- يمكنك إعادة الصياغة باختصار باللغة الإنجليزية لزيادة الدقة عند الحاجة.'
    ].join('\n');
  }
  return [
    'The available context is insufficient for a precise answer.',
    'Clarifying question: Could you specify exactly what you need (e.g., return policy for a specific category, or your full order ID)?',
    'Next steps:',
    '- Add more precise keywords (e.g., return policy for electronics).',
    '- If this is about an order, share the full order ID (often 24 chars).',
    '- Optionally rephrase concisely for better results.'
  ].join('\n');
}

/**
 * Call LLM service with fallback chain: Custom → Groq → Hugging Face
 */
async function callLLM(prompt, opts = {}) {
  // Try custom LLM endpoint first (if configured)
  const base = process.env.LLM_ENDPOINT && process.env.LLM_ENDPOINT.trim();
  if (base) {
    const url = `${base.replace(/\/+$/, '')}/generate`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          max_tokens: Number(opts.maxTokens || 256),
          temperature: Number(opts.temperature || 0.2)
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = (data && (data.text || data.answer || '')) || '';
        if (result) return result;
      }
    } catch (err) {
      console.error('Custom LLM call failed:', err.message || err);
    }
  }
  
  // Try Groq (fast and free) second
  const groqResult = await callGroq(prompt, opts);
  if (groqResult) return groqResult;
  
  // Try Hugging Face last
  const hfResult = await callHuggingFace(prompt, opts);
  if (hfResult) return hfResult;
  
  // No LLM available
  return '';
}

/**
 * Groq API (Fast and Free)
 */
async function callGroq(prompt, opts = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  
  if (!apiKey) {
    console.warn('⚠️ No GROQ_API_KEY configured, skipping Groq call');
    return '';
  }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Number(opts.maxTokens || 256),
        temperature: Number(opts.temperature || 0.2)
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq ${response.status}: ${error}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  } catch (e) {
    console.error('Groq call failed:', e && e.message ? e.message : e);
    return '';
  }
}

/**
 * Hugging Face Inference API fallback
 */
async function callHuggingFace(prompt, opts = {}) {
  const token = process.env.HUGGINGFACE_TOKEN || process.env.HF_TOKEN;
  const model = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3';
  
  if (!token) {
    console.warn('⚠️ No HUGGINGFACE_TOKEN configured, skipping LLM call');
    return '';
  }
  
  try {
    const url = `https://api-inference.huggingface.co/models/${model}`;
    const sys = 'You are a helpful retail assistant. Answer concisely and accurately.';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        inputs: `${sys}\n\nUser: ${prompt}\n\nAssistant:`,
        parameters: {
          max_new_tokens: Number(opts.maxTokens || 256),
          temperature: Number(opts.temperature || 0.2),
          top_p: 0.9,
          repetition_penalty: 1.05
        }
      })
    });
    
    const data = await res.json();
    
    // Handle error response from HF
    if (data.error) {
      console.error('HF API error:', data.error);
      return '';
    }
    
    // Parse HF response
    if (Array.isArray(data) && data[0] && typeof data[0] === 'object') {
      let text = (data[0].generated_text || data[0].text || '').trim();
      
      // HF returns full conversation - extract only assistant's response
      // Remove the prompt part if it's included
      if (text.includes('Assistant:')) {
        const parts = text.split('Assistant:');
        text = parts[parts.length - 1].trim();
      }
      
      return text;
    }
    return '';
  } catch (e) {
    console.error('HF call failed:', e && e.message ? e.message : e);
    return '';
  }
}

/**
 * Handle policy questions with knowledge base
 */
async function handlePolicyQuestion(query) {
  // Find relevant policies from knowledge base
  const relevantPolicies = citationValidator.findRelevantPolicies(query);
  
  if (relevantPolicies.length === 0) {
    // Provide a reasoning-aware assistive plan instead of a dead-end
    return buildAssistivePlan(query);
  }

  // Build grounded prompt for LLM requiring citations
  const identity = assistantConfig?.assistant || { name: 'Ahmad', role: 'Support', company: 'Ahmad Store' };
  const rules = assistantConfig?.rules || [];
  const system = [
    `You are ${identity.name}, a ${identity.role} at ${identity.company}.`,
    'Answer ONLY using the provided policy snippets.',
    'When you reference policy info, you MUST cite at least one [PolicyID] from the provided context.',
    'Be concise and helpful. Never mention being an AI or model.'
  ].concat(rules || []).join('\n');

  const contextLines = relevantPolicies.map(p => `- [${p.id}] ${p.answer}`);
  const contextBlock = contextLines.join('\n');
  const prompt = [
    system,
    '',
    'Context:',
    contextBlock,
    '',
    `User question: ${query}`,
    '',
    'Answer (include [PolicyID] citations from Context):'
  ].join('\n');

  const llmText = await callLLM(prompt);

  // If LLM returns nothing (not configured), use first policy's answer directly
  if (!llmText || llmText.trim().length === 0) {
    const topPolicy = relevantPolicies[0];
    return `${topPolicy.answer} [${topPolicy.id}]`;
  }

  // Ensure at least one citation exists; if not, append the top policy id
  const citations = citationValidator.extractCitations(llmText || '');
  let finalText = llmText || '';
  if (!citations || citations.length === 0) {
    finalText = `${finalText ? finalText + ' ' : ''}[${relevantPolicies[0].id}]`;
  }
  return finalText.trim();
}

/**
 * Handle order status queries
 */
async function handleOrderStatus(query) {
  // Extract order ID from query
  const orderIdPattern = /\b(\d{10,}|[a-f0-9]{24})\b/i;
  const match = query.match(orderIdPattern);
  
  if (!match) {
    const lang = synonyms.detectLanguage(query);
    return lang === 'ar'
      ? 'يسعدني التحقق من حالة طلبك. من فضلك زوّدني برقم الطلب الكامل (غالباً يكون طويلاً أو 24 خانة).'
      : "I'd be happy to check your order status. Please provide your full order ID (often a long code, e.g., 24 characters).";
  }
  
  const orderId = match[1];
  
  // Execute function to get order status
  const result = await functionRegistry.execute('getOrderStatus', { orderId });
  
  if (result.success) {
    const order = result.result;
    return `📦 **Order Status Update**\n\n` +
           `Order ID: ${order.orderId}\n` +
           `Status: **${order.status}**\n` +
           `Customer: ${order.customerName}\n` +
           `Total: $${order.total}\n` +
           `Carrier: ${order.carrier || 'Standard Shipping'}\n` +
           `Estimated Delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}\n\n` +
           `Your order is being processed and you'll receive updates as it progresses.`;
  } else {
    return `I couldn't find an order with ID: ${orderId}. Please double-check the order ID or contact our support team.`;
  }
}

/**
 * Generate response based on intent
 */
async function generateResponse(userInput, intent, functionResults = []) {
  const config = assistantConfig.assistant || { name: 'Ahmad', role: 'Support Specialist', company: 'Ahmad Store' };
  const intentConfig = assistantConfig.intents[intent.intent];
  
  let response = {
    text: '',
    intent: intent.intent,
    confidence: intent.confidence,
    functionsExecuted: [],
    citations: [],
    citationValidation: null
  };
  
  switch (intent.intent) {
    case INTENTS.POLICY_QUESTION:
      // Expand query to improve KB recall before LLM
      const variants = synonyms.expandQuery(userInput);
      let policyResponse = '';
      for (const v of variants) {
        policyResponse = await handlePolicyQuestion(v);
        if (policyResponse && !/could not find|insufficient/i.test(policyResponse)) break;
      }
      response.text = policyResponse;
      
      // Validate citations
      const validation = citationValidator.validateResponse(policyResponse);
      response.citations = validation.extractedCitations || [];
      response.citationValidation = validation;
      break;
      
    case INTENTS.ORDER_STATUS:
      const orderResponse = await handleOrderStatus(userInput);
      response.text = orderResponse;
      response.functionsExecuted.push('getOrderStatus');
      
      // Check if response contains any policy citations
      if (orderResponse.includes('[')) {
        const validation = citationValidator.validateResponse(orderResponse);
        response.citations = validation.extractedCitations || [];
        response.citationValidation = validation;
      }
      break;
      
    case INTENTS.PRODUCT_SEARCH:
      if (functionResults.length > 0 && functionResults[0].success) {
        const result = functionResults[0].result;
        if (result.products.length > 0) {
          // Summarize with LLM for a concise, friendly response
          const list = result.products.slice(0, 5).map(p => `- ${p.name} ($${p.price}) | ${p.category} | stock: ${p.stock}`).join('\n');
          const prompt = [
            `${config.name} is a ${config.role} at ${config.company}. Write a concise helpful summary of top matching products for the customer.`,
            'Do not invent details. Use exactly the provided list. Keep under 120 words.',
            '',
            'Products:',
            list,
            '',
            'Answer:'
          ].join('\n');
          const llmText = await callLLM(prompt);
          response.text = (llmText || '').trim() || `Found ${result.count} matching products. Would you like more details about any of them?`;
        } else {
          const lang = synonyms.detectLanguage(userInput);
          response.text = lang === 'ar'
            ? [
                'لم أعثر على منتجات مطابقة للبحث.',
                'جرّب كلمات أدق (مثال: الفئة/الميزانية/العلامة).',
                'يمكنك ذكر حدود السعر أو الاستخدام (سماعات رياضية، تحت 50$).'
              ].join('\n')
            : [
                "I couldn't find products matching your query.",
                'Try more precise keywords (category/brand/budget).',
                'You can add price limits or use-case (e.g., sports headphones under $50).'
              ].join('\n');
        }
      } else {
        const lang = synonyms.detectLanguage(userInput);
        response.text = lang === 'ar'
          ? 'أستطيع مساعدتك بالعثور على المنتجات! صف احتياجك أو اذكر اسم المنتج/الفئة/الميزانية.'
          : 'I can help you find products! Describe your need or provide product/category/budget.';
      }
      break;
      
    case INTENTS.COMPLAINT:
      // Keep deterministic empathetic response
      response.text = `I'm really sorry for the trouble you're experiencing. Your satisfaction is very important to us and I want to make this right.\n\n` +
        `Could you share more details about the issue? If it's about an order, please include the order ID so I can investigate immediately.`;
      break;
      
    case INTENTS.CHITCHAT:
      // Use LLM for more natural chitchat responses
      try {
        const lang = synonyms.detectLanguage(userInput);
        // Handle personality as object or array
        const personality = config.personality ? 
          (Array.isArray(config.personality) ? config.personality.join(', ') : 
           Object.entries(config.personality).filter(([k,v]) => v).map(([k]) => k).join(', ')) : 
          'friendly, professional';
        
        const prompt = [
          `You are ${config.name}, a ${config.role} at ${config.company}.`,
          'Personality: ' + personality,
          '',
          'Respond warmly to the customer greeting. Keep it brief (1-2 sentences).',
          'Invite them to ask about products, orders, or policies.',
          lang === 'ar' ? 'Respond in Arabic.' : 'Respond in English.',
          '',
          `Customer: ${userInput}`,
          'Your response:'
        ].join('\n');
        
        const llmText = await callLLM(prompt, { maxTokens: 150, temperature: 0.7 });
        
        if (llmText && llmText.trim()) {
          response.text = llmText.trim();
        } else {
          // Fallback to template if LLM fails
          response.text = lang === 'ar'
            ? `مرحباً! أنا ${config.name}، ${config.role} في ${config.company}. أستطيع مساعدتك في المنتجات والطلبات والسياسات. كيف يمكنني مساعدتك؟`
            : `Hello! I'm ${config.name}, your ${config.role} at ${config.company}. I can help with products, orders, and policies. How can I assist you today?`;
        }
      } catch (err) {
        console.error('Chitchat LLM error:', err);
        const lang = synonyms.detectLanguage(userInput);
        response.text = lang === 'ar'
          ? `مرحباً! أنا ${config.name}، ${config.role} في ${config.company}. أستطيع مساعدتك في المنتجات والطلبات والسياسات. كيف يمكنني مساعدتك؟`
          : `Hello! I'm ${config.name}, your ${config.role} at ${config.company}. I can help with products, orders, and policies. How can I assist you today?`;
      }
      break;
      
    case INTENTS.OFF_TOPIC:
      // Use LLM for more natural off-topic redirection
      try {
        const lang = synonyms.detectLanguage(userInput);
        const prompt = [
          `You are ${config.name}, a ${config.role} at ${config.company}.`,
          'The customer asked something unrelated to e-commerce (shopping, products, orders, policies).',
          '',
          'Politely acknowledge their question but redirect them to topics you can help with.',
          'Keep it friendly and brief (1-2 sentences).',
          lang === 'ar' ? 'Respond in Arabic.' : 'Respond in English.',
          '',
          `Customer question: ${userInput}`,
          'Your response:'
        ].join('\n');
        
        const llmText = await callLLM(prompt, { maxTokens: 150, temperature: 0.7 });
        
        if (llmText && llmText.trim()) {
          response.text = llmText.trim();
        } else {
          response.text = lang === 'ar'
            ? `أقدر سؤالك، لكنني متخصص في ${config.company} - المنتجات والطلبات والسياسات. هل يمكنني مساعدتك في شيء متعلق بمتجرنا؟`
            : `I appreciate your question, but I'm focused on ${config.company} shopping, orders, and policies. Is there anything related to our store I can help you with today?`;
        }
      } catch (err) {
        console.error('Off-topic LLM error:', err);
        const lang = synonyms.detectLanguage(userInput);
        response.text = lang === 'ar'
          ? `أقدر سؤالك، لكنني متخصص في ${config.company} - المنتجات والطلبات والسياسات. هل يمكنني مساعدتك في شيء متعلق بمتجرنا؟`
          : `I appreciate your question, but I'm focused on ${config.company} shopping, orders, and policies. Is there anything related to our store I can help you with today?`;
      }
      break;
      
    case INTENTS.VIOLATION:
      response.text = `I understand you may be frustrated, but I need to maintain a professional conversation. I'm here to help with your ${config.company} needs. Please let me know how I can assist with your shopping or order concerns.`;
      break;
      
    default:
      response.text = `I'm here to help! You can ask me about products, check your order status, or learn about our policies. What would you like to know?`;
  }
  
  return response;
}

/**
 * Main assistant endpoint
 */
router.post('/chat', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { message, context = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: {
          code: 'MISSING_MESSAGE',
          message: 'Message is required'
        }
      });
    }
    
    // Classify intent
    const intent = classifyIntent(message);
    console.log(`Intent classified: ${intent.intent} (confidence: ${intent.confidence})`);
    
    // Prepare to track function calls
    const functionsCalled = [];
    const functionResults = [];
    
    // Execute functions based on intent (max 2 function calls)
    if (intent.intent === INTENTS.ORDER_STATUS) {
      // Extract order ID from message
      const orderIdMatch = message.match(/[0-9a-f]{24}/i);
      if (orderIdMatch) {
        const result = await functionRegistry.execute('getOrderStatus', {
          orderId: orderIdMatch[0]
        });
        functionsCalled.push('getOrderStatus');
        functionResults.push(result);
      }
    } else if (intent.intent === INTENTS.PRODUCT_SEARCH) {
      // Extract search query
      const searchMatch = message.match(/(?:looking for|search|find|show me)\s+(.+)/i);
      if (searchMatch) {
        const result = await functionRegistry.execute('searchProducts', {
          query: searchMatch[1],
          limit: 5
        });
        functionsCalled.push('searchProducts');
        functionResults.push(result);
      }
    }
    
    // Generate response
    const response = await generateResponse(message, intent, functionResults);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Update assistant stats (fire and forget)
    try {
      await fetch(`http://127.0.0.1:${process.env.PORT || 3001}/api/dashboard/assistant-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: intent.intent,
          functionsCalled,
          responseTime
        })
      });
    } catch (error) {
      // Ignore stats update errors
    }
    
    res.json({
      response: response.text,
      intent: response.intent,
      confidence: response.confidence,
      functionsExecuted: response.functionsExecuted,
      citations: response.citations,
      citationValidation: response.citationValidation,
      responseTime,
      assistant: {
        name: (assistantConfig.assistant || {}).name || 'Ahmad',
        role: (assistantConfig.assistant || {}).role || 'Support Specialist'
      }
    });
  } catch (error) {
    console.error('Assistant error:', error);
    res.status(500).json({
      error: {
        code: 'ASSISTANT_ERROR',
        message: 'Failed to process your request'
      }
    });
  }
});

/**
 * Lightweight search endpoint to power UI autosuggest
 */
router.get('/search/policies', (req, res) => {
  try {
    const q = String(req.query.q || '').toLowerCase();
    if (!knowledgeBase || knowledgeBase.length === 0) return res.json([]);
    const results = knowledgeBase
      .map((p, i) => ({ i, score: (p.question + ' ' + p.answer).toLowerCase().includes(q) ? 1 : 0, p }))
      .filter(r => r.score > 0)
      .slice(0, 10)
      .map(r => ({ id: r.p.id, question: r.p.question, category: r.p.category }));
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: 'SEARCH_FAILED' });
  }
});

/**
 * Hot reload KB without server restart
 */
router.post('/kb/reload', (req, res) => {
  try {
    loadKnowledgeBase();
    citationValidator.loadKnowledgeBase();
    res.json({ ok: true, size: knowledgeBase.length });
  } catch (e) {
    res.status(500).json({ error: 'KB_RELOAD_FAILED' });
  }
});

/**
 * Get assistant information
 */
router.get('/info', (req, res) => {
  const config = assistantConfig.assistant || { name: 'Ahmad', role: 'Support Specialist', company: 'Ahmad Store' };
  res.json({
    assistant: config,
    supportedIntents: Object.keys(INTENTS).map(k => ({
      name: INTENTS[k],
      description: assistantConfig.intents[INTENTS[k]]?.behavior || 'No description'
    })),
    availableFunctions: functionRegistry.getAllSchemas(),
    knowledgeBaseSize: knowledgeBase.length,
    knowledgeBaseStats: citationValidator.getKnowledgeBaseStats()
  });
});

/**
 * Get knowledge base stats
 */
router.get('/kb/stats', (req, res) => {
  res.json(citationValidator.getKnowledgeBaseStats());
});

/**
 * Diagnostic endpoint to check LLM configuration
 */
router.get('/debug/llm-config', (req, res) => {
  res.json({
    hasHuggingFaceToken: !!(process.env.HUGGINGFACE_TOKEN || process.env.HF_TOKEN),
    hasGroqToken: !!process.env.GROQ_API_KEY,
    hasCustomLLM: !!process.env.LLM_ENDPOINT,
    hfModel: process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3',
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    tokenPrefix: process.env.HUGGINGFACE_TOKEN ? process.env.HUGGINGFACE_TOKEN.substring(0, 4) + '...' : 'none'
  });
});

// Initialize on module load
loadConfig();
loadKnowledgeBase();

module.exports = {
  assistantRouter: router
};
