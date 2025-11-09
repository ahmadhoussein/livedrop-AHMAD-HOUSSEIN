# ADD THIS TO YOUR COLAB CELL 7 (after /ping endpoint)
# This is for Week 5 - the backend will do grounding, this just generates text

@app.route('/generate', methods=['POST'])
def generate():
    """Simple text completion endpoint for Week 5 backend
    Backend does its own grounding via ground-truth.json keyword matching,
    then sends pre-grounded prompt here for completion.
    """
    try:
        data = request.json or {}
        prompt = data.get('prompt', '').strip()
        max_new_tokens = int(data.get('max_new_tokens', 500))
        temperature = float(data.get('temperature', 0.3))
        
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400
        
        # Use the existing generate_response method
        response_text = rag_system.generate_response(
            prompt, 
            max_new_tokens=max_new_tokens, 
            temperature=temperature
        )
        
        return jsonify({"text": response_text})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

print("✅ /generate endpoint added for Week 5")
