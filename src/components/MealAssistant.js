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
  const [dietaryPreference, setDietaryPreference] = useState('');

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

      const systemPrompt = `
        You are a helpful meal planning assistant. The user has ${caloriesLeft} calories left for the day and their dietary preference is ${dietaryPreference}. 
        Always consider their dietary preference in your recommendations.

        Follow these steps:
        1. Ask if they want to cook or eat out today.

        If they want to cook:
        2. Ask if they have specific ingredients, a cuisine preference, or a meal in mind or they are halal or not.
        3. Use the appropriate tool based on their response:
           - FindRecipesByIngredients for specific ingredients
           - ${dietaryPreference === 'halal' ? 'HalalRecipeSearch' : 'ComplexRecipeSearch'} for cuisine preferences or specific meals
        4. Use GetRecipeInformation to check if recipes fit their calorie needs.
        5. If a recipe doesn't fit, suggest adjusting portions or finding alternatives.
        6. Once they choose a recipe, use GetRecipeInstructions for cooking steps.
        7. If any of the tools fail, answer based on what you know.

        If they want to eat out:
        2. Ask for their preferred cuisine or restaurant type.
        3. Use GoogleSearch to find restaurants in Singapore, including "${dietaryPreference}" in the query if it's a specific dietary requirement.
        4. Suggest options and ask for their choice.
        5. If applicable, emphasize restaurants that cater to their dietary preference.
        6. If any of the tools fail, answer based on what you know.

         Additional instructions:
        - Be attentive to requests for new suggestions or alternatives. If the user asks for different options, use the appropriate tool to find new recipes or restaurants.
        - Always be concise and relevant in your responses.
        - Ask for clarification if the user's request is unclear.
        - Do not invent information or recipes. Only use data from the provided tools.
        - If unsure about dietary compliance, recommend the user to verify with the restaurant or check ingredients carefully.
        - Keep track of the conversation context and refer back to previous suggestions or requests when appropriate.

        Remember, your goal is to help the user find suitable meal options that fit their dietary preferences and calorie needs, whether they're cooking at home or eating out.
      `;

      const llmWithTools = model.bindTools(tools);

      const prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(systemPrompt),
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
  
      let toolResults = [];
  
  if (initialResponse.additional_kwargs && initialResponse.additional_kwargs.tool_calls) {
      for (const toolCall of initialResponse.additional_kwargs.tool_calls) {
        if (toolCall.function && toolCall.function.name) {
          const tool = tools.find(t => t.name === toolCall.function.name);
          if (tool) {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const toolOutput = await tool.func(args.input);
              let parsedToolOutput;
              try {
                parsedToolOutput = JSON.parse(toolOutput);
              } catch {
                parsedToolOutput = toolOutput;
              }
              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: toolCall.function.name,
                content: parsedToolOutput.text || parsedToolOutput
              });
            } catch (error) {
              console.error(`Error executing tool ${toolCall.function.name}:`, error);
              toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: toolCall.function.name,
                content: `Error: ${error.message}`
              });
            }
          }
        }
      }
    }

    console.log('Tool results:', toolResults);

    let responseContent = '';

    if (toolResults.length > 0) {
      const toolResultsPrompt = toolResults.map(result => `${result.name}: ${result.content}`).join('\n\n');
      
      const finalResponse = await chain.invoke({
        input: `Based on these tool results, provide a summary and recommendation for the user:\n${toolResultsPrompt}`
      });

      responseContent = finalResponse.content || toolResults[0].content;
    } else if (initialResponse.content) {
      responseContent = initialResponse.content;
    } else {
      responseContent = "I'm sorry, I couldn't generate a response. Could you please rephrase your question?";
    }

    setChatHistory(prev => [...prev, { role: 'assistant', content: responseContent }]);
  } catch (error) {
    console.error('Error processing request:', error);
    setChatHistory(prev => [...prev, { role: 'assistant', content: `I'm sorry, there was an error processing your request: ${error.message}` }]);
  } finally {
    setLoading(false);
    setUserInput('');
  }
};
  
  

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {!isChatStarted ? (
        <form onSubmit={handleCaloriesSubmit} className="mb-4">
          <label htmlFor="calories" className="block mb-2 font-semibold">Enter your remaining calories for the day:</label>
          <input
            type="number"
            id="calories"
            value={caloriesLeft}
            onChange={(e) => setCaloriesLeft(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4"
            required
          />
          <button type="submit" className="w-full bg-[#3C4E2A] text-[#F5E9D4] px-4 py-2 rounded hover:bg-[#2A3E1A] transition-colors">
            Start Meal Planning
          </button>
        </form>
      ) : (
        <>
          <div className="h-96 mb-4 p-4 bg-gray-100 rounded overflow-y-auto">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-[#3C4E2A] text-[#F5E9D4]' : 'bg-white border border-gray-300'}`}>
                  {msg.content}
                </span>
              </div>
            ))}
            {loading && <div className="text-center text-gray-500">Thinking...</div>}
          </div>
          <form onSubmit={handleSubmit} className="flex mb-4">
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
              className="bg-[#3C4E2A] text-[#F5E9D4] px-4 py-2 rounded-r hover:bg-[#2A3E1A] transition-colors"
              disabled={loading}
            >
              Send
            </button>
          </form>
          <div className="text-sm text-gray-600">
            Calories left for today: <span className="font-semibold">{caloriesLeft}</span>
          </div>
        </>
      )}
    </div>
  );
}