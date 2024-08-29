// src/components/MealAssistant.js
'use client'

import React, { useState } from 'react';
import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { ToolMessage } from "@langchain/core/messages";
import {
  FindRecipesByIngredientsTool,
  ComplexRecipeSearchTool,
  GetRecipeInformationTool,
  GetRecipeInstructionsTool,
  GoogleSearchTool
} from '@/lib/meal-assistant-tools';

export default function MealAssistant() {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [caloriesLeft, setCaloriesLeft] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChatStarted, setIsChatStarted] = useState(false);

  const handleCaloriesSubmit = (e) => {
    e.preventDefault();
    if (caloriesLeft) {
      setIsChatStarted(true);
      setChatHistory([{ role: 'assistant', content: `Great! You have ${caloriesLeft} calories left for the day. How can I help you with meal planning?` }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
  
    setLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', content: userInput }]);

    try {
      const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
      
      if (!groqApiKey) {
        throw new Error('Groq API key not found in environment variables.');
      }

      const model = new ChatGroq({
        temperature: 0.7,
        modelName: 'llama-3.1-70b-versatile',
        streaming: true,
        maxTokens: 1000,
        apiKey: groqApiKey, 
      });

      const tools = [
        FindRecipesByIngredientsTool,
        ComplexRecipeSearchTool,
        GetRecipeInformationTool,
        GetRecipeInstructionsTool,
        GoogleSearchTool
      ];

      const llmWithTools = model.bindTools(tools);

      const prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          `You are a helpful meal planning assistant. The user has ${caloriesLeft} calories left for the day. 
          Follow these steps:
          1. Ask if they want to cook or eat out today.
          
          If they want to cook:
          2. Ask if they have specific ingredients, a cuisine/diet preference, or a meal in mind.
          3. Use the appropriate tool based on their response:
             - FindRecipesByIngredients for specific ingredients
             - ComplexRecipeSearch for cuisine/diet preferences or specific meals
          4. Use GetRecipeInformation to check if recipes fit their calorie needs.
          5. If a recipe doesn't fit, suggest adjusting portions or finding alternatives.
          6. Once they choose a recipe, use GetRecipeInstructions for cooking steps.
          
          If they want to eat out:
          2. Ask for their preferred cuisine or restaurant type.
          3. Use GoogleSearch to find restaurants in Singapore.
          4. Suggest options and ask for their choice.
          
          Always be concise and relevant. Ask for clarification if needed. 
          Do not invent information or recipes. Only use data from the tools.`
        ),
        ...chatHistory.map(msg => 
          msg.role === 'user' 
            ? HumanMessagePromptTemplate.fromTemplate(msg.content)
            : SystemMessagePromptTemplate.fromTemplate(msg.content)
        ),
        HumanMessagePromptTemplate.fromTemplate("{input}")
      ]);
  
      const chain = prompt.pipe(llmWithTools);

      const initialResponse = await chain.invoke({ input: userInput });
      console.log('Initial response:', initialResponse);
  
      // Add the AI's response to the chat history
      if (initialResponse.content) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: initialResponse.content }]);
      }
  
      let toolResults = [];
  
      if (initialResponse.additional_kwargs && initialResponse.additional_kwargs.tool_calls) {
        for (const toolCall of initialResponse.additional_kwargs.tool_calls) {
          if (toolCall.function && toolCall.function.name) {
            const tool = tools.find(t => t.name === toolCall.function.name);
            if (tool) {
              try {
                const args = JSON.parse(toolCall.function.arguments);
                const toolOutput = await tool.func(args.input);
                let parsedToolOutput = toolOutput;
                if (typeof toolOutput === 'string' && toolOutput.startsWith('{') && toolOutput.endsWith('}')) {
                  parsedToolOutput = JSON.parse(toolOutput);
                }
                const toolMessage = new ToolMessage({
                  content: parsedToolOutput.text || parsedToolOutput,
                  tool_call_id: toolCall.id,
                  name: toolCall.function.name,
                });
                toolResults.push(toolMessage);
              } catch (error) {
                console.error(`Error executing tool ${toolCall.function.name}:`, error);
                const errorToolMessage = new ToolMessage({
                  content: `Error: ${error.message}`,
                  tool_call_id: toolCall.id,
                  name: toolCall.function.name,
                  status: "error",
                });
                toolResults.push(errorToolMessage);
              }
            }
          }
        }
      }
  
      if (toolResults.length > 0) {
        setChatHistory(prev => [...prev, ...toolResults]);
        console.log('Tool results:', toolResults);
  
        const toolResultsPrompt = toolResults.map(result => `${result.name}: ${result.content}`).join('\n');
        
        const finalResponse = await chain.invoke({
          input: `Based on these tool results, provide a summary and recommendation for the user:\n${toolResultsPrompt}`
        });
  
        if (finalResponse.content) {
          setChatHistory(prev => [...prev, { role: 'assistant', content: finalResponse.content }]);
        }
      }
    } catch (error) {
      console.error('Error processing request:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: `I'm sorry, there was an error processing your request: ${error.message}` }]);
    } finally {
      setLoading(false);
      setUserInput('');
    }
  };
  
  

    return (
        <div className="flex flex-col h-full">
          {!isChatStarted ? (
            <form onSubmit={handleCaloriesSubmit} className="mb-4">
              <label htmlFor="calories" className="block mb-2">Enter your remaining calories for the day:</label>
              <input
                type="number"
                id="calories"
                value={caloriesLeft}
                onChange={(e) => setCaloriesLeft(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
              <button type="submit" className="mt-2 bg-[#3C4E2A] text-[#F5E9D4] px-4 py-2 rounded">
                Start Meal Planning
              </button>
            </form>
          ) : (
            <>
              <div className="flex-grow overflow-y-auto mb-4 p-4 bg-gray-100 rounded">
                {chatHistory.map((msg, index) => (
                  <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-block p-2 rounded ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white'}`}>
                      {msg.content}
                    </span>
                  </div>
                ))}
                {loading && <div className="text-center">Thinking...</div>}
              </div>
              <form onSubmit={handleSubmit} className="flex">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask about meals or recipes..."
                  className="flex-grow p-2 border border-gray-300 rounded-l"
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="bg-[#3C4E2A] text-[#F5E9D4] px-4 py-2 rounded-r"
                  disabled={loading}
                >
                  Send
                </button>
              </form>
              <div className="mt-2 text-sm text-gray-600">
                Calories left for today: {caloriesLeft}
              </div>
            </>
          )}
        </div>
      );
    }